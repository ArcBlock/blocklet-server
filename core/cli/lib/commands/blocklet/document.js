const { toAddress } = require('@ocap/util');
const { publishDidDocument } = require('@abtnode/core/lib/util/blocklet');

const { getNode } = require('../../node');
const debug = require('../../debug')('document');
const { printSuccess, printError } = require('../../util');
const { wrapSpinner } = require('../../ui');

const update = async (appId) => {
  try {
    const { node } = await getNode();
    const nodeInfo = await node.getNodeInfo();

    const did = toAddress(appId);

    const blocklet = await node.getBlocklet({ did });
    if (!blocklet) {
      printError(`Blocklet ${appId} not found`);
      process.exit(1);
    }

    await wrapSpinner(
      'Updating...',
      async () => {
        let ownerInfo;
        if (blocklet.settings?.owner?.did) {
          ownerInfo = await node.getUser({ teamDid: blocklet.appPid, user: { did: blocklet.settings.owner.did } });
        }

        return publishDidDocument({ blocklet, ownerInfo, nodeInfo });
      },
      {
        throwOnError: true,
        printErrorFn: printError,
      }
    );

    printSuccess(`Update did document for ${appId} successfully!`);
    process.exit(0);
  } catch (error) {
    debug(error);
    printError(`Failed to update did document for blocklet ${appId}, error: ${error.message}`);

    process.exit(1);
  }
};

module.exports = {
  update,
};
