const { getAppDidOwnerClaims } = require('@abtnode/auth/lib/server');

const logger = require('../../../libs/logger')('blocklet-service:transfer-blocklet-owner');

module.exports = function createRoutes(node) {
  const getBlocklet = async (did) => {
    const blocklet = await node.getBlocklet({ did, attachConfig: false });
    if (!blocklet) {
      throw new Error(`application not found: ${did}`);
    }
    return blocklet;
  };

  return {
    action: 'transfer-app-owner',
    authPrincipal: false,
    claims: getAppDidOwnerClaims(),
    onAuth: async ({ userDid: appDid, updateSession }) => {
      const blocklet = await getBlocklet(appDid);
      if (blocklet.appDid !== appDid) {
        throw new Error(`Invalid appDid. Expect: ${blocklet.appDid}, Actual: ${appDid}`);
      }

      const result = await node.createTransferAppOwnerSession({ appDid });

      logger.info('create transfer app owner', result);

      await updateSession({ result });
    },
  };
};
