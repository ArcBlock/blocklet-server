/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const fs = require('fs-extra');
const path = require('path');
const readdirp = require('readdirp');
const ReadableStream = require('readable-stream').Readable;

const modes = require('js-git/lib/modes');
const MixinCreateTree = require('js-git/mixins/create-tree');
const MixinPackOps = require('js-git/mixins/pack-ops');
const MixinWalkers = require('js-git/mixins/walkers');
const MixinCombiner = require('js-git/mixins/read-combiner');
const MixinFormats = require('js-git/mixins/formats');
const logger = require('@abtnode/logger')('@abtnode/timemachine');

const MixinFsDb = require('./mixins/fs-db');

const REF_NAME = 'refs/heads/master';
const VIRTUAL_FILE_NAME = 'data';
const DEFAULT_AUTHOR = {
  name: 'abtnode',
  email: 'blocklet-server@arcblock.io',
};

class Timemachine {
  /**
   * Creates an instance of Timemachine.
   * @param {object} params
   * @param {Array|String|Function} params.sources - what content to snapshot, can be a list of folders/files or just a function
   * @param {String} params.sourcesBase - basedir of the sources file, this is needed to make the snapshot less fs location sensitive
   * @param {String} params.targetDir - where to store the snapshot database
   * @memberof Timemachine
   */
  constructor({ sources, sourcesBase, targetDir }) {
    this.sources = sources;
    this.sourcesBase = sourcesBase;
    this.repo = this._createRepo(targetDir);
  }

  hasSnapshot(hash) {
    return new Promise((resolve) => {
      this.repo.loadAs('commit', hash, (err, commit) => {
        if (err) {
          resolve(false);
        }

        resolve(!!commit);
      });
    });
  }

  exportSnapshot(hash) {
    return new Promise((resolve, reject) => {
      this.repo.loadAs('commit', hash, (err, commit) => {
        if (err) {
          logger.error('Can not read snapshot from repository', { error: err });
          return resolve(null);
        }

        // logger.debug('exportSnapshot.commit', { commit });

        this.repo.loadAs('tree', commit.tree, (e, tree) => {
          if (e) {
            return reject(new Error(`Can not read tree from repository: ${e.message}`));
          }

          // logger.debug('exportSnapshot.tree', { tree });

          const blobs = Object.keys(tree);
          Promise.all(
            blobs.map(
              (x) =>
                new Promise((_resolve, _reject) => {
                  this.repo.loadAs('blob', tree[x].hash, (_e, file) => {
                    // logger.debug('exportSnapshot.blob', { hash: tree[x].hash, file });
                    if (_e) {
                      return _reject(_e);
                    }

                    try {
                      _resolve(file.toString());
                    } catch (__e) {
                      _resolve(file);
                    }
                  });
                })
            )
          ).then((results) => {
            // logger.debug('exportSnapshot.results', { blobs, results });

            if (typeof this.sources === 'function') {
              return resolve(results[0]);
            }

            resolve(
              blobs.reduce((acc, x, i) => {
                acc[x] = results[i];
                return acc;
              }, {})
            );
          });
        });
      });
    });
  }

  async listSnapshots(limit = 10) {
    const latestSnapshot = await this.getLastSnapshot(true);
    if (!latestSnapshot) {
      return [];
    }

    return new Promise((resolve, reject) => {
      this.repo.logWalk(latestSnapshot, (err, walker) => {
        if (err) {
          return reject(new Error(`Cannot get log stream: ${err.message}`));
        }

        let snapshotCount = 0;
        const stream = new ReadableStream({ objectMode: true, read: () => {} });

        const onSnapshot = (e, snapshot) => {
          if (err) {
            console.error(`Error walking the snapshot history: ${e.message}`);
            stream.push(null);
            return;
          }

          if (snapshot) {
            snapshotCount += 1;
            stream.push(snapshot);
            if (snapshotCount >= limit) {
              stream.push(null);
            } else {
              // eslint-disable-next-line no-use-before-define
              scan(onSnapshot);
            }
          } else {
            stream.push(null);
          }
        };

        const scan = () => {
          walker.read(onSnapshot);
        };

        // Kick off the scanner
        scan();

        return resolve(stream);
      });
    });
  }

  async takeSnapshot(message, author, dryRun = false) {
    logger.info('takeSnapshot.params', { message, author, dryRun });

    if (!message) {
      throw new Error('Timemachine cannot take snapshot without a message');
    }

    const { commitHash: parentCommitHash, treeHash: parentTreeHash } = await this.getLastSnapshot();

    const contents = await this._getSourceContents(this.sources);
    // logger.debug('takeSnapshot.contents', { contents });

    const newTreeHash = await this._createNewTree(contents, parentTreeHash);
    // logger.info('takeSnapshot.newTreeHash', { newTreeHash });

    if (dryRun) {
      // TODO: let's remove the object when we are in dry-run mode
      return newTreeHash;
    }

    return new Promise((resolve, reject) => {
      this.repo.saveAs(
        'commit',
        {
          author: author || DEFAULT_AUTHOR,
          tree: newTreeHash,
          message,
          parent: parentCommitHash,
        },
        (err, commitHash) => {
          if (err) {
            return reject(new Error(`Cannot take new snapshot: ${err.message}`));
          }

          logger.info('takeSnapshot.success', { snapshotHash: commitHash, message, dryRun });

          this.repo.updateRef(REF_NAME, commitHash, (e) => {
            if (err) {
              return reject(new Error(`Cannot update ref on new snapshot: ${e.message}`));
            }

            resolve(commitHash);
          });
        }
      );
    });
  }

  getLastSnapshot(shallow = false) {
    return new Promise((resolve, reject) => {
      this.repo.readRef(REF_NAME, (err, commitHash) => {
        if (err) {
          // We are in a new repository
          if (err.message.indexOf('no such file or directory') !== -1) {
            if (shallow) {
              return resolve(null);
            }
            return resolve({ commitHash: null, treeHash: null });
          }
          return reject(new Error(`Cannot read last commit hash from repository: ${err.message}`));
        }

        if (shallow) {
          return resolve(commitHash);
        }

        this.repo.loadAs('commit', commitHash, (e, data) => {
          if (e) {
            return reject(new Error(`Cannot load commit from repository: ${e.message}`));
          }

          data.commitHash = commitHash;
          data.treeHash = data.tree;
          logger.info('lastCommit', data);
          resolve(data);
        });
      });
    });
  }

  destroy() {
    fs.removeSync(this.repo.rootPath);
  }

  async _getSourceContents(sources) {
    if (typeof sources === 'function') {
      const newContent = await sources();
      return { [VIRTUAL_FILE_NAME]: Buffer.isBuffer(newContent) ? newContent : Buffer.from(newContent) };
    }

    const sourceList = (Array.isArray(sources) ? sources : [sources]).map((x) => path.resolve(x));
    sourceList.forEach((source) => {
      if (fs.existsSync(source) === false) {
        throw new Error(`Timemachine can not initialize without not existing source: ${source}`);
      }
    });

    const sourceResults = await Promise.all(
      sourceList
        .map((x) => {
          const stat = fs.statSync(x);
          if (stat.isDirectory()) {
            // FIXME: possible performance issue here: https://www.npmjs.com/package/readdirp
            return readdirp.promise(x).then((files) => files.map((f) => f.fullPath));
          }

          if (stat.isFile()) {
            return [x];
          }

          return null;
        })
        .filter(Boolean)
    );

    const sourceFiles = sourceResults.reduce((acc, x) => acc.concat(x), []);
    logger.debug('sourceFiles', { sourceFiles });

    return sourceFiles.reduce((acc, x) => {
      // FIXME: possible performance bottleneck if sources is a large directory or a large file
      acc[x] = fs.readFileSync(x);
      return acc;
    }, {});
  }

  _createNewTree(contents, parentTreeHash) {
    return new Promise((resolve, reject) => {
      let changes;

      // Create a diff tree
      if (parentTreeHash) {
        changes = Object.keys(contents).map((x) => ({
          path: this._toSourceKey(x),
          mode: modes.file,
          content: contents[x],
        }));

        changes.base = parentTreeHash;

        // Create a new tree
      } else {
        changes = Object.keys(contents).reduce((acc, x) => {
          acc[this._toSourceKey(x)] = {
            mode: modes.file,
            content: contents[x],
          };
          return acc;
        }, {});
      }

      logger.debug('_createNewTree', { parentTreeHash });

      this.repo.createTree(changes, (err, treeHash) => {
        if (err) {
          reject(err);
        } else {
          resolve(treeHash);
        }
      });
    });
  }

  _createRepo(dir) {
    const repo = { rootPath: dir };

    this._createGitSkeleton(dir);

    // Apply mixins, orders matter
    MixinFsDb(repo, fs);
    MixinCreateTree(repo);
    MixinPackOps(repo);
    MixinWalkers(repo);
    MixinCombiner(repo);
    MixinFormats(repo);

    return repo;
  }

  _createGitSkeleton(dir) {
    if (fs.existsSync(path.join(dir, 'objects')).length) {
      return;
    }

    fs.mkdirpSync(path.join(dir, 'info'));
    fs.mkdirpSync(path.join(dir, 'objects/info'));
    fs.mkdirpSync(path.join(dir, 'objects/pack'));
    fs.mkdirpSync(path.join(dir, 'refs/heads'));
    fs.mkdirpSync(path.join(dir, 'refs/tags'));

    fs.outputFileSync(path.join(dir, 'HEAD'), `ref: ${REF_NAME}\n`);
    fs.outputFileSync(
      path.join(dir, 'description'),
      'Unnamed repository; edit this file \'description\' to name the repository.\n' // prettier-ignore
    );
    fs.outputFileSync(
      path.join(dir, 'config'),
      `[core]
    repositoryformatversion = 0
    filemode = true
    bare = ${process.env.NODE_ENV === 'test' ? 'false' : 'true'}
    ignorecase = true
    precomposeunicode = true\n`
    );
    fs.outputFileSync(path.join(dir, 'info/exclude'), '');
  }

  _toSourceKey(sourcePath) {
    return sourcePath.replace(this.sourcesBase, '').replace(/^\//, '');
  }
}

module.exports = Timemachine;
