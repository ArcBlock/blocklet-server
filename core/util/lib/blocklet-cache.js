const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { BLOCKLET_CACHE_TTL } = require('@abtnode/constant');

const BLOCKLET_INFO_SHORT_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

/**
 * Blocklet Info cache for blocklet.js requests, allowing fast responses
 *
 * Notes:
 * - Redis Adapter does not use LRU cache (Redis itself is in-memory)
 * - SQLite Adapter uses LRU cache as the L1 cache layer
 */
const blockletInfoShortCache = new DBCache(() => ({
  prefix: 'blocklet-info-short-cache',
  ttl: BLOCKLET_INFO_SHORT_CACHE_TTL, // 30 minutes
  enableLruCache: true, // only effective for SQLite
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

/**
 * @param {string} did: blockletDid
 * @param {string} componentId: componentDid format is did/children.did
 * @param {string} type: json or js
 * @returns {string}
 */
const getBlockletInfoCachePrefixKey = (did) => {
  return `blocklet-info-${did}`;
};

/**
 * Delete Blocklet Info cache (including memory cache and DBCache)
 *
 * CLUSTER MODE NOTE:
 * - Memory cache: Cleared via delByPrefix with cluster sync.
 * - DBCache: Cleared once (Redis/SQLite handles multi-process access).
 *
 * @param {string} did: blockletDid
 */
const clearBlockletInfoCache = async (did, logger = console) => {
  try {
    // cacheKey contains dynamic parameters (pathPrefix, etc.), so all possible keys cannot be enumerated
    // use prefix matching to delete all cache entries related to this DID
    const prefix = getBlockletInfoCachePrefixKey(did);
    // DBCache also uses prefix deletion (del removes this key and all keys in its group)
    await blockletInfoShortCache.del(prefix);
    logger.info('Cleared blocklet info cache', { did, prefix });
  } catch (error) {
    logger.error('Clear blocklet info cache failed', { did, error });
  }
};

/**
 * Blocklet state cache for internal data retrieval to avoid repeated database queries
 */
const blockletCache = new DBCache(() => ({
  prefix: 'blocklet-state',
  ttl: BLOCKLET_CACHE_TTL,
  enableLruCache: false, // explicitly disable LRU cache
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

/**
 * Delete Blocklet state cache
 * @param {string} did: blockletDid
 */
const deleteBlockletCache = async (did, logger = console) => {
  try {
    await blockletCache.del(did);
    logger.info('Deleted blocklet cache', { did });
  } catch (error) {
    logger.error('deleteBlockletCache failed', { did, error });
  }
};

module.exports = {
  // Blocklet state cache
  blockletCache,
  deleteBlockletCache,

  // Blocklet info cache
  blockletInfoShortCache,
  getBlockletInfoCachePrefixKey,
  clearBlockletInfoCache,
};
