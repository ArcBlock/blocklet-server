const path = require('path');
const fromMarkdown = require('mdast-util-from-markdown');
const detectWorkspace = require('@abtnode/util/lib/detect-workspace');
const fs = require('fs-extra');
const { BLOCKLET_BUNDLE_FOLDER } = require('@blocklet/constant');
const fg = require('fast-glob');
const chalk = require('chalk');
const { printError } = require('../../../../util');

class ChangelogBundler {
  constructor({ blockletDir, inMonoRepo }) {
    this.blockletDir = blockletDir;
    this.inMonoRepo = inMonoRepo;
    this.bundlerDir = path.join(this.blockletDir, BLOCKLET_BUNDLE_FOLDER);
    this.changelogFileName = 'CHANGELOG.md';
  }

  /**
   *
   *
   * @return {string | null} changelog.md absolute path
   * @memberof ChangelogBundler
   */
  _find() {
    const found = fg.sync(this.changelogFileName, {
      cwd: this.blockletDir,
      deep: 1,
      caseSensitiveMatch: false,
      onlyFiles: true,
      absolute: true,
    });

    if (found.length === 1) {
      return found[0];
    }

    if (found.length > 1) {
      printError(
        `Only one ${chalk.red(this.changelogFileName)}(not case sensitive) can exist in ${chalk.cyan(this.blockletDir)}`
      );
      process.exit(1);
    }

    if (this.inMonoRepo) {
      const workspace = detectWorkspace(this.blockletDir);
      if (workspace) {
        const foundByMonoRepo = fg.sync(this.changelogFileName, {
          cwd: workspace.dir,
          deep: 1,
          caseSensitiveMatch: false,
          onlyFiles: true,
          absolute: true,
        });

        if (foundByMonoRepo.length === 1) {
          return foundByMonoRepo[0];
        }

        if (foundByMonoRepo.length > 1) {
          printError(
            `Only one ${chalk.red(this.changelogFileName)}(not case sensitive) can exist in ${chalk.cyan(
              workspace.dir
            )}`
          );
          process.exit(1);
        }
      }
    }

    return null;
  }

  async _bundle(changelogAbsolutePath) {
    if (changelogAbsolutePath && fs.existsSync(changelogAbsolutePath)) {
      await fs.copy(changelogAbsolutePath, path.join(this.bundlerDir, this.changelogFileName));
    }
  }

  _validate(changelogAbsolutePath) {
    if (changelogAbsolutePath && fs.existsSync(changelogAbsolutePath)) {
      const ast = fromMarkdown(fs.readFileSync(changelogAbsolutePath));
      const children = ast?.children || [];
      children.forEach((element) => {
        // Only h1–h4 headings are supported
        if (element.type === 'heading' && element.depth > 4) {
          const line = element.position?.start.line || 0;
          printError(`Just h1~h4 headings should be used in ${chalk.cyan(changelogAbsolutePath)} at line ${line}`);
          process.exit(1);
        }
      });
    }
  }

  async bundle() {
    const changelogAbsolutePath = await this._find();
    this._validate(changelogAbsolutePath);
    await this._bundle(changelogAbsolutePath);
  }
}

module.exports = ChangelogBundler;
