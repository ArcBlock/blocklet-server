const fs = require('fs-extra');
const path = require('path');
const { getAppImageCacheDir, getAppOgCacheDir } = require('@abtnode/util/lib/blocklet');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');

const clearCacheDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.ensureDirSync(dir);
  }
};

const clearDBCache = async () => {
  const dbCache = new DBCache(() => ({
    prefix: '*',
    ttl: 1000 * 60,
    ...getAbtNodeRedisAndSQLiteUrl(),
  }));
  await dbCache.flushAll();
};

/**
 * The `clearCache` function is used to clear cache files based on different
 * parameters and directories.
 * @param params - { teamDid: string, pattern: string }
 * @param node - the server instance.
 * @param blockletManager - the blocklet manager instance.
 * @returns String[] list of files removed from the cache.
 */
const clearCache = async (params, node, blockletManager) => {
  await clearDBCache();

  const baseDir = path.dirname(node.dataDirs.core);

  // reset cache by pattern
  const info = await node.getNodeInfo({ useCache: true });
  const provider = node.getRouterProvider(info.routing.provider);
  if (params.pattern) {
    const files = await provider.searchCache(params.pattern, params.teamDid);
    files.forEach((x) => fs.rmSync(x, { force: true }));
    return files.map((x) => x.replace(baseDir, ''));
  }

  const removed = [];

  // reset server cache
  if (params.teamDid === info.did) {
    // reset all router cache
    const result = await provider.clearCache();
    removed.push(...result);

    // reset global cache for external images used for open graph
    const cacheDir = getAppOgCacheDir(node.dataDirs.tmp);
    clearCacheDir(cacheDir);
    removed.push(cacheDir);

    return removed.map((x) => x.replace(baseDir, ''));
  }

  // reset blocklet cache
  const blocklet = await blockletManager.getBlocklet(params.teamDid);
  [getAppImageCacheDir(blocklet.env.cacheDir), getAppOgCacheDir(blocklet.env.cacheDir)].forEach((x) => {
    clearCacheDir(x);
    removed.push(x);
  });
  // reset blocklet router cache
  const result = await provider.clearCache(params.teamDid);
  removed.push(...result);

  return removed.map((x) => x.replace(baseDir, ''));
};

module.exports = {
  clearCache,
};
