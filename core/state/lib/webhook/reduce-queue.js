const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');

// 确保多进程只会有一个任务在执行
const reduceQueue = new DBCache(() => ({
  prefix: 'reduce-queue',
  ttl: 5 * 1000,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

module.exports = reduceQueue;
