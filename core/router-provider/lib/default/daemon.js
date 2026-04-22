/* eslint-disable no-continue */
const url = require('url');
const path = require('path');
const fs = require('fs-extra');
const get = require('lodash/get');
const { joinURL } = require('ufo');
const checkDomainMatch = require('@abtnode/util/lib/check-domain-match');
const { DEFAULT_IP_DOMAIN_SUFFIX, ROUTING_RULE_TYPES, WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

const logger = require('@abtnode/logger')('router:default:daemon', { filename: 'engine' });

const { findCertificate, isSpecificDomain, toSlotDomain, matchRule } = require('../util');
const ProxyServer = require('./proxy');

const configPath = process.env.ABT_NODE_ROUTER_CONFIG;
const httpPort = +process.env.ABT_NODE_ROUTER_HTTP_PORT;
const httpsPort = +process.env.ABT_NODE_ROUTER_HTTPS_PORT;
const servicePort = +process.env.ABT_NODE_SERVICE_PORT;

if (fs.existsSync(configPath) === false) {
  throw new Error('Router config file not found');
}

const wwwDir = path.join(path.dirname(configPath), 'www');
const fileIndex = fs.readFileSync(path.join(wwwDir, 'index.html')).toString();
const file404 = fs.readFileSync(path.join(wwwDir, '404.html')).toString();
const file5xx = fs.readFileSync(path.join(wwwDir, '5xx.html')).toString();
const file502 = fs.readFileSync(path.join(wwwDir, '502.html')).toString();

process.on('message', (msg) => {
  if (msg.data === 'reload') {
    logger.info('update config', msg);
    // eslint-disable-next-line no-use-before-define
    updateConfig(true);
  }
});

const config = { sites: [], rules: {}, certs: [], headers: [] };

// eslint-disable-next-line
const createRequestHandler = (id) => (req, res, target) => {
  const rule = config.rules[id];

  if (rule.type === ROUTING_RULE_TYPES.DIRECT_RESPONSE) {
    if (rule.response.contentType) {
      res.writeHead(rule.response.status, { 'Content-Type': rule.response.contentType });
    }

    res.end((rule.response.body || '').replace(/\\"/g, '"'));

    return { abort: true };
  }

  // Note: redirection required for relative asset loading
  if (req.method === 'GET' && rule.prefix !== '/') {
    const parsed = url.parse(req.url);
    if (parsed.pathname === rule.prefix) {
      logger.info('redirect url', { url: req.url, rule });
      parsed.pathname = rule.prefix.endsWith('/') ? rule.prefix : `${rule.prefix}/`;
      res.writeHead(307, { Location: url.format(parsed) });
      res.end();
      return { abort: true };
    }
  }

  if (rule.type === ROUTING_RULE_TYPES.GENERAL_PROXY) {
    // do not rewrite for internal servers
  } else if (rule.prefix.includes(WELLKNOWN_SERVICE_PATH_PREFIX)) {
    // do not rewrite for service requests
  } else {
    req.url = joinURL(rule.target, req.url.substr(rule.prefix.length));
  }
  if (req.url.startsWith('/') === false) {
    req.url = `/${req.url}`;
  }
  logger.debug('transform url', { url: req.url, rule });

  // NOTE: x-* header keys must be lower case to avoid collisions from chained proxy
  if (rule.did) {
    req.headers['x-blocklet-did'] = rule.did;
  }
  if (rule.componentId) {
    req.headers['x-blocklet-component-id'] = rule.componentId;
  }
  if (rule.pageGroup) {
    req.headers['x-page-group'] = rule.pageGroup;
  }

  req.headers['x-path-prefix'] = rule.prefix.replace(WELLKNOWN_SERVICE_PATH_PREFIX, '') || '/';
  req.headers['x-group-path-prefix'] = rule.groupPrefix || '/';

  if (rule.ruleId) {
    req.headers['x-routing-rule-id'] = rule.ruleId;
  }

  if (rule.target && rule.target !== '/') {
    req.headers['x-routing-rule-path-prefix'] = rule.target;
  }
};

// eslint-disable-next-line
const sharedResolver = (host, url, req) => {
  // match slot domain
  const domain = toSlotDomain(host);

  // match specific domain
  let site = config.sites.find((x) => x.domain === domain);

  // match wildcard domain
  if (!site) {
    site = config.sites.find((x) => checkDomainMatch(x.domain, domain));
  }

  // fallback to default domain
  if (!site) {
    site = config.sites.find((x) => x.domain === '_');
  }

  const rule = matchRule(site.rules, url);
  if (!rule) {
    logger.warn('rule not found for request', { host, url, domain });
    return null;
  }

  const match = findCertificate(config.certs, domain);
  const upstream = `http://127.0.0.1:${rule.type === ROUTING_RULE_TYPES.BLOCKLET ? servicePort : rule.port || servicePort}`; // prettier-ignore
  logger.debug('resolved request', { host, url, domain, upstream, rule });

  return {
    id: rule.id,
    url: rule.targetPrefix && rule.targetPrefix !== '/' ? joinURL(upstream, rule.targetPrefix) : upstream,
    path: '/',
    opts: {
      ssl: match ? { key: match.privateKey, cert: match.certificate } : null,
      onRequest: createRequestHandler(rule.id),
    },
  };
};
sharedResolver.priority = 200;

const onError = (err, req, res) => {
  logger.error('proxy error', { error: err });
  if (typeof res.writeHead !== 'function') {
    return;
  }

  if (err.code === 'ECONNREFUSED') {
    res.writeHead(502);
    res.end(file502);
  } else if (err.code === 'NOTFOUND') {
    const parsed = url.parse(req.url);
    if (config.info.enableWelcomePage && parsed.pathname === '/') {
      res.writeHead(404);
      res.end(fileIndex);
    } else {
      res.writeHead(404);
      res.end(file404);
    }
  } else {
    res.writeHead(500);
    res.end(file5xx);
  }
};

// internal servers
const internalServers = {};
const ensureInternalServer = (port) => {
  if (internalServers[port]) {
    return;
  }

  const server = new ProxyServer({ xfwd: false, internal: true, port, headers: config.headers, onError });
  server.addResolver(sharedResolver);
  internalServers[port] = server;
  logger.info('internal server ready on port', { port });
};

const updateConfig = (reload = false) => {
  const { sites, certificates: rawCerts, info } = fs.readJsonSync(configPath);
  config.info = info;

  const obj = get(info, 'routing.headers', {});
  config.headers = Object.keys(obj).map((key) => ({ key, value: JSON.parse(obj[key]) }));

  // format certificates
  config.certs = rawCerts.map((x) => {
    x.privateKey = Buffer.from(x.privateKey);
    x.certificate = Buffer.from(x.certificate);
    return x;
  });

  // format sites
  sites.forEach((site) => {
    site.rules.forEach((rule) => {
      config.rules[rule.id] = rule;
    });
  });

  // re-register sites in reload mode
  if (reload) {
    const oldDomains = config.sites.map((x) => x.domain);
    const newDomains = sites.map((x) => x.domain);

    const addedDomains = newDomains.filter((x) => !oldDomains.includes(x));
    for (const domain of addedDomains) {
      if (isSpecificDomain(domain) === false) {
        continue;
      }
      const site = sites.find((x) => x.domain === domain);
      const [rule] = site.rules.filter((x) => ['daemon', 'blocklet'].includes(x.type));
      if (!rule) {
        continue;
      }
      if (!rule.port) {
        logger.warn('No port found for rule', rule);
        return;
      }

      logger.info('register domain on reload', { domain });
      const match = findCertificate(config.certs, site.domain);
      // eslint-disable-next-line no-use-before-define
      main.register({
        src: site.domain,
        target: `http://127.0.0.1:${rule.port}`,
        ssl: match ? { key: match.privateKey, cert: match.certificate } : null,
        onRequest: createRequestHandler(rule.id),
      });
    }

    const removedDomains = oldDomains.filter((x) => !newDomains.includes(x));
    for (const domain of removedDomains) {
      // eslint-disable-next-line no-use-before-define
      main.unregister(domain);
      logger.info('unregister domain on reload', { domain });
      // eslint-disable-next-line no-use-before-define
      delete main.routing[domain];
      logger.info('remove domain cache on reload', { domain });
    }

    config.sites.filter((x) => x.port).forEach((x) => ensureInternalServer(x.port));
  }

  config.sites = sites;
};

// load initial config
updateConfig();

// create main server
const defaultCert = config.certs.find((x) => x.domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX));
const main = new ProxyServer({
  xfwd: true,
  onError,
  port: httpPort,
  headers: config.headers,
  ssl: {
    port: httpsPort,
    key: defaultCert ? defaultCert.privateKey : null,
    cert: defaultCert ? defaultCert.certificate : null,
    opts: {
      honorCipherOrder: false,
      maxVersion: 'TLSv1.3',
      minVersion: 'TLSv1.2',
    },
  },
});
main.sites = config.sites;
main.addResolver(sharedResolver);

// register sites: to ensure https certificates are loaded
config.sites.forEach((site) => {
  const { domain } = site;
  if (isSpecificDomain(domain) === false) {
    return;
  }

  const [rule] = site.rules.filter((x) => ['daemon', 'blocklet'].includes(x.type));
  if (!rule) {
    return;
  }
  if (!rule.port) {
    logger.warn('No port found for rule', rule);
    return;
  }

  const match = findCertificate(config.certs, domain);
  logger.info('register domain on start', { domain });
  main.register({
    src: domain,
    target: `http://127.0.0.1:${rule.port}`,
    ssl: match ? { key: match.privateKey, cert: match.certificate } : null,
    onRequest: createRequestHandler(rule.id),
  });
});

// initialize internal servers
config.sites.filter((x) => x.port).forEach((x) => ensureInternalServer(x.port));

logger.info(`Default routing engine ready on ${httpPort} and ${httpsPort}`);

['exit', 'SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException', 'SIGTERM'].forEach((e) => {
  process.on(e, () => {
    main.close();
    Object.keys(internalServers).forEach((key) => internalServers[key].close());
  });
});
