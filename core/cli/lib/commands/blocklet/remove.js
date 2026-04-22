const chalk = require('chalk');
const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');
const { select: getMetaFile, update: updateMetaFile } = require('@blocklet/meta/lib/file');

const { printSuccess, printError } = require('../../util');
const { fixComponents } = require('../../util/blocklet/meta');
const debug = require('../../debug')('blocklet:version');

exports.run = (component) => {
  try {
    const dir = process.cwd();
    const file = getMetaFile(dir);
    const meta = getBlockletMeta(dir, { fix: false });

    fixComponents(meta);

    meta.components = meta.components || [];

    if (!meta.components.find((x) => x.name === component)) {
      printError(`Cannot find component with name ${chalk.cyan(component)}`);
      process.exit(1);
    }

    meta.components = meta.components.filter((x) => x.name !== component);

    updateMetaFile(file, meta, { fix: false });
    printSuccess(`Component ${chalk.cyan(component)} was successfully removed`);

    process.exit(0);
  } catch (error) {
    debug('Failed remove component', error);
    printError('Failed remove component: ', error.message);
    process.exit(1);
  }
};
