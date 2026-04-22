const { fromPublicKey } = require('@ocap/wallet');
const { toDelegateAddress } = require('@arcblock/did-util');
const { toTypeInfo } = require('@arcblock/did');
const { getChainClient } = require('@abtnode/util/lib/get-chain-client');
const formatContext = require('@abtnode/util/lib/format-context');

const logger = require('@abtnode/logger')(require('../../../package.json').name);

const messages = {
  selectNFTOwner: {
    en: 'Please select the owner of the NFT to proceed',
    zh: '请选择 NFT 所有者',
  },
  authorizeToServer: {
    en: 'Please authorize Blocklet Server to transfer owner NFT',
    zh: '请授权该节点交易 NFT',
  },
};

module.exports = function createRoutes(node) {
  return {
    action: 'delegate-transfer-nft',
    authPrincipal: false,
    claims: [
      {
        authPrincipal: async ({ extraParams: { locale } }) => {
          const info = await node.getNodeInfo();

          return {
            target: info.ownerNft.holder,
            chainInfo: { host: info.launcher.chainHost },
            description: messages.selectNFTOwner[locale],
          };
        },
      },
      {
        signature: async ({ userDid, userPk, extraParams: { locale } }) => {
          const info = await node.getNodeInfo();

          return {
            type: 'DelegateTx',
            chainInfo: { host: info.launcher.chainHost },
            data: {
              from: userDid,
              pk: userPk,
              itx: {
                address: toDelegateAddress(userDid, info.did),
                to: info.did,
                ops: [{ typeUrl: 'fg:t:transfer_v2', rules: [] }],
              },
            },
            description: messages.authorizeToServer[locale],
          };
        },
      },
    ],
    onAuth: async ({ userDid, userPk, claims, req }) => {
      const info = await node.getNodeInfo();
      const claim = claims.find(x => x.type === 'signature');
      const client = getChainClient(info.launcher.chainHost);

      logger.info('delegating.onAuth', { userDid, userPk, claims });

      const tx = client.decodeTx(claim.origin);
      const hash = await client.sendDelegateTx({
        tx,
        wallet: fromPublicKey(userPk, toTypeInfo(userDid)),
        signature: claim.sig,
      });

      logger.info('delegated.onAuth', { userDid, userPk, hash });

      const owner = await node.getOwner({ teamDid: info.did });

      await node.createAuditLog(
        {
          action: 'delegateTransferNFT',
          args: { owner: userDid, reason: 'delegate server to transfer nft' },
          context: formatContext(Object.assign(req, { user: owner })),
        },
        node
      );

      return { hash, tx: claim.origin };
    },
  };
};
