/* eslint-disable no-underscore-dangle, global-require */
/* eslint-disable no-console */
const httpProxy = require('@arcblock/http-proxy');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const { isValid } = require('@arcblock/did');
const { BlockletEvents } = require('@blocklet/constant');
const md5 = require('@abtnode/util/lib/md5');
const { BLOCKLET_PROXY_PATH_PREFIX, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { findComponentV2, findWebInterfacePort } = require('@blocklet/meta/lib/util');
const get = require('lodash/get');

const logger = require('@abtnode/logger')(`${require('../../package.json').name}:blockletProxy`);
const { getMimeTypes } = require('../util/blocklet-proxy');

const proxyCache = new DBCache(() => ({
  prefix: 'blocklet-proxy',
  ttl: 60 * 1000,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const validPrefixReg =
  /^\/(asset|public|static|favicon|js|css|image|manifest\.json|service-worker\.js|logo512\.png|logo192\.png|manifest\.webmanifest)/;
const validPrefixTip = `Only resources under ${['/static', '/public', '/asset', '/js', '/css', '/image', '/manifest.json', 'service-worker.js'].join(', ')} are allowed`;

const ensureUrl = (req, urlPrefix) => {
  req.url = req.url.slice(urlPrefix.length);
};

module.exports = {
  proxyCache,
  init(app, node, proxy) {
    if (!proxy) {
      // eslint-disable-next-line no-param-reassign
      proxy = httpProxy.createProxyServer({
        timeout: 3600 * 1000,
        proxyTimeout: 3600 * 1000,
      });
    }

    const refreshBlocklet = async did => {
      try {
        const blocklet = await node.getBlocklet({ did, attachConfig: false });
        await proxyCache.groupSet(did, 'BLOCKLET', blocklet);
        return blocklet;
      } catch (error) {
        logger.error('Failed to get blocklet', { error });
        return null;
      }
    };

    [BlockletEvents.started].forEach(event => {
      node.on(event, async blocklet => {
        const did = get(blocklet, 'meta.did');
        await proxyCache.del(did);
        await refreshBlocklet(did);
      });
    });

    node.on(BlockletEvents.removed, async blocklet => {
      await proxyCache.del(get(blocklet, 'meta.did'));
    });

    proxy.on(
      'proxyRes',
      /**
       *
       * @see https://www.npmjs.com/package/http-proxy?activeTab=readme#:~:text=receive%20any%20data.-,Modify%20response,-var%C2%A0option%C2%A0
       * @param {Response} proxyRes
       * @param {Request} req
       * @param {Response} res
       * @returns
       */
      (proxyRes, req, res) => {
        // 获取期望的版本
        const expectContentTypes = getMimeTypes(req.originalUrl);
        // 实际返回的 content-type
        const actualContentTypeFromProxy = proxyRes.headers?.['content-type'] || '';
        if (expectContentTypes.some(type => actualContentTypeFromProxy.includes(type)) === false) {
          logger.error(`File(${req.originalUrl}) not found`, {
            expectContentTypes,
            actualContentTypeFromProxy,
          });
          return res.status(404).send('File not found');
        }

        return true;
      }
    );

    /**
     * match request，会匹配 blocklet 和 blocklet-service 的静态资源
     * e.g.
     *   /.blocklet/proxy/<did>/a.css
     *   /.blocklet/proxy/path/a.css
     */
    app.get(
      `${BLOCKLET_PROXY_PATH_PREFIX}/:bundleDid/**`,
      // NOTICE: 静态资源暂不做安全配置，作用不是很大
      (req, res, next) => {
        const { bundleDid } = req.params;

        // proxy to blocklet service
        if (bundleDid === 'blocklet-service') {
          req.url = req.url.replace(
            `${BLOCKLET_PROXY_PATH_PREFIX}/${bundleDid}`,
            `${WELLKNOWN_SERVICE_PATH_PREFIX}/static`
          );
          const target = `http://127.0.0.1:${process.env.ABT_NODE_SERVICE_PORT}`;
          proxy.web(req, res, { target }, error => {
            if (error) {
              logger.error(`Can not proxy to blocklet service: ${target}`, { error });
              res.status(502).send(`Can not proxy to blocklet service: ${target}`);
            }
          });
          return;
        }

        req.appDid = req.headers['x-blocklet-did'];
        req.bundleDid = bundleDid;

        next();
      }
    );

    /**
     * match request
     * e.g.
     *   /.blocklet/proxy/<did>/a.css
     *   /.blocklet/proxy/path/a.css
     *   /.blocklet/proxy/a.css
     */
    app.get(`${BLOCKLET_PROXY_PATH_PREFIX}/**`, async (req, res) => {
      const { appDid, bundleDid } = req;

      if (!appDid) {
        res.status(400).send('Application did is not found');
        return;
      }

      if (!isValid(appDid)) {
        res.status(400).send(`Application did is not valid: ${appDid}`);
        return;
      }

      if (!bundleDid) {
        res.status(400).send(`Component did is not found. appDid: ${appDid}`);
        return;
      }

      const urlPrefix = `${BLOCKLET_PROXY_PATH_PREFIX}/${bundleDid}`;

      if (!validPrefixReg.test(req.url.slice(urlPrefix.length))) {
        res.status(400).send(validPrefixTip);
        return;
      }

      const cacheKey = md5(req.url);

      // use cache target if exist
      const cachedTarget = await proxyCache.groupGet(appDid, cacheKey);
      if (cachedTarget) {
        ensureUrl(req, urlPrefix);

        proxy.web(req, res, { target: cachedTarget }, error => {
          if (error) {
            logger.error(`Can not proxy to upstream blocklet: ${cachedTarget}`, { error });
            res.status(502).send(`Can not proxy to upstream blocklet: ${cachedTarget}`);
          }
        });
        return;
      }

      // get blocklet
      let blocklet = await proxyCache.groupGet(appDid, 'BLOCKLET');
      if (!blocklet) {
        blocklet = await refreshBlocklet(appDid);
      }

      if (!blocklet) {
        res.status(400).send(`Application is not found: ${appDid}`);
        return;
      }

      const component = findComponentV2(blocklet, x => x.meta.bundleDid === bundleDid);
      if (!component) {
        res.status(400).send(`Component is not found. AppDid: ${appDid}. BundleDid: ${bundleDid}`);
        return;
      }

      const port = findWebInterfacePort(component);
      if (!port) {
        res
          .status(400)
          .send(`Component web interface port is not found. AppDid: ${appDid}. Component: ${component.meta.did}`);
        return;
      }

      // proxy to target component service
      const target = `http://127.0.0.1:${port}`;

      // cache the target for subsequent requests with the same url
      await proxyCache.groupSet(appDid, cacheKey, target);

      ensureUrl(req, urlPrefix);

      proxy.web(req, res, { target }, error => {
        if (error) {
          logger.error(`Can not proxy to upstream blocklet: ${target}`, { error });
          res.status(502).send(`Can not proxy to upstream blocklet: ${target}`);
        }
      });
    });
  },
};
