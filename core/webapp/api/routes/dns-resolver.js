const dns = require('dns');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { joinURL } = require('ufo');
const axios = require('@abtnode/util/lib/axios');
const { DEFAULT_IP_DOMAIN, WELLKNOWN_SERVER_ADMIN_PATH } = require('@abtnode/constant');
const { toAssetAddress } = require('@arcblock/did-util');

const getNodeDomain = ip => (ip ? DEFAULT_IP_DOMAIN.replace(/^\*/, ip.replace(/\./g, '-')) : '');

const timeout = process.env.NODE_ENV === 'test' ? 500 : 2000;

// check if node dashboard https endpoint return 2xx
const checkConnected = async ({ ip, nodeInfo }) => {
  const { adminPath = WELLKNOWN_SERVER_ADMIN_PATH } = nodeInfo.routing || {};
  const origin = `https://${getNodeDomain(ip)}`;
  const endpoint = joinURL(origin, adminPath);
  await axios.get(endpoint, { timeout });
};

const DNS_RESOLVER_CACHE_TTL = 5 * 60 * 1000;

module.exports = {
  init(router, node) {
    const cache = new DBCache(() => ({
      prefix: 'dns-resolver',
      ttl: DNS_RESOLVER_CACHE_TTL,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));

    const accessibleCache = new DBCache(() => ({
      prefix: 'dns-resolver-accessible',
      ttl: DNS_RESOLVER_CACHE_TTL,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));

    router.get('/api/dns-resolve/', async (req, res) => {
      const hostname = req.query.hostname || req.hostname;
      const accessible = !!req.query.accessible;

      const _cache = accessible ? accessibleCache : cache;

      const cachedAddress = await _cache.get(hostname);

      if (cachedAddress) {
        res.json({ address: cachedAddress });
        return;
      }

      dns.lookup(hostname, async (err, address, family) => {
        if (err) {
          await _cache.del(hostname);
          res.json({ address: null, error: err.message });
          return;
        }

        if (family !== 4) {
          await _cache.del(hostname);
          res.json({ address: null, error: 'address is not IPv4 format' });
          return;
        }

        if (accessible) {
          const nodeInfo = await node.getNodeInfo();
          try {
            await checkConnected({ ip: address, nodeInfo });
            await _cache.set(hostname, toAssetAddress);
            res.json({ address });
          } catch {
            await _cache.del(hostname);
            res.json({ address: null, error: 'address is not accessible' });
          }
        } else {
          await _cache.set(hostname, address);
          res.json({ address });
        }
      });
    });
  },
};
