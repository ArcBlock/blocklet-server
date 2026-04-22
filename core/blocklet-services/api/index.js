const http = require('http');
const path = require('path');
const get = require('lodash/get');
const omitBy = require('lodash/omitBy');
const uniq = require('lodash/uniq');
const isUndefined = require('lodash/isUndefined');
const express = require('express');
const onProxyRes = require('on-headers');
require('express-async-errors');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const httpProxy = require('@arcblock/http-proxy');
const { minimatch } = require('minimatch');
const helmet = require('helmet');
const isUrl = require('is-url');
const {
  WELLKNOWN_SERVICE_PATH_PREFIX,
  EVENTS,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
  CSP_OFFICIAL_SOURCES,
  CSP_SYSTEM_SOURCES,
  CSP_THIRD_PARTY_SOURCES,
  CSP_ICONIFY_SOURCES,
  ASSET_CDN_HOST,
  BLOCKLET_PROXY_PATH_PREFIX,
} = require('@abtnode/constant');
const getBlockletComingSoonTemplate = require('@abtnode/router-templates/lib/blocklet-coming-soon');
const {
  BlockletEvents,
  BlockletInternalEvents,
  TeamEvents,
  BLOCKLET_TENANT_MODES,
  RESOURCE_PATTERN,
} = require('@blocklet/constant');
const { getAppOgCacheDir } = require('@abtnode/util/lib/blocklet');
const { ensureLocale } = require('@abtnode/util/lib/middlewares/ensure-locale');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const createInvite = require('@abtnode/auth/lib/invitation');
const { getStatusFromError, formatError } = require('@blocklet/error');
const { withQuery, joinURL, withTrailingSlash } = require('ufo');
const { createProxyMiddleware, responseInterceptor } = require('http-proxy-middleware');
const { findComponentByIdV2, getMountPoints } = require('@blocklet/meta/lib/util');
const {
  patchResponseHeader,
  DEFAULT_HELMET_CONFIG,
  cleanConfigOverride,
  keepConfigOverride,
  patchCors,
} = require('@abtnode/util/lib/security');
const { DEFAULT_CORS_CONFIG } = require('@abtnode/util/lib/cors');
const eventHub =
  process.env.NODE_ENV === 'test'
    ? require('@arcblock/event-hub/single').default
    : require('@arcblock/event-hub').default;

const logger = require('./libs/logger')('app');
const { getAccessLogStream, setupAccessLogger } = require('./libs/logger');

require('./libs/fetch');
const cache = require('./cache');
const { ensureProxyUrl } = require('./util');
const { isProduction, isE2E, isFeDev } = require('./libs/env');
const states = require('./state/index');

const { init: initNotification } = require('./services/notification');
const { init: initKyc } = require('./services/kyc');
const { init: initRelay } = require('./services/relay');
const notificationQueue = require('./services/notification/queue');
const { init: initAuth } = require('./services/auth');
const { init: initDashboard } = require('./services/dashboard');
const StaticService = require('./services/static');
const initImageService = require('./services/image');
const StudioService = require('./services/studio');
const AnalyticService = require('./services/analytics');
const DidSpaceService = require('./services/did-space');
const createEnvRoutes = require('./routes/env');
const createOauthClientRoutes = require('./routes/oauth/client');
const createOAuthServerRoutes = require('./routes/oauth/server');
const createFederatedRoutes = require('./routes/federated');
const createUserRoutes = require('./routes/user');
const createOcapRoutes = require('./routes/ocap');
const createCspProxyRoutes = require('./routes/csp-proxy');
const createUserSessionRoutes = require('./routes/user-session');
const createBlockletRoutes = require('./routes/blocklet');
const createConnectRelayRoutes = require('./routes/connect/relay');
const createConnectSessionRoutes = require('./routes/connect/session');
const createDnsResolver = require('./routes/dns-resolver');
const createOpenAPIRoutes = require('./routes/openapi');
const createOpenEventRoutes = require('./routes/openevent');
const createOpenComponentRoutes = require('./routes/opencomponent');
const createOpenEmbedRoutes = require('./routes/openembed');
const createAccessKeyRoutes = require('./routes/access-key');
const createSignRoutes = require('./routes/sign');
const checkRunning = require('./middlewares/check-running');
const { launcherLogin } = require('./middlewares/launcher-login');
const { checkMemberPermission, checkGuestPermission } = require('./middlewares/check-permission');
const ensureBlocklet = require('./middlewares/ensure-blocklet');
const proxyToDaemon = require('./middlewares/proxy-to-daemon');
const attachSharedUtils = require('./util/attach-shared-utils');
const createMediaRoutes = require('./routes/media');
const createMCPRoutes = require('./routes/mcp');
const bodyParser = require('./middlewares/body-parser');
const serveStaticEngine = require('./middlewares/serve-static-engine');
const federatedUtil = require('./util/federated');
const { cdn } = require('./middlewares/cdn');

process.on('unhandledRejection', (reason, promise) => {
  // If it's a SQLite “database is locked” error, just log and continue
  if (reason && (reason.code === 'SQLITE_BUSY' || reason.message.includes('SQLITE_BUSY'))) {
    console.error('SQLite busy, skipping exit:', reason.message);
    return;
  }

  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const agent = new http.Agent();

// remove items that are already in the official whitelist
const removeIfOverlap = (x, list) => {
  const domain = x.split('.').slice(-2).join('.');
  return list.some((y) => y.endsWith(domain)) ? null : x;
};

module.exports = function createServer(node, serverOptions = {}) {
  const options = {
    dataDir: node.dataDirs.services,
    sessionSecret: process.env.ABT_NODE_SESSION_SECRET,
    sessionTtl: process.env.ABT_NODE_SESSION_TTL,
    webWalletUrl: 'https://web.abtwallet.io',
    sessionTokenKey: 'login_token',
    refreshTokenKey: 'refresh_token',
    ...serverOptions,
    isProduction,
    isE2E,
  };

  if (!options.dataDir) {
    throw new Error('Blocklet services requires dataDir to start');
  }
  if (!options.sessionSecret) {
    throw new Error('Blocklet services requires sessionSecret to start');
  }

  logger.info('init blocklet service', { isProduction });

  states.init(options.dataDir);

  const { middlewares: authMiddlewares, routes: authRoutes, ensureWsUser } = initAuth({ node, options });
  const notificationService = initNotification({ node });
  const kycService = initKyc({ node });
  const relayService = initRelay({ node });
  const imageService = initImageService({ node });
  const dashboardService = initDashboard({ node, ensureWsUser, options });

  // Proxy engine
  const proxy = httpProxy.createProxyServer({
    timeout: 3600 * 1000,
    proxyTimeout: 3600 * 1000,
    agent,
  });

  proxy.safeWeb = (req, res, opts = {}) => {
    proxy.web(req, res, opts, async (error) => {
      if (error) {
        logger.error('http proxy error', { error, raw: req.originalUrl, opts });
        if (!res.headersSent) {
          try {
            const [blocklet, nodeInfo] = await Promise.all([req.getBlocklet(), req.getNodeInfo()]);
            res
              .status(502)
              .send(
                blocklet && nodeInfo
                  ? getBlockletComingSoonTemplate(blocklet, nodeInfo, WELLKNOWN_BLOCKLET_ADMIN_PATH)
                  : `Can not proxy to upstream target: ${opts.target}`
              );
          } catch (err) {
            logger.error('Failed to get blocklet or node info', { err });
            res.status(502).send(`Can not proxy to upstream target: ${opts.target}`);
          }
        }
      }
    });
  };

  // eslint-disable-next-line no-unused-vars
  proxy.on('proxyReq', (proxyReq, req, res) => {
    req.proxyReqStart = Date.now();
  });
  const SECURITY_HEADER_MAP = {
    contentSecurityPolicy: 'content-security-policy',
    referrerPolicy: 'referrer-policy',
    xFrameOptions: 'x-frame-options',
    xPoweredBy: 'x-powered-by',
    xXssProtection: 'x-xss-protection',
  };
  const CORS_HEADER_MAP = {
    origin: 'access-control-allow-origin',
    methods: 'access-control-allow-methods',
    allowedHeaders: 'access-control-allow-headers',
    exposedHeaders: 'access-control-expose-headers',
    credentials: 'access-control-allow-credentials',
    maxAge: 'access-control-max-age',
    optionsSuccessStatus: 'access-control-allow-status',
    preflightContinue: 'access-control-allow-preflight',
  };

  // NOTICE: !!! 注意这里最好不要有异步的函数，否则对 proxyRes 的处理可能不会被正确响应
  // eslint-disable-next-line no-unused-vars
  proxy.on('proxyRes', (proxyRes, req, res) => {
    const securityConfig = req?.responseHeaderPolicyConfig;
    if (securityConfig) {
      const securityHeaderOverrideConfig = keepConfigOverride(
        securityConfig?.responseHeaderPolicy?.securityHeader || {}
      );
      const corsOverrideConfig = keepConfigOverride(securityConfig?.responseHeaderPolicy?.cors || {});

      for (const configKey of Object.keys(securityHeaderOverrideConfig)) {
        if (!securityHeaderOverrideConfig[configKey]) {
          const headerKey = SECURITY_HEADER_MAP[configKey];
          if (isUndefined(req.get(headerKey))) {
            delete proxyRes.headers[headerKey];
          }
        }
      }

      for (const configKey of Object.keys(corsOverrideConfig)) {
        if (!corsOverrideConfig[configKey]) {
          const headerKey = CORS_HEADER_MAP[configKey];
          if (isUndefined(req.get(headerKey))) {
            delete proxyRes.headers[headerKey];
          }
        }
      }
    }
  });

  proxy.on('proxyRes', (proxyRes, req, res) => {
    const now = Date.now();
    req.upstreamConnectTime = (req.proxyReqStart ? now - req.proxyReqStart : 0) / 1000;

    onProxyRes(res, () => {
      req.upstreamHeaderTime = (now - req.proxyReqStart) / 1000;
    });

    proxyRes.on('end', () => {
      req.upstreamResponseTime = (Date.now() - req.proxyReqStart) / 1000;
    });
  });

  // Cross process events
  [
    BlockletEvents.updated,
    BlockletEvents.started,
    BlockletEvents.removed,
    BlockletEvents.statusChange,
    BlockletEvents.installed,
    BlockletEvents.componentRemoved,
  ].forEach((name) => {
    eventHub.on(name, async (data) => {
      const did = get(data, 'meta.did');
      if (did) {
        logger.info('delete blocklet cache on update', { did, pid: process.pid });
        await Promise.all([cache.blockletInfo.del(did), cache.notificationConfig.del(did)]);
      }

      // structV1Did is just for migration purpose and should be removed in the future
      const structV1Did = get(data, 'structV1Did');
      if (structV1Did) {
        logger.info('delete blocklet cache on update', { structV1Did, pid: process.pid });
        await Promise.all([cache.blockletInfo.del(structV1Did)]);
      }
    });
  });
  [BlockletEvents.removed].forEach((name) => {
    eventHub.on(name, (data) => {
      const did = get(data, 'appDid') || get(data, 'meta.did');
      if (did) {
        node
          .destroyTeamStates(did)
          .then(() => {
            logger.info('destroy team states on blocklet removed', { name, did });
          })
          .catch((error) => {
            logger.error('Failed to destroy team states on blocklet removed', { name, did, error });
          });
      }
    });
  });
  [BlockletEvents.installed, BlockletInternalEvents.componentInstalled].forEach((name) => {
    eventHub.on(name, (data) => {
      const did = get(data, 'appDid') || get(data, 'meta.did');
      if (did) {
        node
          .createTeamStates(did)
          .then(() => {
            logger.info('create team states on blocklet installed', { name, did });
          })
          .catch((error) => {
            logger.error('Failed to create team states on blocklet installed', { name, did, error });
          });
      }
    });
  });
  eventHub.on(BlockletEvents.securityConfigUpdated, ({ did }) => {
    // 检测到安全配置更新后，需要批量删除指定前缀的 cache（会包含整个 blocklet 所有的 security cache）
    logger.info('blocklet securityConfig update', { did, pid: process.pid });
    cache.removeSecurityConfig({ did });
  });
  eventHub.on(EVENTS.NODE_UPDATED, () => {
    logger.info('node update', { pid: process.pid });
    cache.deleteNodeInfo();
  });
  eventHub.on(TeamEvents.userPermissionUpdated, async ({ teamDid, user } = {}) => {
    logger.info('user permission updated', { teamDid, userDid: user?.did });
    await cache.sessionCacheDisabledUser.set(user?.did);
  });

  // Events to broadcast to all components
  [...Object.keys(BlockletInternalEvents), ...Object.keys(TeamEvents)].forEach((key) => {
    const event = BlockletInternalEvents[key] || TeamEvents[key];
    eventHub.on(event, (data) => {
      const { appDid, teamDid, componentDid } = data;

      // Let first worker process do something as master
      if (process.env.NODE_ENV === 'test' || process.env.NODE_APP_INSTANCE === '0') {
        if (event === BlockletInternalEvents.componentsUpdated) {
          return;
        }

        notificationService.sendToAppComponents
          .exec({ event, appDid: appDid || teamDid, componentDid, data })
          .catch((error) => {
            logger.error('send to component error', { error });
          });
      }
    });
  });

  async function wrapHelmet({ req, res, securityConfig, blocklet, info }, next) {
    let config = securityConfig?.responseHeaderPolicy?.securityHeader || {};
    config = cleanConfigOverride(config);
    // NOTICE: 获取当前站点所有可信的域名
    const trustedDomains = await federatedUtil.getTrustedDomains({ node, req, blocklet, minimal: true, info });
    // NOTICE: 这里需要使用全量的可信域名
    // 1. 用户直接打开指定网址 referer 会是空，无法应用匹配规则
    // 2. 用户从其他网站(非当前 blocklet)跳过来，referer 会是跳转前的网址，无法应用匹配规则
    // 综上，必须使用全量的可信域名，来确保统一登录可用
    config = await patchResponseHeader(config, { node, blocklet, trustedDomains, info });

    // TODO: apply these to user defined rules
    if (
      !config.contentSecurityPolicy?.directives &&
      req.accepts('text/html') &&
      !req.path.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api`) &&
      !req.path.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/static`) &&
      !req.path.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet`) &&
      !req.path.startsWith(`${WELLKNOWN_SERVICE_PATH_PREFIX}/studio`) &&
      req.path.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)
    ) {
      const iconifyDomains = CSP_ICONIFY_SOURCES;
      const whitelist = {
        // required for nft display and blocklet discover
        official: CSP_OFFICIAL_SOURCES,
        system: CSP_SYSTEM_SOURCES,

        // required for icon request and display
        thirdParty: [...CSP_THIRD_PARTY_SOURCES, ...iconifyDomains],
      };

      // server level dynamic domains
      if (isUrl(info?.nftDomainUrl)) {
        whitelist.system.push(new URL(info.nftDomainUrl).origin);
      }
      if (isUrl(info?.registerUrl)) {
        whitelist.system.push(new URL(info.registerUrl).origin);
      }

      whitelist.system = whitelist.system.filter((x) => removeIfOverlap(x, whitelist.official));

      // blocklet custom domains (optimized: single pass with flatMap)
      whitelist.aliases = (blocklet.site?.domainAliases || []).flatMap((x) => {
        if (x.isProtected || !x.value) return [];
        const url = `https://${x.value}`;
        return removeIfOverlap(url, whitelist.official) ? [url] : [];
      });

      // blocklet configured store domains (optimized: single pass with reduce)
      whitelist.store = (blocklet.settings?.storeList || []).reduce((acc, x) => {
        try {
          const { origin } = new URL(x.url);
          if (origin && removeIfOverlap(origin, whitelist.official)) acc.push(origin);
        } catch {
          // skip invalid URLs
        }
        return acc;
      }, []);

      // required for nft display and iframe embed (optimized: single pass with flatMap)
      whitelist.spaces = (blocklet.settings?.userSpaceHosts || []).flatMap((x) => {
        const url = `https://${x}`;
        return removeIfOverlap(url, whitelist.official) ? [url] : [];
      });

      // required for federated login (optimized: single pass with reduce)
      whitelist.login = [];
      if (req.path.startsWith(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/connect'))) {
        whitelist.login = ['opener', 'redirect'].reduce((acc, key) => {
          const value = req.query[key];
          if (isUrl(value)) {
            try {
              const { origin } = new URL(value);
              if (origin && removeIfOverlap(origin, whitelist.official)) acc.push(origin);
            } catch {
              // skip invalid URLs
            }
          }
          return acc;
        }, []);
      }

      config.contentSecurityPolicy = {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            'https://unpkg.com',
            'https://esm.run',
            'https://cdn.jsdelivr.net',
            'https://www.googletagmanager.com',
            ASSET_CDN_HOST,
          ].filter(Boolean),
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: [
            "'self'",
            'data:',
            'blob:',
            'https://cdnjs.cloudflare.com',
            ...whitelist.spaces,
            ...whitelist.official,
            ...iconifyDomains,
          ].filter(Boolean),
          fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com', ASSET_CDN_HOST],
          // 修复 did names 被添加时被限制的问题
          // https://github.com/ArcBlock/blocklet-server/issues/10984#issuecomment-2809600216
          connectSrc: uniq(
            [
              "'self'",
              'blob:',
              '*',
              // isDev ? 'ws://localhost:3040' : '',
              // ...whitelist.spaces,
              // ...whitelist.official,
              // ...whitelist.login,
              // ...whitelist.thirdParty,
              // ...whitelist.system,
              // ...whitelist.store,
              // ...whitelist.aliases,
            ].filter(Boolean)
          ),
          objectSrc: ["'self'", ...whitelist.official].filter(Boolean),
          frameSrc: [
            "'self'",
            'https://js.stripe.com',
            'https://*.youtube.com',
            'https://*.youtu.be',
            'https://*.vimeo.com',
            ...whitelist.official,
            ...trustedDomains.filter(Boolean).map((x) => `https://${x}`),
          ].filter(Boolean),
          frameAncestors: [
            "'self'",
            ...whitelist.spaces,
            ...whitelist.official,
            ...trustedDomains.filter(Boolean).map((x) => `https://${x}`),
          ].filter(Boolean),
          manifestSrc: ["'self'", ASSET_CDN_HOST],
        },
      };
    }

    const mergedConfig = {
      ...DEFAULT_HELMET_CONFIG,
      ...omitBy(config, isUndefined),
    };

    if (process.env.ABT_NODE_ALLOW_BLOCKLET_IFRAME_EMBEDDING) {
      mergedConfig.xFrameOptions = false;
    }

    try {
      helmet(mergedConfig)(req, res, next);
    } catch (error) {
      console.error('helmet error', { error });
      next();
    }
  }

  function wrapCors({ req, res, securityConfig, blocklet, info }, next) {
    try {
      cors(async (_req, callback) => {
        let config = securityConfig?.responseHeaderPolicy?.cors || {};
        config = await patchCors(config, { node, blocklet, info });
        config = cleanConfigOverride(config, req);

        // origin 如果要使用 *，必须只能设置为 *
        if (Array.isArray(config.origin) && config.origin.includes('*')) {
          config.origin = '*';
        }
        // HACK: 如果是 * ，需要转换为字符串来使用
        if (config.allowedHeaders?.join('') === '*') {
          config.allowedHeaders = '*';
        }
        // HACK: 如果是 * ，需要转换为字符串来使用
        if (config.exposedHeaders?.join('') === '*') {
          config.exposedHeaders = '*';
        }

        callback(null, {
          ...DEFAULT_CORS_CONFIG,
          ...omitBy(config, isUndefined),
        });
      })(req, res, next);
    } catch (error) {
      logger.error('Failed to apply cors middleware', { error });
      next();
    }
  }

  // Http server
  const server = express();

  // A simple websocket router
  const wsRoutingRules = [];
  const wsRouter = {
    use(mountPoint, handler) {
      wsRoutingRules.push({ path: mountPoint, handle: handler });
    },
  };

  // NOTICE: we need to trust proxy to get real ip address
  server.set('trust proxy', 'loopback');

  server.use(cookieParser());
  // 此时没有执行 bodyParser，所以不使用 body 进行判断
  server.use(ensureLocale({ methods: ['query', 'cookies'] }));

  // Shared util functions on current request
  server.use((req, res, next) => {
    // NOTICE: 增加了 req 上的公用函数，比如 req.getBlocklet
    attachSharedUtils({ node, req, options });
    StaticService.attachUtils({ req, res, proxy });
    next();
  });

  // 该接口不需要经过 security 中间件
  server.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/share/shared-bridge.html`, (req, res) => {
    res.set('cross-origin-resource-policy', 'cross-origin');
    res.set('cross-origin-embedder-policy', 'require-corp');
    if (isProduction) {
      res.sendFile(path.join(__dirname, '../dist', 'share', 'shared-bridge.html'));
    } else {
      res.sendFile(path.join(__dirname, '../public', 'share', 'shared-bridge.html'));
    }
  });
  server.use(cdn());

  // 提供统一的 service-worker 注册入口，优先采用 service 自己提供的逻辑，尽量不依赖 Nginx 配置
  server.use(
    [
      // DEPRECATED: 后续统一使用 __sw__ 地址
      /.*\/__service-worker__\.js$/,
      /.*\/__sw__\.js$/,
    ],
    ensureBlocklet(),
    (req, res, next) => {
      const { blocklet } = req;
      const componentId = req.headers['x-blocklet-component-id'];
      if (!componentId) {
        logger.warn('Missing x-blocklet-component-id header', { url: req.url });
        res.type('js').send('');
        return;
      }
      const componentDid = componentId.split('/').pop();
      const appUrl = blocklet.environmentObj?.BLOCKLET_APP_URL;
      const component = findComponentByIdV2(blocklet, componentId);
      res.set('Service-Worker-Allowed', withTrailingSlash(component.mountPoint));
      const realSwUrl = withQuery(joinURL(BLOCKLET_PROXY_PATH_PREFIX, componentDid, 'service-worker.js'), {
        // 确保获取到的 sw 是最新的
        d: Date.now(),
      });
      const scope = withTrailingSlash(component.mountPoint);

      const componentMountPoints = getMountPoints(blocklet);
      const sharedComponents = (blocklet?.children || []).filter((child) => {
        const enabledShared = child?.configs?.find((x) => {
          if (x.key === 'SERVICE_WORKER_SHARING_ENABLED' && x.value === 'true') {
            return true;
          }
          return false;
        });
        return !!enabledShared;
      });
      const mountPoints = componentMountPoints.map((x) => withTrailingSlash(x.mountPoint));
      const sharedMountPoints = sharedComponents.map((x) => withTrailingSlash(x.mountPoint));
      const customContent = `importScripts('${WELLKNOWN_SERVICE_PATH_PREFIX}/static/share/workbox-v7.3.0/workbox-sw.js');
workbox.setConfig({
  modulePathPrefix: '${WELLKNOWN_SERVICE_PATH_PREFIX}/static/share/workbox-v7.3.0/',
});

self.blocklet = {
  workbox,
  did: '${componentDid}',
  prefix: '${scope}',
  mountPoints: ${JSON.stringify(mountPoints)},
  sharedMountPoints: ${JSON.stringify(sharedMountPoints)},
  whiteList: [
    '/favicon.ico',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-dark',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-favicon',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-rect',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/logo-rect-dark',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/splash/portrait',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/blocklet/splash/landscape',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/openembed.json',
    '${WELLKNOWN_SERVICE_PATH_PREFIX}/openembed.yaml',
  ],
  canCache({ url }) {
    const gaList = ['https://www.google-analytics.com', 'https://www.googletagmanager.com/gtag/js']
    if (gaList.some(x => url.href.startsWith(x))) {
      return false;
    }
    const pathname = url.pathname;
    if (pathname.startsWith('/.well-known/analytics')) {
      return false;
    }
    if (
      pathname.startsWith('${WELLKNOWN_SERVICE_PATH_PREFIX}/static/share/') ||
      pathname.startsWith('${BLOCKLET_PROXY_PATH_PREFIX}/'+self.blocklet.did) ||
      self.blocklet.whiteList.some((x) => x === url.pathname)
    ) {
      return true;
    }

    if (self.blocklet.sharedMountPoints.some((x) => pathname.startsWith(x))) {
      return true;
    }

    const otherMountPoints = self.blocklet.mountPoints.filter((item) => item !== self.blocklet.prefix);
    if (self.blocklet.prefix === '/') {
      if (!otherMountPoints.some((x) => pathname.startsWith(x)) && !pathname.startsWith('${WELLKNOWN_SERVICE_PATH_PREFIX}/')) {
        return true;
      }
      return false;
    }
    if (pathname.startsWith(self.blocklet.prefix)) {
      return true;
    }
    return false;
  },
  fixRouteUrl(route) {
    return {
      ...route,
      url: '${BLOCKLET_PROXY_PATH_PREFIX}/'+self.blocklet.did+'/'+route.url,
    };
  },
};`;
      const proxySw = createProxyMiddleware({
        target: appUrl,
        pathRewrite: () => realSwUrl,
        changeOrigin: true,
        selfHandleResponse: true,
        on: {
          proxyRes: responseInterceptor((responseBuffer) => {
            if (!responseBuffer) {
              return customContent;
            }
            const response = responseBuffer.toString('utf8');
            return [customContent, response].join('\n');
          }),
        },
      });

      proxySw(req, res, next);
    }
  );

  // 此处逻辑会为 service 和 blocklet 都增加安全相关的 header 配置
  server.use(async (req, res, next) => {
    const did = req.getBlockletDid();
    // NOTICE: 非 blocklet 的请求也会经过这里，需要直接放行
    if (!did) {
      next();
      return;
    }
    const [blocklet, info] = await Promise.all([req.getBlocklet(), req.getNodeInfo()]);
    // NOTICE: blocklet 可能已被删除但请求仍在处理，需要直接放行
    if (!blocklet) {
      next();
      return;
    }
    const { accessPolicyConfig, responseHeaderPolicyConfig } = await req.getSecurityConfig();

    req.accessPolicyConfig = accessPolicyConfig;
    req.responseHeaderPolicyConfig = responseHeaderPolicyConfig;

    wrapHelmet({ req, res, securityConfig: responseHeaderPolicyConfig, blocklet, info }, () => {
      wrapCors({ req, res, securityConfig: responseHeaderPolicyConfig, blocklet, info }, () => {
        next();
      });
    });
  });

  /* istanbul ignore if */
  setupAccessLogger(server, isProduction ? getAccessLogStream() : undefined, true, {
    prefix: WELLKNOWN_SERVICE_PATH_PREFIX,
  });

  // Auth: login token and user info
  server.use(authMiddlewares.sessionBearerToken);
  // FIXME: 这里的逻辑会导致对当前会话的校验是否强制注销失败，暂时先只在 req.ensureUser 进行增强处理。后续需要考虑完整的 auth 鉴权层
  server.use(authMiddlewares.userInfo);

  // API: gql
  [
    '/api/gql',
    '/api/project/:did/:projectId/:type/upload',
    '/api/project/:did/:projectId/:releaseId/download/:file',
  ].forEach((pathname) => {
    server.use(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}${pathname}`,
      async (req, res, next) => {
        let info;
        try {
          info = await req.getBlockletInfo();
        } catch (_) {
          //
        }
        req.tenantMode = info?.tenantMode || BLOCKLET_TENANT_MODES.SINGLE;
        if (req.tenantMode === BLOCKLET_TENANT_MODES.MULTIPLE || pathname === '/api/gql') {
          checkGuestPermission(req, res, next);
        } else {
          checkMemberPermission(req, res, next);
        }
      },
      proxyToDaemon({ proxy, node })
    );
  });

  [
    '/api/preferences',
    '/api/theme',
    '/api/uploads',
    // 将上传 logo 代理给 daemon 完成
    '/blocklet/logo/upload/:logoType/:did',
    // media 相关处理代理到 daemon 中进行处理
    '/api/media/upload/**',
    '/blocklet/component/upload/:did',
  ].forEach((pathname) => {
    server.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}${pathname}`, checkMemberPermission, proxyToDaemon({ proxy, node }));
  });

  // org avatar 上传org avatar 读取（只需要校验登录即可）
  ['/blocklet/:did/orgs/avatar/upload', '/blocklet/:did/orgs/avatar/:filename'].forEach((pathname) => {
    server.use(`${WELLKNOWN_SERVICE_PATH_PREFIX}${pathname}`, checkGuestPermission, proxyToDaemon({ proxy, node }));
  });

  // Static assets
  StaticService.attachStaticResources({
    app: server,
    proxy,
    extraResources: [
      {
        prefix: '/open-graph',
        dir: getAppOgCacheDir(node.dataDirs.tmp),
      },
    ],
  });

  // This must come after all proxied requests that begins with WELLKNOWN_SERVICE_PATH_PREFIX
  server.use(WELLKNOWN_SERVICE_PATH_PREFIX, bodyParser, ensureLocale({ force: true }));

  // Studio service
  StudioService.init(server, node);

  // API: notification
  notificationService.sendToUser.attach(server);
  notificationService.sendToMail.attach(server);
  notificationService.sendToPush.attach(server);
  notificationService.sendToApp.attach(server);
  notificationService.sendToWebhook.attach(server);
  notificationService.sendToAppChannel.attach(server);
  notificationService.sendToEventBus.attach(server);
  relayService.sendToRelay.attach(server);

  // API: auth: before auth middleware
  authRoutes.createSessionRoutes.init(server, node);

  // Analytics
  AnalyticService.init({ app: server, node });

  // API: did-space
  DidSpaceService.init({ server });

  // API: KYC
  kycService.attach(server);

  // openapi & opencomponent
  createOpenAPIRoutes.init(server, node, options);
  createOpenComponentRoutes.init(server, node, options);
  createOpenEmbedRoutes.init(server, node, options);
  createOpenEventRoutes.init(server, node, options);

  // media
  createMediaRoutes.init(server, node, options);

  // MCP Service
  createMCPRoutes.init(server, node);

  // API: auth
  createOauthClientRoutes.init(server, node, options);
  createOAuthServerRoutes.init(server, node, options);
  createFederatedRoutes.init(server, node, options);
  createUserRoutes.init(server, node, options);
  createOcapRoutes.init(server, node);
  createCspProxyRoutes.init(server);
  createUserSessionRoutes.init(server, node, options);
  createEnvRoutes.init(server, node, options);
  createSignRoutes.init(server, node, options);
  createBlockletRoutes.init(server, node);
  createConnectSessionRoutes.init(server, node, options);
  createConnectRelayRoutes.init(server, node, options, wsRouter);
  authRoutes.attachDidAuthHandlers(server);
  authRoutes.createPassportRoutes.init(server, node);
  authRoutes.createPasskeyRoutes.init(server);
  authRoutes.createCommonRoutes.init(server);

  // API: dns resolver
  createDnsResolver.init(server);

  createAccessKeyRoutes.init(server, node);

  // API: invitation
  createInvite.init(server, node, {
    prefix: `${WELLKNOWN_SERVICE_PATH_PREFIX}/api`,
    type: 'blocklet',
  });

  // NOTE: this must be placed before static middleware for auto login to work for `/.well-known/service/admin`
  server.use(launcherLogin(node, options));

  // Web Page
  server.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/**`, (req, res, next) => {
    if (isFeDev) {
      return res.sendWebPage();
    }

    if (!RESOURCE_PATTERN.test(req.path) && req.accepts('html')) {
      return res.sendWebPage();
    }

    return next();
  });

  server.use(ensureBlocklet());

  // Middleware: check running
  // Request would not arrive here before blocklet is installed, because there is no config in router provider(nginx)
  server.use(checkRunning);

  // Middleware: check auth
  server.use(authMiddlewares.checkAuth);
  server.use(authMiddlewares.checkKyc);

  // Block invalid path in reserved prefix
  server.use((req, res, next) => {
    if (req.path.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)) {
      res.status(400).send('Bad request');
      return;
    }

    next();
  });

  // Serve static files directly for engine-based blocklets using built-in static-server
  // This eliminates the need for a separate static-server process
  server.use(serveStaticEngine());

  // After all service middleware, we can now safely pass all traffic to blocklets
  server.use(async (req, res) => {
    try {
      const { target, headers, error } = await ensureProxyUrl(req);
      if (target) {
        if (imageService.isImageAccepted(req) && imageService.isImageRequest(req)) {
          req.target = target; // for internal use
          imageService.processImage(req, res);
        } else {
          // NOTICE: 此处已经不需要再添加一次 header 了，在上面的中间件中会一起处理
          proxy.safeWeb(req, res, { target, headers });
        }
      } else {
        throw new Error(error);
      }
    } catch (err) {
      logger.error('Failed to get component target', { url: req.url, error: err });
      res.status(getStatusFromError(err)).send(`Blocklet Service: failed to get component target: ${err.message}`);
    }
  });

  // Following handlers exist just in case

  // 404 handler
  server.use((req, res) => {
    res.status(404).send('Blocklet Service: You should not be here!');
  });

  // error handler
  // eslint-disable-next-line no-unused-vars
  server.use((err, req, res, next) => {
    logger.error('Something broke', { url: req.url, error: err });
    res.status(getStatusFromError(err)).send(formatError(err));
  });

  // Web socket server

  // Simple websocket router like http router
  const httpServer = http.createServer(server);
  server.listen = httpServer.listen.bind(httpServer);
  httpServer.on('upgrade', (req, socket, head) => {
    attachSharedUtils({ node, req, options });

    // find matched handler registered by each service
    const { pathname } = new URL(req.url, `http://${req.headers.host || 'unknown'}`);
    const routes = wsRoutingRules.filter((x) => minimatch(normalizePathPrefix(pathname), normalizePathPrefix(x.path)));

    let routeIndex = 0;
    const next = () => {
      const route = routes[routeIndex];
      if (route) {
        routeIndex++;
        route.handle(req, socket, head, next);
      }
    };

    next();
  });

  // Notification
  notificationService.attach(wsRouter);
  relayService.attach(wsRouter);
  dashboardService.attachWsServer(wsRouter);

  // Only for Development
  StaticService.attachDevProxy({ wsRouter, proxy });

  // Auth
  wsRouter.use('**', authMiddlewares.ensureWsAuth);

  // Final: directly proxy all websocket request to target blocklet
  wsRouter.use('**', async (req, socket, head) => {
    const { target } = await ensureProxyUrl(req);
    if (target) {
      let isOpen = false;
      let timer;
      let proxyReq;

      const setProxyReq = (x) => {
        proxyReq = x;
      };

      const setIsOpen = () => {
        isOpen = true;
        clearTimeout(timer);
      };

      proxy.once('open', setIsOpen);
      proxy.once('proxyReqWs', setProxyReq);

      timer = setTimeout(() => {
        if (!isOpen) {
          proxy.off('open', setIsOpen);
          proxy.off('proxyReqWs', setProxyReq);

          // Only write if socket is still open and writable
          if (socket.writable && !socket.destroyed) {
            socket.write('HTTP/1.1 502 Proxy Timeout\r\n\r\n', (error) => {
              if (error) {
                logger.error('ws socket timeout response error', { error });
              }
              socket.destroy();
            });
            // If already closed, just ensure it's destroyed
          } else if (!socket.destroyed) {
            socket.destroy();
          }

          proxyReq?.destroy();
          proxyReq = null;
        }
      }, 120 * 1000);

      proxy.ws(req, socket, head, { target }, (error) => {
        proxy.off('open', setIsOpen);
        proxy.off('proxyReqWs', setProxyReq);
        clearTimeout(timer);
        proxyReq = null;

        if (error) {
          logger.error('socket proxy error', { from: req.url, to: target, ua: req.headers['user-agent'], error });

          socket.write('HTTP/1.1 502 Proxy Error\r\n\r\n', (err) => {
            if (error) {
              logger.error('ws socket 502 response error', { error: err });
            }
            socket.destroy();
          });
        }
      });
    } else {
      logger.error('socket proxy error: cannot find target service');
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n', (error) => {
        if (error) {
          logger.error('ws socket 404 response error', { error });
        }
        socket.destroy();
      });
    }
  });

  // Events
  server.on('sendToUser', (data) => {
    notificationService.sendToUser.exec(data).catch((error) => {
      logger.error('sendToUser error', { error, data });
    });
  });

  // BlockletEventsNotifier.init({ node, notificationService });
  if (process.env.NODE_ENV !== 'test') {
    notificationQueue.init({ node, notificationService });
  }

  server.sendToAppComponents = ({ event, appDid, data }) =>
    notificationService.sendToAppComponents.exec({ event, appDid, data });

  return server;
};
