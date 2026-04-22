const fs = require('fs');
const path = require('path');

const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { stopDockerRedis } = require('@abtnode/core/lib/util/docker/ensure-docker-redis');
const { CONFIG_FOLDER_NAME, CONFIG_FOLDER_NAME_OLD } = require('@abtnode/constant');

const clearAllCache = async (printSuccess, printError) => {
  // Stop the Redis container in Docker
  await stopDockerRedis();
  try {
    let nowConfigFolder = '';
    if (fs.existsSync(CONFIG_FOLDER_NAME)) {
      nowConfigFolder = CONFIG_FOLDER_NAME;
    } else if (fs.existsSync(CONFIG_FOLDER_NAME_OLD)) {
      nowConfigFolder = CONFIG_FOLDER_NAME_OLD;
    }
    if (nowConfigFolder) {
      if (!process.env.ABT_NODE_CACHE_SQLITE_PATH) {
        process.env.ABT_NODE_CACHE_SQLITE_PATH = path.join(nowConfigFolder, 'core', 'db-cache.db');
      }

      const cache = new DBCache(() => ({
        prefix: 'all',
        ttl: 1000 * 60,
        ...getAbtNodeRedisAndSQLiteUrl(),
        forceType: 'sqlite',
      }));

      // Flush the SQLite adapter cache
      await cache.flushAll();
    }
  } catch (error) {
    printError(`Failed to clear database cache: ${error.message}`);
  }
  printSuccess('Database cache cleared successfully');
};

module.exports = clearAllCache;
