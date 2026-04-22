const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { SitemapStream, streamToPromise } = require('sitemap');
const SitemapMerger = require('sitemap-merger');
const { Readable } = require('stream');
const uniqBy = require('lodash/uniqBy');
const get = require('lodash/get');
const isString = require('lodash/isString');
const { toBase64 } = require('@ocap/util');
const { getStatusFromError } = require('@blocklet/error');
const { findWebInterface, checkPublicAccess } = require('@blocklet/meta/lib/util');
const { joinURL } = require('ufo');
const { WELLKNOWN_SERVICE_PATH_PREFIX, SECURITY_RULE_DEFAULT_ID } = require('@abtnode/constant');

const { getBlockletNavigation, isDashboardNavigation } = require('../util/navigation');
const { api } = require('../libs/api');

const isSitemapSupported = b => get(b.meta, 'capabilities.sitemap', false);

module.exports = {
  init(app, node) {
    app.get('/robots.txt', async (req, res) => {
      const did = req.headers['x-blocklet-did'] || '';
      const blocklet = await node.getBlocklet({ did, useCache: true });
      if (!blocklet) {
        return res.status(404).type('text').send('Blocklet not found');
      }
      const appUrl = blocklet.environmentObj?.BLOCKLET_APP_URL;
      const navigation = getBlockletNavigation(blocklet);

      // private apps
      const securityConfig = await node.getBlockletSecurityRule({ did, id: SECURITY_RULE_DEFAULT_ID });
      if (!checkPublicAccess(securityConfig)) {
        return res.type('text').send(`User-agent: *
Sitemap: ${joinURL(appUrl, 'sitemap.xml')}
Disallow: /`);
      }

      // public apps
      let disallow = [];
      navigation.forEach(x => {
        if (Array.isArray(x.items) && x.items.length) {
          x.items.forEach(y => {
            if (isDashboardNavigation(y)) {
              disallow.push(y.link);
            }
          });
        } else if (isDashboardNavigation(x)) {
          disallow.push(x.link);
        }
      });

      // merge all service rules into 1
      const adminPath = `${WELLKNOWN_SERVICE_PATH_PREFIX}/admin`;
      disallow = [
        ...new Set(disallow.filter(isString).filter(x => x && x !== '/' && x.startsWith(adminPath) === false)),
        adminPath,
      ];

      return res.type('text').send(`User-agent: *
Sitemap: ${joinURL(appUrl, 'sitemap.xml')}
Allow: /
${disallow.map(x => `Disallow: ${x}`).join('\n')}`);
    });

    // cache sitemap for each blocklet for 1 hour to avoid too many requests to upstream
    const cache = new DBCache(() => ({
      prefix: 'blocklet-seo',
      ttl: 30 * 60 * 1000,
      ...getAbtNodeRedisAndSQLiteUrl(),
    }));
    app.get('/sitemap.xml', async (req, res) => {
      res.header('Content-Type', 'application/xml');
      const did = req.headers['x-blocklet-did'] || '';
      if (req.query.nocache === '1') {
        await cache.del(did);
      } else {
        const last = await cache.get(did);
        if (last) {
          res.send(last);
          return;
        }
      }

      const blocklet = await node.getBlocklet({ did, useCache: true });
      if (!blocklet) {
        res.status(404).end();
        return;
      }
      const appUrl = blocklet.environmentObj?.BLOCKLET_APP_URL;

      const mountPoints = [];
      const { securityRules } = await node.getBlockletSecurityRules({ did });
      const defaultSecurityConfig = securityRules.find(x => x.id === SECURITY_RULE_DEFAULT_ID);
      if (checkPublicAccess(defaultSecurityConfig)) {
        for (const item of blocklet.children) {
          const componentSecurityConfig = securityRules.find(
            x => x.componentDid === item.meta.bundleDid && x.pathPattern === '*'
          );
          if (checkPublicAccess(componentSecurityConfig)) {
            const mountPoint = {
              title: item.meta.title,
              did: item.meta.bundleDid,
              name: item.meta.bundleName,
              mountPoint: item.mountPoint,
            };

            let port = null;
            const webInterface = findWebInterface(item);
            if (webInterface && item.environmentObj?.[webInterface.port]) {
              port = item.environmentObj?.[webInterface.port];
            }

            mountPoints.push({ ...mountPoint, port, sitemap: isSitemapSupported(item) });
          }
        }
      }

      try {
        const stream = new SitemapStream({ hostname: appUrl });
        const links = uniqBy(
          [{ url: appUrl }].concat(
            mountPoints
              .filter(x => x.mountPoint && x.sitemap)
              .map(x => ({ url: joinURL(appUrl, x.mountPoint === '/' ? '' : x.mountPoint) }))
          ),
          'url'
        );

        const baseMap = await streamToPromise(Readable.from(links).pipe(stream)).then(data => data.toString());
        const componentMap = await Promise.all(
          mountPoints
            .filter(x => x.port && x.sitemap)
            .map(async x => {
              const mappings = (blocklet.site.rules || [])
                .filter(r => r.to.componentId === x.did && r.from.pathPrefix && r.to.pageGroup)
                .map(r => ({
                  prefix: r.from.pathPrefix,
                  group: r.to.pageGroup,
                }));

              const endpoint = joinURL(
                `http://127.0.0.1:${x.port}`,
                `sitemap.xml?mappings=${toBase64(JSON.stringify(mappings))}`
              );
              try {
                const result = await api.get(endpoint);
                return (result.headers['content-type'] || '').startsWith('application/xml') ? result.data : '';
              } catch (err) {
                console.error(`Failed to get sitemap for ${x.name} from ${endpoint}`, err);
                return '';
              }
            })
        );

        // merge all sitemap: order is important
        const tmp = [...componentMap, baseMap].filter(Boolean);
        const result = tmp.slice(1).reduce((acc, x) => SitemapMerger.merge(acc, x), tmp[0]);
        await cache.set(did, result);
        res.send(result);
      } catch (e) {
        console.error(e);
        res.status(getStatusFromError(e)).end();
      }
    });
  },
};
