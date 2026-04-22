const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');

const statusLock = new DBCache(() => ({
  prefix: 'blocklet-status-lock',
  ttl: 120_000,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const startLock = new DBCache(() => ({
  prefix: 'blocklet-start-lock',
  ttl: process.env.NODE_ENV === 'test' ? 1_000 : 120_000,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

module.exports = {
  statusLock,
  startLock,
};
