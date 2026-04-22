/* eslint-disable no-await-in-loop */
const { joinURL } = require('ufo');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const get = require('lodash/get');
const Client = require('@ocap/client');
const axios = require('@abtnode/util/lib/axios');
const { BLOCKLET_STORE_META_PATH } = require('@abtnode/constant');
const { BLOCKLET_FACTORY_SHARES } = require('@blocklet/constant');
const { createNftFactoryItx } = require('@blocklet/meta/lib/payment/v2');

const debug = require('debug')('@blocklet/cli');

const getStoreInfo = async (url) => {
  const { data } = await axios.get(joinURL(url, BLOCKLET_STORE_META_PATH), { timeout: 20 * 1000 });
  return data;
};

const isValidChainEndpoint = async (endpoint) => {
  if (!endpoint) {
    return false;
  }

  const client = new Client(endpoint);
  try {
    const { info } = await client.getChainInfo();
    if (info.consensusVersion.split(' ').length === 2) {
      return client;
    }

    return false;
  } catch (err) {
    return false;
  }
};

const getShare = async ({ meta, storeUrl, developerDid }) => {
  const info = await getStoreInfo(storeUrl);

  const shares = cloneDeep(get(meta, 'payment.share', []));
  if (shares.length === 0) {
    shares.push({
      name: 'developer',
      address: developerDid,
      value: BLOCKLET_FACTORY_SHARES.developer,
    });
  }
  if (!shares.find((x) => x.address === info.id)) {
    shares.push({
      name: 'store',
      address: info.id,
      value: BLOCKLET_FACTORY_SHARES.store,
    });
  }

  return shares;
};

/**
 * Ensure NFT factory exists for paid blocklets, the process must be deterministic.
 * If user changed the name/title of the blocklet, then a new factory will be created
 */
const ensureBlockletNftFactory = async ({ meta, storeUrl }) => {
  const info = await getStoreInfo(storeUrl);
  const endpoint = info.chainHost;

  const ocapClient = await isValidChainEndpoint(endpoint);
  if (ocapClient === false) {
    throw new Error('Invalid chain endpoint fetched from store, please contact store administrator to fix');
  }

  // create factory nft itx
  const { itx } = await createNftFactoryItx({
    blockletMeta: meta,
    ocapClient,
    issuers: [info.id],
    storeUrl,
  });

  debug('factory itx', itx);

  return itx.address;
};

module.exports = {
  isValidChainEndpoint,
  ensureBlockletNftFactory,
  getShare,
};
