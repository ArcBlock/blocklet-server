const isEmpty = require('lodash/isEmpty');
const last = require('lodash/last');

const { validateSession } = require('@abtnode/core/lib/blocklet/security/vault');
const { getWalletDid } = require('@blocklet/meta/lib/did-utils');

// eslint-disable-next-line no-unused-vars
module.exports = function createRoutes(node, authenticator, createSessionToken) {
  const messages = {
    signMessage: {
      en: 'Sign following message to approve vault changes',
      zh: '签名如下消息以批准冷钱包地址变更',
    },
  };

  return {
    action: 'approve-vault',
    authPrincipal: false,
    claims: [
      {
        authPrincipal: async ({ context, extraParams: { locale, sessionId } }) => {
          const blocklet = await context.request.getBlocklet();
          const session = await validateSession(node, sessionId);
          if (session.teamDid !== blocklet.appPid) {
            throw new Error('Vault config session belongs to another blocklet');
          }

          let targetDid;
          if (isEmpty(blocklet.vaults)) {
            const ownerDid = blocklet.settings.owner?.did;
            if (!ownerDid) {
              throw new Error('Blocklet owner must present before config vault');
            }

            const owner = await node.getUser({
              teamDid: session.teamDid,
              user: { did: ownerDid },
              options: { enableConnectedAccount: true },
            });
            if (!owner) {
              throw new Error(`Blocklet owner not found: ${ownerDid}`);
            }

            targetDid = getWalletDid(owner);
          } else {
            targetDid = last(blocklet.vaults).did;
          }

          if (!targetDid) {
            throw new Error('Vault approver can not be determined');
          }

          return {
            description: messages.signMessage[locale] || messages.signMessage.en,
            target: targetDid,
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
            data: [`vault:${blocklet.appPid}`, ...blocklet.vaults.map((vault) => vault.did), session.vaultDid].join(
              ':'
            ),
            type: 'mime:text/plain',
          };
        },
      },
    ],

    onAuth: async ({ userDid, userPk, claims, extraParams }) => {
      const claim = claims.find((x) => x.type === 'signature');
      await node.approveVault({ sessionId: extraParams.sessionId, userDid, userPk, signature: claim.sig });
    },
  };
};
