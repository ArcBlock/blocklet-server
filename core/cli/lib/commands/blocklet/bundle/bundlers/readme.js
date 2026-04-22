const fg = require('fast-glob');
const MarkdownBundler = require('./markdown');

class ReadmeMdBundler extends MarkdownBundler {
  static README_MD_REGEX = /README\.[\S]*md$/i;

  constructor({ blockletDir }) {
    super({ blockletDir });
    this.readmeMdFileName = 'README.md';
  }

  /**
   *
   *
   * @return {string[]} blocklet.md absolute path
   * @memberof BlockletMdBundler
   */
  _find() {
    const found = fg.sync(this.readmeMdFileName, {
      cwd: this.blockletDir,
      deep: 1,
      caseSensitiveMatch: false,
      onlyFiles: true,
      absolute: true,
    });

    if (found.length > 1) {
      throw new Error(`Only one ${this.readmeMdFileName}(not case sensitive) can exist in ${this.blockletDir}`);
    }

    return found;
  }

  bundle() {
    return super.bundle();
  }

  async writeFile(dest, data) {
    await super.writeFile(dest.replace(ReadmeMdBundler.README_MD_REGEX, this.readmeMdFileName), data);
  }
}

module.exports = ReadmeMdBundler;
