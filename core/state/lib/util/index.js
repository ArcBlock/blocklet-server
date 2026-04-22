const fs = require('fs');
const os = require('os');
const path = require('path');
const dns = require('dns');
const crypto = require('crypto');
const shell = require('shelljs');
const camelCase = require('lodash/camelCase');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const { fromBase64 } = require('@ocap/util');
const { isFromPublicKey } = require('@arcblock/did');
const { joinURL } = require('ufo');
const { Certificate } = require('@fidm/x509');
const getPortLib = require('get-port');
const v8 = require('v8');
const StreamZip = require('node-stream-zip');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const axios = require('@abtnode/util/lib/axios');
const { encode: encodeBase32 } = require('@abtnode/util/lib/base32');
const { parse: parseBlockletMeta } = require('@blocklet/meta/lib/parse');
const { BlockletStatus } = require('@blocklet/constant');
const { replaceSlotToIp, isInProgress } = require('@blocklet/meta/lib/util');
const {
  StatusCode,
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTPS_PORT,
  SLOT_FOR_IP_DNS_SITE,
  BLOCKLET_SITE_GROUP_SUFFIX,
  DEFAULT_WELLKNOWN_PORT,
} = require('@abtnode/constant');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');

const APP_CONFIG_IMAGE_KEYS = [
  BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_LOGO_FAVICON,
  BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_PORTRAIT,
  BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_SPLASH_LANDSCAPE,
  BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_OG_IMAGE,
];

const logger = require('@abtnode/logger')('@abtnode/core:util');
const getSafeEnv = require('./get-safe-env');

const validateOwner = (owner) => {
  try {
    return (
      owner &&
      owner.did &&
      owner.pk &&
      (isFromPublicKey(owner.did, owner.pk) || isFromPublicKey(owner.did, fromBase64(owner.pk)))
    );
  } catch (e) {
    return false;
  }
};

const toStatus = (v) => Object.keys(StatusCode).find((x) => StatusCode[x] === Number(v));
const fromStatus = (v) => {
  const match = Object.entries(StatusCode).find((x) => x[1] === Number(v));
  return match ? match[0] : 'unknown';
};

const replaceDomainSlot = ({ domain, context = {}, nodeIp }) => {
  let processed = domain;
  if (processed.includes(SLOT_FOR_IP_DNS_SITE)) {
    const ipRegex = /\d+[-.]\d+[-.]\d+[-.]\d+/;
    const match = ipRegex.exec(context.hostname);
    if (match) {
      const ip = match[0];
      processed = replaceSlotToIp(processed, ip);
    } else if (nodeIp) {
      processed = replaceSlotToIp(processed, nodeIp);
    }
  }
  return processed;
};

const getBlockletHost = ({ domain, context, nodeIp }) => {
  const { protocol, port } = context || {};

  if (domain === DOMAIN_FOR_DEFAULT_SITE) {
    return '';
  }

  let tmpDomain = domain;
  if ([DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(domain) || !domain) {
    tmpDomain = context.hostname || '';
  }

  tmpDomain = replaceDomainSlot({ domain: tmpDomain, context, nodeIp });

  if (!port) {
    return tmpDomain;
  }

  if (protocol === 'https' && Number(port) === 443) {
    return tmpDomain; // 不展示 https 中的 443 端口
  }

  if (Number(port) === 80) {
    return tmpDomain; // 不展示 http 中的 80 端
  }

  return `${tmpDomain}:${port}`;
};

const isRoutingEnabled = (routing) => !!routing && !!routing.provider;

// Check whether a domain is setup
const checkDomainDNS = (domain) =>
  new Promise((resolve) => {
    dns.lookup(domain, (error, address) => {
      const data = {};
      if (error) {
        data.resolved = false;
      } else {
        data.resolved = true;
        data.ip = address;
      }

      resolve(data);
    });
  });

// async and promise style of shelljs.exec
const asyncExec = (command, options) =>
  new Promise((resolve) => {
    shell.exec(command, { async: true, ...options }, (code, stdout, stderr) => {
      resolve({ code, stdout, stderr });
    });
  });

const getProviderFromNodeInfo = (info) => get(info, 'routing.provider', 'default');

const isCLI = () => !process.env.ABT_NODE_SK;

/**
 * Returns the digest of the data with given hash algorithm.
 * @param {Buffer} data
 * @param {string} alg
 */
const getFingerprint = (data, alg) => {
  const shasum = crypto.createHash(alg);
  // eslint-disable-next-line newline-per-chained-call
  return shasum.update(data).digest('hex').match(/.{2}/g).join(':').toUpperCase();
};

const getHttpsCertInfo = (certificate) => {
  const info = Certificate.fromPEM(certificate);

  const domain = info.subject.commonName.valueOf();
  const validFrom = info.validFrom.valueOf();
  const validTo = info.validTo.valueOf();
  const issuer = {
    countryName: info.issuer.countryName.valueOf(),
    organizationName: info.issuer.organizationName.valueOf(),
    commonName: info.issuer.commonName.valueOf(),
  };

  return {
    domain,
    validFrom,
    validTo,
    issuer,
    sans: info.dnsNames,
    validityPeriod: info.validTo - info.validFrom,
    fingerprintAlg: 'SHA256',
    fingerprint: getFingerprint(info.raw, 'sha256'),
  };
};

const getDataDirs = (dataDir) => ({
  core: path.join(dataDir, 'core'),
  cache: path.join(dataDir, 'cache'),
  data: path.join(dataDir, 'data'),
  logs: path.join(dataDir, 'logs'),
  router: path.join(dataDir, 'router'),
  tmp: path.join(dataDir, 'tmp'),
  blocklets: path.join(dataDir, 'blocklets'),
  services: path.join(dataDir, 'services'),
  modules: path.join(dataDir, 'modules'),
  certManagerModule: path.join(dataDir, 'modules', 'certificate-manager'),
});

// Ensure data dir for Blocklet Server exists
const ensureDataDirs = (dataDir) => {
  try {
    logger.info('ensure data dir', { dataDir });
    fs.mkdirSync(dataDir, { recursive: true });
    const ignore = 'logs\ncache\nrouter\nblocklets\nservices';
    fs.writeFileSync(path.join(dataDir, '.gitignore'), ignore);
  } catch (err) {
    // Do nothing
  }
  const dataDirs = getDataDirs(dataDir);

  Object.keys(dataDirs).forEach((x) => fs.mkdirSync(dataDirs[x], { recursive: true }));

  return dataDirs;
};

const formatEnvironments = (environments) => Object.keys(environments).map((x) => ({ key: x, value: environments[x] }));

const transformIPToDomain = (ip) => ip.split('.').join('-');

const getBaseUrls = async (node, ips) => {
  const info = await node.getNodeInfo();
  const { https, httpPort, httpsPort } = info.routing;
  const getPort = (port, defaultPort) => (port && port !== defaultPort ? `:${port}` : '');
  const availableIps = uniq(ips.filter(Boolean));

  const getHttpInfo = async (domain) => {
    const certificate = https ? await node.certManager.getNormalByDomain(domain) : null;
    const protocol = certificate ? 'https' : 'http';
    const port = certificate ? getPort(httpsPort, DEFAULT_HTTPS_PORT) : getPort(httpPort, DEFAULT_HTTP_PORT);

    return { protocol, port };
  };

  if (info.routing.provider && info.routing.adminPath) {
    const sites = await node.getSitesFromState('system');
    const { ipWildcardDomain } = info.routing;
    const adminPath = normalizePathPrefix(info.routing.adminPath);
    const tmpHttpPort = getPort(httpPort, DEFAULT_HTTP_PORT);

    const httpUrls = info.routing.enableIpServer
      ? availableIps.map((ip) => {
          return {
            url: `http://${ip}${tmpHttpPort}${adminPath}`,
          };
        })
      : [];

    if (ipWildcardDomain) {
      const site = sites.find((c) => (c.domainAliases || []).find((item) => item.value === ipWildcardDomain));
      if (site) {
        const httpInfo = await getHttpInfo(ipWildcardDomain);
        const httpsUrls = availableIps.map((ip) => ({
          url: `${httpInfo.protocol}://${transformIPToDomain(ip)}.${ipWildcardDomain.substring(2)}${
            httpInfo.port
          }${adminPath}`,
        }));

        // add did domain access url
        const didDomainAlias = site.domainAliases.find((item) => item.value.endsWith(info.didDomain));
        if (didDomainAlias) {
          const didDomain = didDomainAlias.value;
          const didDomainHttpInfo = await getHttpInfo(didDomain);

          httpsUrls.push({
            url: `${didDomainHttpInfo.protocol}://${didDomain}${didDomainHttpInfo.port}${adminPath}`,
          });
        }

        return httpUrls.concat(httpsUrls);
      }
    }

    return httpUrls;
  }

  // port urls
  return availableIps.map((ip) => ({
    url: `http://${ip}:${info.port}`,
  }));
};

const expandBundle = async (bundlePath, destDir) => {
  // eslint-disable-next-line new-cap
  const zip = new StreamZip.async({ file: bundlePath });
  await zip.extract(null, destDir);
  await zip.close();
};

// eslint-disable-next-line no-shadow
const findInterfaceByName = (blocklet, name) => {
  const { interfaces = [] } = blocklet.meta;
  if (!Array.isArray(interfaces)) {
    return null;
  }

  return interfaces.find((x) => x.name === name);
};

const findInterfacePortByName = (blocklet, name) => {
  const found = findInterfaceByName(blocklet, name);
  const { ports, greenPorts, greenStatus } = blocklet;

  const realPorts = greenPorts && greenStatus === BlockletStatus.running ? greenPorts : ports;

  if (!found || !realPorts) {
    return null;
  }

  if (typeof found.port === 'string') {
    return realPorts[found.port];
  }

  return realPorts[found.port.internal];
};

const getWellknownSitePort = async () => {
  if (process.env.NODE_ENV === 'test') {
    const port = await getPortLib();
    return port;
  }

  return DEFAULT_WELLKNOWN_PORT;
};

const shouldUpdateBlockletStatus = (blockletStatus) =>
  isInProgress(blockletStatus) === false && blockletStatus !== BlockletStatus.error;

const getQueueConcurrencyByMem = () => {
  const totalMem = os.totalmem();
  const heapSizeLimit = v8.getHeapStatistics().heap_size_limit;

  const heapSizeRatio = heapSizeLimit / totalMem;

  if (heapSizeRatio <= 0.2) {
    return 4;
  }

  if (heapSizeRatio <= 0.3) {
    return 3;
  }

  if (heapSizeRatio <= 0.6) {
    return 2;
  }

  return 1;
};

// For performance sake, we only support 1 param here, and the cache is flushed every minute
const memoizeAsync = (fn, flushInterval = 60000) => {
  const cache = new Map();
  if (process.env.NODE_ENV !== 'test') {
    setInterval(() => cache.clear(), flushInterval);
  }

  return (arg) => {
    if (cache.has(arg)) {
      return cache.get(arg);
    }

    // eslint-disable-next-line prefer-spread
    const result = fn.apply(null, [arg]);
    cache.set(arg, result);

    return result;
  };
};

const getStateCrons = (states, teamManager) => [
  {
    name: 'cleanup-audit-logs',
    time: '0 0 6 * * *', // cleanup old logs every day at 6am
    // time: '0 */5 * * * *', // cleanup every 5 minutes
    options: { runOnInit: false },
    fn: async () => {
      const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 90);

      // Clean server-level audit logs
      const removed = await states.auditLog.remove({ createdAt: { $lt: cutoff } });
      logger.info(`Removed ${removed} server audit logs`);

      // Clean blocklet-level audit logs
      if (teamManager) {
        const blocklets = await states.blocklet.getBlocklets({}, { id: 1 });
        const results = await Promise.allSettled(
          blocklets.map(async (blocklet) => {
            const auditLogState = await teamManager.getAuditLogState(blocklet.id);
            const count = await auditLogState.remove({ createdAt: { $lt: cutoff } });
            if (count > 0) {
              logger.info(`Removed ${count} audit logs for blocklet ${blocklet.id}`);
            }
          })
        );
        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            logger.warn(`Failed to cleanup audit logs for blocklet ${blocklets[i].id}`, {
              error: result.reason.message,
            });
          }
        });
      }
    },
  },
];

const getDelegateState = async (chainHost, address) => {
  const result = await axios.post(
    joinURL(chainHost, '/gql/'),
    JSON.stringify({
      query: `{
        getDelegateState(address: "${address}") {
          state {
            address
            ops {
              key
            }
          }
        }
      }`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 60 * 1000,
    }
  );

  return get(result.data, 'data.getDelegateState.state');
};

const getNFTState = async (chainHost, nftId) => {
  const url = joinURL(new URL(chainHost).origin, '/api/gql/');

  const result = await axios.post(
    url,
    JSON.stringify({
      query: `{
        getAssetState(address: "${nftId}") {
          state {
            address
            data {
              typeUrl
              value
            }
            display {
              type
              content
            }
            issuer
            owner
            parent
            tags
          }
        }
      }`,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 60 * 1000,
    }
  );

  const state = get(result, 'data.data.getAssetState.state');
  if (state && state.data.typeUrl === 'json') {
    state.data.value = JSON.parse(state.data.value);
  }

  return state;
};

const getServerDidDomain = (nodeInfo) => `${encodeBase32(nodeInfo.did)}.${nodeInfo.didDomain}`;

const prettyURL = (url, isHttps = true) => {
  if (typeof url !== 'string') {
    return url;
  }

  if (url.toLowerCase().startsWith('http')) {
    return url;
  }

  return isHttps ? `https://${url}` : `http://${url}`;
};

const templateReplace = (str, vars = {}) => {
  if (typeof str === 'string') {
    return str.replace(/{([.\w]+)}/g, (m, key) => get(vars, key));
  }

  return str;
};

const isGatewayCacheEnabled = (info) => {
  const cacheEnabled = get(info, 'routing.cacheEnabled');
  if (typeof cacheEnabled === 'boolean') {
    return cacheEnabled;
  }

  return true;
};

const isBlockletSite = (domain) => domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX);
const isServerSite = (domain) =>
  [DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(domain);

const getDbFilePath = (filePath) => (process.env.NODE_ENV === 'test' ? `${filePath}:memory:` : filePath);

const toCamelCase = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }

  const converted = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      converted[camelCase(key)] = toCamelCase(obj[key]);
    }
  }

  return converted;
};

const lib = {
  APP_CONFIG_IMAGE_KEYS,
  validateOwner,
  getProviderFromNodeInfo,
  toStatus,
  fromStatus,
  formatEnvironments,
  replaceDomainSlot,
  getBlockletHost,
  isRoutingEnabled,
  checkDomainDNS,
  asyncExec,
  isCLI,
  getHttpsCertInfo,
  ensureDataDirs,
  getDataDirs,
  getBaseUrls,
  getBlockletMeta: parseBlockletMeta,
  expandBundle,
  findInterfaceByName,
  findInterfacePortByName,
  getWellknownSitePort,
  shouldUpdateBlockletStatus,
  transformIPToDomain,
  getQueueConcurrencyByMem,
  getSafeEnv,
  memoizeAsync,
  getStateCrons,
  getDelegateState,
  getNFTState,
  getServerDidDomain,
  prettyURL,
  templateReplace,
  isGatewayCacheEnabled,
  isBlockletSite,
  isServerSite,
  getDbFilePath,
  toCamelCase,
};

module.exports = lib;
