const { types } = require('@ocap/mcrypto');
const { fromSecretKey } = require('@ocap/wallet');
const { fromBase58, toBase58 } = require('@ocap/util');

module.exports = {
  action: 'gen-key-pair',

  onConnect: ({ extraParams }) => {
    const { monikers = '' } = extraParams || {};
    const monikerList = monikers.split(',').filter(x => x !== '');
    if (monikerList.length === 0) {
      throw new Error('App name can not be empty');
    }

    const claims = monikerList.map(moniker => {
      return {
        keyPair: {
          mfa: false,
          description: `Please generate DID for blocklet: ${moniker}`,
          moniker,
          targetType: {
            role: 'blocklet',
            hash: 'sha3',
            key: 'ed25519',
            encoding: 'base58',
          },
        },
      };
    });

    return claims;
  },

  onAuth: async ({ req, claims, updateSession }) => {
    const prevConfig = req.context?.store?.config || [];
    const results = claims
      .filter(x => x.type === 'keyPair')
      .map(claim => {
        const app = fromSecretKey(fromBase58(claim.secret), {
          role: types.RoleType.ROLE_BLOCKLET,
        });

        const publicKey = toBase58(app.publicKey);
        const { address } = app;

        return {
          address,
          publicKey,
        };
      });

    await updateSession('config', [...prevConfig, ...results], false);
    return results;
  },
};
