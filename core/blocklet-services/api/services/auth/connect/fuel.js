const { fromTokenToUnit } = require('@ocap/util');
const { fromAddress } = require('@ocap/wallet');
const Client = require('@ocap/client');

const logger = require('../../../libs/logger')('auth');

module.exports = function createRoutes() {
  return {
    action: 'fuel',

    claims: {
      prepareTx: async ({ context: { request }, extraParams }) => {
        const { amount, locale, symbol, address, decimal, endpoint } = extraParams;
        const { wallet } = await request.getBlockletInfo();
        if (!Number(amount) || Number(amount) < 0) {
          throw new Error(`Invalid amount: ${amount}`);
        }

        const description = {
          en: `Please pay ${amount} ${symbol} to application`,
          zh: `请支付 ${amount} ${symbol}`,
        };

        const tokens = [
          {
            address,
            value: fromTokenToUnit(amount, decimal).toString(),
          },
        ];

        return {
          type: 'TransferV3Tx',
          partialTx: {
            itx: {
              inputs: [],
              outputs: [
                {
                  // 转给 app
                  owner: wallet.address,
                  tokens,
                },
              ],
            },
          },
          requirement: {
            tokens,
          },
          description: description[locale] || description.en,
          chainInfo: { host: endpoint },
        };
      },
    },
    onAuth: async ({ claims, userDid, extraParams: { locale, endpoint } }) => {
      try {
        const client = new Client(`${endpoint}/api/gql?locale=${locale}`.replace(/\/+/g, '/').trim());
        const claim = claims.find((x) => x.type === 'prepareTx');
        const tx = client.decodeTx(claim.finalTx);
        const hash = await client.sendTransferV3Tx({
          tx,
          wallet: fromAddress(userDid),
        });
        logger.info('fuel_application.onAuth', { claims, userDid, hash });
        return { hash, tx: claim.finalTx };
      } catch (err) {
        logger.info('fuel_application.onAuth.error', err);
        const errors = {
          en: 'Failed to fuel the application',
          zh: '支付失败',
        };
        throw new Error(errors[locale] || errors.en);
      }
    },
  };
};
