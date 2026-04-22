const { joinURL, withQuery } = require('ufo');
// eslint-disable-next-line import/no-extraneous-dependencies
const { toTypeInfo } = require('@arcblock/did');
const { isEVMChain, getExplorerUrl } = require('./util');
const { arcChainConfig } = require('./config');

const RoleType = {
  ROLE_ACCOUNT: 'number',
  ROLE_NODE: 'number',
  ROLE_DEVICE: 'number',
  ROLE_APPLICATION: 'number',
  ROLE_SMART_CONTRACT: 'number',
  ROLE_BOT: 'number',
  ROLE_ASSET: 'number',
  ROLE_STAKE: 'number',
  ROLE_VALIDATOR: 'number',
  ROLE_GROUP: 'number',
  ROLE_TX: 'number',
  ROLE_TETHER: 'number',
  ROLE_SWAP: 'number',
  ROLE_DELEGATION: 'number',
  ROLE_VC: 'number',
  ROLE_BLOCKLET: 'number',
  ROLE_STORE: 'number',
  ROLE_TOKEN: 'number',
  ROLE_FACTORY: 'number',
  ROLE_ROLLUP: 'number',
  ROLE_STORAGE: 'number',
  ROLE_PROFILE: 'number',
  ROLE_ANY: 'number',
};
const baseUrl = 'https://explorer.abtnetwork.io/explorer/';

module.exports = function explorerUrl({ hash, asset, rollup, address, token, stake, chainId = '' }) {
  if (isEVMChain(chainId)) {
    const url = getExplorerUrl(chainId);

    if (hash) {
      return joinURL(url, `tx/${hash}`);
    }

    if (asset) {
      return joinURL(url, `token/${asset}`);
    }

    return joinURL(url, `address/${address}`);
  }

  const chain = arcChainConfig[chainId];
  const chainHost = chain?.defaultRPC;
  const host = chainHost ? `${chainHost}` : undefined;

  // rollup
  if (rollup && toTypeInfo(rollup).role === RoleType.ROLE_ROLLUP) {
    if (hash) {
      return withQuery(joinURL(baseUrl, `rollups/${rollup}/moves/${hash}`), { host });
    }

    return withQuery(joinURL(baseUrl, `rollups/${rollup}`), { host });
  }

  // asset
  if (asset) {
    return withQuery(joinURL(baseUrl, `assets/${asset}`), { host });
  }

  // tx
  if (hash) {
    return withQuery(joinURL(baseUrl, `txs/${hash}`), { host });
  }

  // tx
  if (token) {
    return withQuery(joinURL(baseUrl, `tokens/${token}/tx`), { host });
  }

  if (stake) {
    return withQuery(joinURL(baseUrl, `stakes/${stake}`), { host });
  }

  // account
  return withQuery(joinURL(baseUrl, `accounts/${address}`), { host });
};
