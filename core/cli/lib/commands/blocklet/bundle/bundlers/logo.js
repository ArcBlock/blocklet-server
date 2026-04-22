const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');
const { validateLogo } = require('@blocklet/images');
const { print, printError, printInfo, printWarning } = require('../../../../util');

class LogoBundler {
  static minSide = 256;

  /**
   * Creates an instance of LogBundler.
   * @param {{
   *  blockletDir: string,
   *  minSide: number = LogoBundler.minSide,
   *  logoFileName: string,
   *  maxFileSize: string = "100KB",
   * }} { widthPx, heightPx, logoFileName }
   * @see https://looka.com/blog/logo-size-guidelines/
   * @memberof LogBundler
   */
  constructor({ blockletDir = '', minSide = LogoBundler.minSide, logoFileName = '', maxFileSize = 1024 }) {
    this.blockletDir = blockletDir;
    this.logoFileName = logoFileName;
    this.minSide = minSide;
    this.maxFileSize = maxFileSize;

    this.sourceLogoPath = path.join(blockletDir, logoFileName);
    this.targetLogoPath = path.join(blockletDir, BLOCKLET_BUNDLE_FOLDER, logoFileName);
  }

  _verify() {
    const errorMessages = validateLogo(this.logoFileName, {
      extractedFilepath: this.blockletDir,
      width: this.minSide,
      maxSize: this.maxFileSize,
    });
    if (errorMessages.length) {
      print('');
      printWarning('Blocklet bundle failed! Please check the following errors about logo:');
      errorMessages.forEach((errorMessage) => printError(errorMessage));
      printInfo(
        `You can run the command "${chalk.cyan('blocklet dev studio')}" to help you generate more standard images.`
      );
      print('');
      process.exit(1);
    }
  }

  async bundle() {
    this._verify();
    await fs.copy(this.sourceLogoPath, this.targetLogoPath);
  }
}

module.exports = LogoBundler;
