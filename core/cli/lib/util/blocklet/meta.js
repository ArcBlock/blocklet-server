const chalk = require('chalk');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { parseComponents } = require('@blocklet/resolver');
const { formatError } = require('@blocklet/error');

const { printSuccess, printError, printInfo } = require('../index');

const fixComponents = (meta) => {
  if (meta.children) {
    meta.components = meta.children;
    delete meta.children;
  }
};

const checkCircularDependencies = async (meta) => {
  try {
    const cloneMeta = cloneDeep(meta);
    await parseComponents(
      { meta: cloneMeta },
      { didKey: 'did', ancestors: [{ meta: cloneMeta }] },
      { error: printError, info: printInfo }
    );
    printSuccess('Blocklet components verify success!');
  } catch (err) {
    printError(`Blocklet components verify failed: ${chalk.red(formatError(err))}`);
    if (process.env.DEBUG) {
      console.error(err);
    }
    process.exit(1);
  }
};

module.exports = {
  fixComponents,
  checkCircularDependencies,
};
