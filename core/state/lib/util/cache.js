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

// nginx stores `KEY: ...` in the cache file header, no need to read the body
const readCacheHeader = (file) => {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(4096);
    const bytes = fs.readSync(fd, buf, 0, buf.length, 0);
    return buf.toString('latin1', 0, bytes);
  } finally {
    fs.closeSync(fd);
  }
};

/**
 * Router providers are initialized lazily (see ensureRoutingProvider), so in processes that never
 * handled routing (e.g. CLI) there is no provider instance. Constructing one has side effects on the
 * gateway config, so fall back to operating on the provider cache dir directly.
 */
const getCacheProvider = (node, providerName) => {
  const provider = node.getRouterProvider(providerName);
  if (provider) {
    return provider;
  }

  const rootDir = path.join(node.dataDirs.router, providerName, 'cache');
  return {
    searchCache: (pattern, group = '') => {
      const dir = group ? path.join(rootDir, group) : rootDir;
      if (!pattern || !fs.existsSync(dir)) {
        return [];
      }
      const files = [];
      const walk = (d) => {
        fs.readdirSync(d, { withFileTypes: true }).forEach((x) => {
          const file = path.join(d, x.name);
          if (x.isDirectory()) {
            walk(file);
          } else if (x.isFile()) {
            const key = readCacheHeader(file)
              .split('\n')
              .find((line) => line.startsWith('KEY:'));
            if (key && key.includes(pattern)) {
              files.push(file);
            }
          }
        });
      };
      walk(dir);
      return files;
    },
    clearCache: (group = '') => {
      const dir = group ? path.join(rootDir, group) : rootDir;
      if (!fs.existsSync(dir)) {
        return [];
      }
      clearCacheDir(dir);
      return [dir];
    },
  };
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
  const provider = getCacheProvider(node, info.routing.provider);
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
  getCacheProvider,
};
