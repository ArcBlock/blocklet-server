const { joinURL } = require('ufo');
const axios = require('@abtnode/util/lib/axios');
const { DEFAULT_IP_DOMAIN, WELLKNOWN_DID_RESOLVER_PREFIX } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:util:get-accessible-external-node-ip');
const { get: getIp } = require('./ip');

const getNodeDomain = (ip) => (ip ? DEFAULT_IP_DOMAIN.replace(/^\*/, ip.replace(/\./g, '-')) : '');

let cache = null;
let cacheAt = 0;
let cacheMissCount = 0;
let pendingFetch = null; // Prevents concurrent fetches
const cacheMissTTL = 1000 * 60 * 30; // 30 minutes

const timeout = process.env.NODE_ENV === 'test' ? 500 : 5000;

// check if node dashboard https endpoint return 2xx
const checkConnected = async ({ ip, nodeInfo }) => {
  if (cacheMissCount > 10) {
    throw new Error('Too many cache miss');
  }

  if (process.env.NODE_ENV === 'development') {
    // dev 模式下，检查的地址不一样，可以放松判断，只检查对应端口是否运行即可
    const endpoint = `http://${ip}:3000`;
    await axios.get(endpoint, { timeout });
  } else {
    const port = Number(nodeInfo.routing.httpsPort) !== 443 ? `:${nodeInfo.routing.httpsPort}` : '';
    // 在带有端口号的情况下，使用 withHttps 会得到错误的结果
    const endpoint = `https://${joinURL(`${getNodeDomain(ip)}${port}`, WELLKNOWN_DID_RESOLVER_PREFIX)}`;
    const { data } = await axios.get(endpoint, { timeout });
    // 需要判断 services 中第一个对象的 type 是否为 server
    if (data?.services?.[0]?.type !== 'server') {
      throw new Error('Not a server');
    }
  }
};

/**
 * Get accessible external ip of abtnode
 */
const fetch = async (nodeInfo) => {
  const { external, internal } = await getIp();
  if ([external, internal].includes(cache)) {
    logger.info('reuse cached accessible ip:', { cache });
    return cache;
  }

  logger.info('refresh accessible ip:', { external, internal, cache });

  // prefer external ip
  try {
    if (external) {
      await checkConnected({ ip: external, nodeInfo });
      cache = external;
      logger.info('cache external ip as accessible ip', { external });
    }
  } catch (err) {
    logger.error('failed to check external ip', { external, error: err });
    cacheMissCount += 1;
    cache = null;
  }

  // fallback to internal ip
  if (!cache) {
    try {
      if (internal) {
        await checkConnected({ ip: internal, nodeInfo });
        cache = internal;
        logger.info('cache internal ip as accessible ip', { internal });
      }
    } catch (err) {
      logger.error('failed to check internal ip', { internal, error: err });
      cacheMissCount += 1;
      cache = null;
    }
  }

  // 当正确获得了 IP 或者缓存时间过长时，重置 cacheMissCount
  if (cache || Date.now() - cacheAt > cacheMissTTL) {
    cacheMissCount = 0;
    cacheAt = Date.now();
  }

  return cache;
};

module.exports.refresh = fetch;
module.exports.getFromCache = (nodeInfo) => {
  // FIXME: 用于修复 unit-test 中 `should add dynamic component as expected` 中的错误，暂不知道为什么会影响
  if (process.env.NODE_ENV === 'test') {
    return cache;
  }
  if (nodeInfo) {
    if (cache) {
      return cache;
    }
    // Use pending promise to prevent concurrent fetches
    if (!pendingFetch) {
      pendingFetch = fetch(nodeInfo).finally(() => {
        pendingFetch = null;
      });
    }
    return pendingFetch;
  }
  return cache;
};
