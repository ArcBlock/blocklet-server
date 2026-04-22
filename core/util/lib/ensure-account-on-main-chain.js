const { MAIN_CHAIN_ENDPOINT } = require('@abtnode/constant');
const { getChainClient } = require('./get-chain-client');
const { convertToMoniker } = require('./transfer-to-moniker');

const ensureAccountOnMainChain = async (wallet, title) => {
  const mainChainClient = getChainClient(MAIN_CHAIN_ENDPOINT);
  const newResultOnMainChain = await mainChainClient.getAccountState({ address: wallet.address });
  if (!newResultOnMainChain.state) {
    const hash = await mainChainClient.declare({
      moniker: convertToMoniker(title),
      wallet,
    });

    return hash;
  }

  return '';
};

module.exports = {
  ensureAccountOnMainChain,
};
