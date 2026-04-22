const { validateSession } = require('@abtnode/core/lib/blocklet/security/vault');

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  const messages = {
    signMessage: {
      en: 'Sign following message to prove that you are the owner of the vault address',
      zh: '签名如下消息以证明你是冷钱包地址的拥有者',
    },
  };

  return {
    action: 'config-vault',
    authPrincipal: false,
    claims: [
      {
        authPrincipal: async ({ context, extraParams: { locale, sessionId } }) => {
          const blocklet = await context.request.getBlocklet();
          const session = await validateSession(node, sessionId);
          if (session.teamDid !== blocklet.appPid) {
            throw new Error('Vault config session belongs to another blocklet');
          }

          return {
            description: messages.signMessage[locale] || messages.signMessage.en,
            target: session.vaultDid,
            supervised: false,
          };
        },
      },
      {
        signature: async ({ context, extraParams: { locale, sessionId } }) => {
          const blocklet = await context.request.getBlocklet();
          const session = await validateSession(node, sessionId);

          return {
            description: messages.signMessage[locale] || messages.signMessage.en,
            data: [
              `vault:${blocklet.appPid}`,
              ...blocklet.vaults.map((vault) => vault.did),
              session.vaultDid,
              session.approverSig,
            ].join(':'),
            type: 'mime:text/plain',
          };
        },
      },
    ],

    onAuth: async ({ userDid, userPk, claims, extraParams }) => {
      const claim = claims.find((x) => x.type === 'signature');
      await node.commitVault({ sessionId: extraParams.sessionId, userDid, userPk, signature: claim.sig });
    },
  };
};
