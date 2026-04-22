const semver = require('semver');
const shell = require('shelljs');
const chalk = require('chalk');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { BLOCKLET_DEFAULT_VERSION, BLOCKLET_LATEST_SPEC_VERSION } = require('@blocklet/constant');
const { select: getMetaFile, update: updateMetaFile } = require('@blocklet/meta/lib/file');

const { printSuccess, printError, printInfo } = require('../../util');
const debug = require('../../debug')('blocklet:version');

// eslint-disable-next-line default-param-last
exports.run = (newVersion = 'patch', { gitCommit = false, force = false }) => {
  try {
    const dir = process.cwd();
    const file = getMetaFile(dir);
    const meta = getBlockletMeta(dir, { ensureComponentStore: false });
    const currentVersion = semver.clean(meta.version) || BLOCKLET_DEFAULT_VERSION;
    const currentSpecVersion = meta.specVersion;

    let nextVersion = null;
    if (semver.valid(newVersion, { loose: true })) {
      nextVersion = semver.clean(newVersion, { loose: true });
    } else {
      nextVersion = semver.inc(currentVersion, newVersion);
    }

    if (!nextVersion) {
      printInfo('Failed to determine next version, abort!');
      process.exit(1);
    }

    if (currentVersion === nextVersion) {
      printInfo('Bumping to same version, skipping');
      process.exit(0);
    }

    meta.version = nextVersion;
    meta.specVersion = BLOCKLET_LATEST_SPEC_VERSION;
    debug('bump blocklet version', { dir, newVersion, currentVersion, nextVersion });

    if (semver.gt(currentSpecVersion, BLOCKLET_LATEST_SPEC_VERSION)) {
      if (!force) {
        // eslint-disable-next-line max-len
        printError(
          `The new specVersion of blocklet.yml (${chalk.cyan(
            BLOCKLET_LATEST_SPEC_VERSION
          )}) is smaller than the current specVersion (${chalk.cyan(currentSpecVersion)})\n`
        );
        printInfo(
          `Please upgrade the version of the "blocklet" command by executing ${chalk.cyan('blocklet server upgrade')}`
        );
        process.exit(1);
      }

      // eslint-disable-next-line max-len
      printInfo(
        `The specVersion of blocklet.yml is about to be downgraded from ${chalk.cyan(
          currentSpecVersion
        )} to ${chalk.cyan(BLOCKLET_LATEST_SPEC_VERSION)}`
      );
    }

    updateMetaFile(file, meta);
    printSuccess(`Blocklet version bumped to ${nextVersion}`);

    if (gitCommit) {
      try {
        shell.exec(`git add ${file.replace(dir, '')}`);
        shell.exec(`git commit -nm "blocklet version ${nextVersion}`);
      } catch (err) {
        printError('Failed to commit to git', err.message);
      }
    }

    process.exit(0);
  } catch (error) {
    debug('bump blocklet version failed', error);
    printError('Bump blocklet version failed: ', error.message);
    process.exit(1);
  }
};
