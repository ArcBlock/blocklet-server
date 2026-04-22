const { isFreeBlocklet } = require('@blocklet/meta/lib/util');

const logger = require('@abtnode/logger')('getMetaFromUrl');

const { getBlockletMetaFromUrl } = require('./blocklet');
const { getStoreInfo } = require('./store');
const { getFactoryState } = require('./chain');

const getMetaFromUrl = async ({ url, checkPrice = false }) => {
  const meta = await getBlockletMetaFromUrl(url);
  let isFree = isFreeBlocklet(meta);

  const { inStore, registryUrl, registryMeta } = await getStoreInfo(url);
  if (checkPrice && !isFree && meta.nftFactory && inStore && registryMeta) {
    try {
      if (registryMeta.chainHost) {
        const state = await getFactoryState(registryMeta.chainHost, meta.nftFactory);
        if (state) {
          isFree = false;
        }
      }
    } catch (error) {
      logger.warn('failed when checking if the blocklet is free', { did: meta.did, error });
    }
  }

  return { meta, isFree, inStore, registryUrl };
};

module.exports = getMetaFromUrl;
