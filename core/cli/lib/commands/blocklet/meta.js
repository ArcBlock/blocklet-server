const { parse: getBlockletMeta } = require('@blocklet/meta/lib/parse');

const { printError, printInfo } = require('../../util');
const { pretty } = require('../../ui');
const debug = require('../../debug')('blocklet:meta');

exports.run = () => {
  try {
    const dir = process.cwd();

    printInfo('Reading blocklet meta from', dir);

    const meta = getBlockletMeta(dir, { ensureComponentStore: false });
    printInfo('Blocklet meta', pretty(meta));

    process.exit(0);
  } catch (error) {
    debug('read blocklet meta failed', error);
    printError('Read blocklet meta failed:', error.message);
    process.exit(1);
  }
};
