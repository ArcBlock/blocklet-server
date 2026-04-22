const path = require('path');
const fs = require('fs-extra');
const { BLOCKLET_BUNDLE_FOLDER, BLOCKLET_PREFERENCE_FILE } = require('@blocklet/constant');
const fg = require('fast-glob');
const chalk = require('chalk');
const { printError } = require('../../../../util');

class PreferenceBundler {
  constructor({ blockletDir }) {
    this.blockletDir = blockletDir;
    this.bundlerDir = path.join(this.blockletDir, BLOCKLET_BUNDLE_FOLDER);
    this.fileName = BLOCKLET_PREFERENCE_FILE;
  }

  _find() {
    const found = fg.sync(this.fileName, {
      cwd: this.blockletDir,
      deep: 1,
      caseSensitiveMatch: false,
      onlyFiles: true,
      absolute: true,
    });

    if (found.length) {
      const [filePath] = found;
      try {
        fs.readJsonSync(filePath);
        return filePath;
      } catch (err) {
        printError(`Invalid ${chalk.red(this.fileName)} find ${chalk.cyan(this.blockletDir)}`);
        process.exit(1);
      }
    }

    return null;
  }

  async _bundle(filePath) {
    if (filePath) {
      await fs.copy(filePath, path.join(this.bundlerDir, this.fileName));
    }
  }

  async bundle() {
    const filePath = await this._find();
    await this._bundle(filePath);
  }
}

module.exports = PreferenceBundler;
