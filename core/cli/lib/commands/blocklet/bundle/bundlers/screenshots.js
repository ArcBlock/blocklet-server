const { pathExists, emptyDir, ensureDir, copy } = require('fs-extra');
const { join, extname } = require('path');
const chalk = require('chalk');
const { createReadStream } = require('fs');
const { onlyHash } = require('@arcblock/ipfs-only-hash');
const { validateScreenshots } = require('@blocklet/images');
const { print, printWarning, printInfo, printError } = require('../../../../util');

class ScreenshotsBundler {
  /**
   * Creates an instance of ScreenshotsBundler.
   * @param {{
   *  blockletDir: string,
   *  bundleDir: string,
   *  meta: import('@blocklet/server-js').BlockletMeta
   * }} { blockletDir, bundleDir, meta }
   * @memberof ScreenshotsBundler
   */
  constructor({ blockletDir = '', bundleDir = '', meta }) {
    this.blockletDir = blockletDir;
    this.bundleDir = bundleDir;
    this.meta = meta;

    this.screenshotsBlockletFolder = join(this.blockletDir, 'screenshots');
    this.screenshotsBundleFolder = join(this.bundleDir, 'screenshots');
  }

  /**
   *
   * @return {Promise<void>}
   * @memberof ScreenshotsBundler
   */
  async _bundle() {
    await this._clean();

    if (!this.meta?.screenshots?.length) {
      printWarning('No screenshots found!');
    } else {
      const errorMessages = validateScreenshots(this.meta.screenshots, {
        extractedFilepath: this.blockletDir,
        minWidth: 600,
      });

      if (errorMessages.length) {
        print('');
        printWarning('Blocklet bundle failed! Please check the following errors about screenshots:');
        errorMessages.forEach((errorMessage) => printError(errorMessage));
        printInfo(
          `You can run the command "${chalk.cyan('blocklet dev studio')}" to help you generate more standard screenshots.`
        );
        print('');
        process.exit(1);
      }

      const entryList = await Promise.all(
        this.meta.screenshots.map(async (fileName) => {
          const source = join(this.screenshotsBlockletFolder, fileName);
          if (pathExists(source)) {
            const hash = await onlyHash(createReadStream(source));
            const filename = `${hash}${extname(fileName)}`;
            const target = join(this.screenshotsBundleFolder, filename);
            return { source, target, filename };
          }
          return null;
        })
      );
      await Promise.all(entryList.map((item) => item && copy(item.source, item.target)));
      const filenames = [];
      entryList.forEach((item) => {
        if (item?.filename) {
          filenames.push(item.filename);
        }
      });
      this.meta.screenshots = filenames;
    }
  }

  /**
   * @description Clean up the screenshots bundle directory
   * @memberof ScreenshotsBundler
   */
  async _clean() {
    if (await pathExists(this.screenshotsBundleFolder)) {
      await emptyDir(this.screenshotsBundleFolder);
    }
    await ensureDir(this.screenshotsBundleFolder);
  }

  bundle() {
    return this._bundle();
  }
}

module.exports = ScreenshotsBundler;
