const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { isValid: isValidDid, toAddress } = require('@arcblock/did');
const { printSuccess, printError } = require('../../util');
const { getNode } = require('../../node');

exports.run = async ({ target, appDid }) => {
  if (!appDid) {
    printError('Please provide `--app-did` when cleanup cache or backup');
    process.exit(1);
  }
  if (isValidDid(appDid) === false) {
    printError(`appDid is not valid: ${appDid}`);
    process.exit(1);
  }

  // eslint-disable-next-line
  appDid = toAddress(appDid);

  const { node } = await getNode({ dir: process.cwd() });
  node.onReady(async () => {
    const blocklet = await node.getBlocklet({ did: appDid });
    if (!blocklet) {
      printError(`Blocklet ${appDid} not found`);
      process.exit(1);
    }

    if (target === 'cache') {
      const removed = await node.clearCache({ pattern: null, teamDid: appDid });
      printSuccess(`Cache for app ${appDid} cleared: ${removed.join(',')}`);
      process.exit(0);
    }

    if (target === 'backup') {
      await node.configBlocklet({
        did: appDid,
        configs: [
          {
            key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
            value: '',
          },
        ],
      });
      await node.updateAutoBackup({ did: appDid, autoBackup: { enabled: false } });

      printSuccess(`Blocklet ${appDid} auto-backup disabled`);
      process.exit(0);
    }

    printError(`Unknown cleanup target: ${target}`);
    process.exit(1);
  });
};
