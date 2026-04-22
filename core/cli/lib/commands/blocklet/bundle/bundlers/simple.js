const ISO6391 = require('iso-639-1');

const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');
const { join } = require('path');
const BlockletMdBundler = require('./blocklet');
const ChangelogBundler = require('./changelog');
const LogoBundler = require('./logo');
const ReadmeMdBundler = require('./readme');
const PreferenceBundler = require('./preference');
const ScreenshotsBundler = require('./screenshots');

class SimpleBundler {
  /**
   * Creates an instance of SimpleBundler.
   * @param {{
   *  blockletDir: string,
   *  inMonoRepo: boolean,
   *  withChangeLog: boolean,
   *  meta: {
   *    logo: string,
   *  }
   * }} { blockletDir, inMonoRepo, withChangeLog, meta }
   * @memberof SimpleBundler
   */
  constructor({ blockletDir, inMonoRepo, withChangeLog, meta }) {
    this.blockletDir = blockletDir;
    this.inMonoRepo = inMonoRepo;
    this.withChangeLog = withChangeLog;
    this.meta = meta;
  }

  async bundle() {
    const locales = ISO6391.getAllCodes();
    const { blockletDir, inMonoRepo } = this;
    const bundleDir = join(this.blockletDir, BLOCKLET_BUNDLE_FOLDER);

    const blockletMdPromises = locales.map((locale) => {
      if (locale === 'en') {
        return new BlockletMdBundler({
          blockletDir,
          blockletMdFileName: 'blocklet.md',
          backupMdFileNames: ['blocklet.en.md', 'README.md'],
          duplicateMdFileName: 'blocklet.en.md',
          required: true,
        }).bundle();
      }
      return new BlockletMdBundler({
        blockletDir,
        blockletMdFileName: `blocklet.${locale}.md`,
      }).bundle();
    });

    await new ScreenshotsBundler({ blockletDir, bundleDir, meta: this.meta }).bundle();
    await new LogoBundler({ blockletDir, logoFileName: this.meta.logo }).bundle();

    await Promise.all([
      ...blockletMdPromises,
      this.withChangeLog
        ? new ChangelogBundler({
            blockletDir,
            inMonoRepo,
          }).bundle()
        : Promise.resolve(null),
      new ReadmeMdBundler({ blockletDir }).bundle(),
      new PreferenceBundler({ blockletDir }).bundle(),
    ]);
  }
}

module.exports = SimpleBundler;
