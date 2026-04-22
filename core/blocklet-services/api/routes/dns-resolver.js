const dns = require('dns');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

module.exports = {
  init(app) {
    const cache = new DBCache(() => ({
      prefix: 'services-dns-resolver',
      ttl: 5 * 60 * 1000,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));

    app.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/dns-resolve/`, async (req, res) => {
      const { hostname } = req.query;

      if (!hostname) {
        res.status(400).send('hostname should not be empty');
        return;
      }

      const cachedAddress = await cache.get(hostname);

      if (cachedAddress) {
        res.json({ address: cachedAddress });
        return;
      }

      dns.lookup(hostname, async (err, address) => {
        if (err) {
          await cache.del(hostname);
          res.json({ address: null, error: err.message });
          return;
        }

        await cache.set(hostname, address);
        res.json({ address });
      });
    });
  },
};
