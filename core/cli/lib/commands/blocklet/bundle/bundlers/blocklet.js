const chalk = require('chalk');
const fg = require('fast-glob');
const isEmpty = require('lodash/isEmpty');
const { printError, printWarning, print } = require('../../../../util');
const MarkdownBundler = require('./markdown');

class BlockletMdBundler extends MarkdownBundler {
  static BLOCKLET_MD_REGEX = /blocklet\.[\S]*md$/i;

  /**
   * Creates an instance of BlockletMdBundler.
   * @param {{
   *  blockletDir: string,
   *  blockletMdFileName: string, // Convention: the blocklet.md filename must be lowercase
   *  backupMdFileNames?: string[];
   *  required?: boolean = false;
   *  duplicateMdFileName?: string;
   * }} { blockletDir, backupMdFileNames, backupMdFileName, required, duplicateMdFileName }
   * @memberof BlockletMdBundler
   */
  constructor({ blockletDir, blockletMdFileName, backupMdFileNames, required = false, duplicateMdFileName }) {
    super({ blockletDir });
    this.blockletMdFileName = blockletMdFileName;
    this.backupMdFileNames = backupMdFileNames;
    this.required = required;
    this.duplicateMdFileName = duplicateMdFileName;
    this.fastGlobOptions = {
      cwd: this.blockletDir,
      deep: 1,
      caseSensitiveMatch: false,
      onlyFiles: true,
      absolute: true,
    };
  }

  /**
   *
   *
   * @return {string[]} blocklet.md absolute paths
   * @memberof BlockletMdBundler
   */
  async _find() {
    const found = fg.sync(this.blockletMdFileName, this.fastGlobOptions);

    if (found.length === 0 && !isEmpty(this.backupMdFileNames)) {
      const foundByBackupMdFileName = await this._findByBackupFileNames();
      if (foundByBackupMdFileName.length === 1) {
        return foundByBackupMdFileName;
      }
    }

    if (found.length === 0 && this.required) {
      printError(`File ${chalk.red(this.blockletMdFileName)} must exist in ${chalk.cyan(this.blockletDir)}`);
      process.exit(1);
    }

    if (found.length > 1) {
      printError(
        `Only one ${chalk.red(this.blockletMdFileName)}(not case sensitive) can exist in ${chalk.cyan(
          this.blockletDir
        )}`
      );
      process.exit(1);
    }

    if (this.duplicateMdFileName) {
      await this.warnDuplicateMdFileName();
    }

    return found;
  }

  _findByBackupFileNames() {
    for (const backupMdFileName of this.backupMdFileNames) {
      // Try to find a backup file
      const foundByBackupMdFileName = fg.sync(backupMdFileName, this.fastGlobOptions);

      if (foundByBackupMdFileName.length === 1) {
        // Exactly one backup file found
        return foundByBackupMdFileName;
      }

      if (foundByBackupMdFileName.length > 1) {
        // Multiple backup files found — ambiguous, cannot determine which one to use
        printError(
          `Only one ${chalk.red(backupMdFileName)}(not case sensitive) can exist in ${chalk.cyan(this.blockletDir)}`
        );
        process.exit(1);
      }
    }

    if (this.required) {
      // No backup file found either, but this file is required — abort the current task
      printError(
        `Either ${chalk.red(this.blockletMdFileName)} or ${this.backupMdFileNames
          .map((backupMdFileName) => chalk.red(backupMdFileName))
          .join(',')} should exist in ${chalk.cyan(this.blockletDir)}`
      );
      process.exit(1);
    }

    return [];
  }

  warnDuplicateMdFileName() {
    const foundByDuplicateMdFileName = fg.sync(this.duplicateMdFileName, this.fastGlobOptions);

    if (foundByDuplicateMdFileName.length) {
      // The blank line is intentional: without it, the warning would appear on the same line as other output
      print();
      printWarning(
        `File ${chalk.cyan(this.blockletMdFileName)} is currently in use, file ${chalk.yellow(
          this.duplicateMdFileName
        )} is ignored`
      );
    }
  }

  bundle() {
    return super.bundle();
  }

  /**
   *
   *
   * @param {string} dest
   * @param {string | NodeJS.ArrayBufferView} data
   * @memberof BlockletMdBundler
   */
  async writeFile(dest, data) {
    await super.writeFile(
      dest.replace(BlockletMdBundler.BLOCKLET_MD_REGEX, this.blockletMdFileName.toLowerCase()),
      data
    );
  }
}

module.exports = BlockletMdBundler;
