const fs = require('fs-extra');
const path = require('path');
const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');
const fromMarkdown = require('mdast-util-from-markdown');
const toMarkdown = require('mdast-util-to-markdown');
const crypto = require('crypto');
const { parser } = require('posthtml-parser');
const { render } = require('posthtml-render');
const isEmpty = require('lodash/isEmpty');
const isArray = require('lodash/isArray');
const chalk = require('chalk');
const { isLocalUri } = require('../../../../util/what-uri');
const { printError } = require('../../../../util');

class MarkdownBundler {
  /**
   * Creates an instance of MarkdownBundler.
   * @param {{
   *  blockletDir: string
   * }} { blockletDir }
   * @memberof MarkdownBundler
   */
  constructor({ blockletDir }) {
    this.blockletDir = blockletDir;
    this.bundleDir = path.join(this.blockletDir, BLOCKLET_BUNDLE_FOLDER);
    this.mediaBundleDir = path.join(this.bundleDir, 'media');
    this.mediaBaseUrl = '/assets/media';
  }

  /**
   *
   * @return {string[]} blocklet.md files absolute path list
   * @memberof MarkdownBundler
   */
  _find() {
    throw new Error('Not implemented');
  }

  /**
   *
   *
   * @return {Promise<void>}
   * @memberof MarkdownBundler
   */
  bundle() {
    return this._bundle();
  }

  /**
   *
   * @description Extract local static assets from all blocklet.md files into the bundle's media folder
   * @param {*} blockletDir
   */
  async _bundle() {
    const markdownAbsolutePaths = await this._find();
    const cache = new Map();

    while (!isEmpty(markdownAbsolutePaths)) {
      const markdownAbsolutePath = markdownAbsolutePaths.shift();
      const mdAstNode = fromMarkdown(fs.readFileSync(markdownAbsolutePath));

      const done = this._handleMdAstNode(mdAstNode, (astNode) => {
        const referenceFile = astNode?.url || astNode?.attrs?.src || astNode?.attrs?.href;
        const localUrl = this._getLocalUrl(referenceFile);

        // FIXME: Add a unit test for this using jest mock later
        if (!fs.existsSync(localUrl)) {
          printError(
            `Referenced file ${chalk.red(referenceFile)} not found when bundling ${chalk.cyan(
              path.basename(markdownAbsolutePath)
            )}`
          );
          process.exit(1);
        }

        // If the referenced path is a directory, report an error — directories are not valid in markdown references
        if (fs.statSync(localUrl).isDirectory()) {
          printError(
            `Only files links are allowed in ${chalk.cyan(
              path.basename(markdownAbsolutePath)
            )}, found a folder ${chalk.red(referenceFile)}`
          );
          process.exit(1);
        }

        if (!cache.get(localUrl)) {
          cache.set(localUrl, null);
          return false;
        }

        const { storeStaticUrl } = cache.get(localUrl);

        if (astNode?.url) {
          astNode.url = storeStaticUrl;
        }

        if (astNode?.attrs?.src) {
          astNode.attrs.src = storeStaticUrl;
        }

        if (astNode?.attrs?.href) {
          astNode.attrs.href = storeStaticUrl;
        }

        return true;
      });

      if (done) {
        // eslint-disable-next-line no-await-in-loop
        await this.writeFile(path.join(this.bundleDir, path.basename(markdownAbsolutePath)), toMarkdown(mdAstNode));
      } else {
        // Some assets have not yet had their hash computed or been copied into the bundle,
        // so blocklet.md is not fully processed and its asset references cannot be rewritten yet.
        // eslint-disable-next-line no-await-in-loop
        await this._batchHash(cache);
        // eslint-disable-next-line no-await-in-loop
        await this._batchCopy(cache);
        // Not finished yet — push back for reprocessing in the next iteration
        markdownAbsolutePaths.push(markdownAbsolutePath);
      }
    }
  }

  /**
   *
   *
   * @param {string} dest
   * @param {string | NodeJS.ArrayBufferView} data
   * @memberof MarkdownBundler
   */
  writeFile(dest, data) {
    fs.writeFileSync(dest, data);
  }

  _batchHash(cache) {
    return Promise.all(
      [...cache.keys()].map((localUrl) => {
        return this._getTargetUrls(localUrl).then((targetUrls) => {
          cache.set(localUrl, targetUrls);
        });
      })
    );
  }

  _batchCopy(cache) {
    return Promise.all(
      [...cache.keys()].map((localUrl) => {
        const { mediaBundleUrl } = cache.get(localUrl);
        return fs.ensureDir(path.dirname(mediaBundleUrl)).then(() => fs.copy(localUrl, mediaBundleUrl));
      })
    );
  }

  _handleMdAstNode(mdAstNode, callback) {
    let done = true;

    if (this._isLocalUrl(mdAstNode?.url)) {
      done = done && callback(mdAstNode);
    }

    if (this._isHtmlNode(mdAstNode)) {
      const hastNode = parser(mdAstNode?.value);
      done = done && this._handleHastNode(hastNode, callback);
      mdAstNode.value = render(hastNode);
    }

    if (mdAstNode?.children) {
      done = mdAstNode.children.reduce(
        (preValue, astNode) => this._handleMdAstNode(astNode, callback) && preValue,
        done
      );
    }

    return done;
  }

  _handleHastNode(root, callback) {
    let done = true;

    const currentRoot = isArray(root) ? root : [root];

    currentRoot.forEach((children) => {
      if (this._isLocalUrl(children?.attrs?.src || children?.attrs?.href)) {
        done = callback(children) && done;
      }

      if (isArray(children?.content)) {
        done = children.content.reduce((preValue, _root) => this._handleHastNode(_root, callback) && preValue, done);
      }
    });

    return done;
  }

  /**
   *
   *
   * @param {string} url
   * @return {boolean}
   * @memberof BundleMarkdown
   */
  _isLocalUrl(url) {
    return isLocalUri(url);
  }

  _isHtmlNode(node) {
    return node?.type === 'html';
  }

  _getLocalUrl(url) {
    return path.join(this.blockletDir, url);
  }

  async _getTargetUrls(localUrl) {
    const fileHash = await this._getFileHash(localUrl);

    const fileDirNameAndFileName = path.join(fileHash.slice(0, 2), `${fileHash.slice(2)}${path.extname(localUrl)}`);

    return {
      mediaBundleUrl: path.join(this.mediaBundleDir, fileDirNameAndFileName),
      storeStaticUrl: path.join(this.mediaBaseUrl, fileDirNameAndFileName),
    };
  }

  _getFileHash(url) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(url);
      stream.on('error', (err) => {
        stream?.destroy();
        reject(err);
      });
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => {
        stream?.destroy();
        resolve(hash.digest('hex'));
      });
    });
  }
}

module.exports = MarkdownBundler;
