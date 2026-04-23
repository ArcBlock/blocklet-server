const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const nodemailer = require('nodemailer');
const { LRUCache } = require('lru-cache');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { fromJSON } = require('@ocap/wallet');

const CACHE_TTL = 60 * 60 * 1000;
const SESSION_TOKEN_TTL = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL = 86400 * 7 * 1000;
const SESSION_CACHE_DISABLED_USER_TTL = 86400 * 1000;
const SECURITY_CONFIG_TTL = 86400 * 1000;

const nonStandardCache = new LRUCache({
  max: 100,
  ttl: 60 * 60 * 1000, // cache for 1 hour
});

const cache = new DBCache(() => ({
  prefix: 'services-base',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheNodeInfo = new DBCache(() => ({
  prefix: 'services-node-state',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheBlocklet = new DBCache(() => ({
  prefix: 'services-blocklet',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheBlockletInfo = new DBCache(() => ({
  prefix: 'services-blocklet-info-v2',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheRule = new DBCache(() => ({
  prefix: 'services-rule',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheNotificationConfig = new DBCache(() => ({
  prefix: 'services-notification-config',
  ttl: CACHE_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheSessionDisabledUser = new DBCache(() => ({
  prefix: 'services-session-cache-disabled-user',
  ttl: SESSION_CACHE_DISABLED_USER_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheSecurityConfig = new DBCache(() => ({
  prefix: 'services-security-config',
  ttl: SECURITY_CONFIG_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheSessionToken = new DBCache(() => ({
  prefix: 'services-session-token',
  ttl: SESSION_TOKEN_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const cacheRefreshToken = new DBCache(() => ({
  prefix: 'services-refresh-token',
  ttl: REFRESH_TOKEN_TTL,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

cache.getNodeInfo = ({ node }) => {
  return cacheNodeInfo.autoCache('base', () => {
    return node.getNodeInfo();
  });
};

cache.deleteNodeInfo = () => {
  cacheNodeInfo.del('base');
};

cache.getBlocklet = ({ did, node, useCache, context }) => {
  return node.getBlocklet({ did, useCache }, context);
};

cache.getBlockletInfo = async ({ did, node, context }) => {
  const blockletInfo = await cacheBlockletInfo.autoCache(did, async () => {
    const [blocklet, info] = await Promise.all([
      cache.getBlocklet({ did, node, context }),
      cache.getNodeInfo({ node }),
    ]);

    if (!blocklet) {
      throw new Error('Blocklet does not exist');
    }
    const bInfo = await getBlockletInfo(blocklet, info.sk);
    if (bInfo.wallet) {
      bInfo.walletJSON = bInfo.wallet.toJSON();
      delete bInfo.wallet;
    }
    if (bInfo.permanentWallet) {
      if (bInfo.permanentWallet === bInfo.wallet) {
        bInfo.permanentWalletJSON = bInfo.walletJSON;
      } else {
        bInfo.permanentWalletJSON = bInfo.permanentWallet.toJSON();
      }
      delete bInfo.permanentWallet;
    }
    return bInfo;
  });

  if (blockletInfo.walletJSON) {
    blockletInfo.wallet = fromJSON(blockletInfo.walletJSON);
    delete blockletInfo.walletJSON;
  }
  if (blockletInfo.permanentWalletJSON) {
    blockletInfo.permanentWallet = fromJSON(blockletInfo.permanentWalletJSON);
    delete blockletInfo.permanentWalletJSON;
  }
  return blockletInfo;
};

cache.getTransport = ({ did, config, force }) => {
  if (!did) {
    return null;
  }

  const cacheKey = did;

  if (!force) {
    const exist = nonStandardCache.get(cacheKey);
    if (exist) {
      return exist;
    }
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: !!config.secure,
    name: 'blocklet-server',
    auth: { user: config.user, pass: config.password },
  });
  if (transporter) {
    nonStandardCache.set(cacheKey, transporter);
  }

  return transporter;
};

cache.getSecurityConfig = ({ did, url, force = false, getDataFn } = {}) => {
  if (!did || url === undefined) {
    return null;
  }
  return cacheSecurityConfig.autoCacheGroup(force ? null : did, url, () => {
    return getDataFn();
  });
};

cache.removeSecurityConfig = ({ did } = {}) => {
  if (!did) {
    return;
  }
  cacheSecurityConfig.del(did);
  cacheBlocklet.del(did);
  cacheBlockletInfo.del(did);
};

cache.rule = cacheRule;

cache.notificationConfig = cacheNotificationConfig;

cache.sessionCacheDisabledUser = cacheSessionDisabledUser;

cache.blockletInfo = cacheBlockletInfo;

cache.sessionToken = cacheSessionToken;

cache.refreshToken = cacheRefreshToken;

module.exports = cache;
