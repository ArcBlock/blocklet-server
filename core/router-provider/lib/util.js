/* eslint-disable no-await-in-loop */
const fs = require('fs-extra');
const path = require('path');
const getPort = require('get-port');
const portUsed = require('port-used');
const sortBy = require('lodash/sortBy');
const isValidDomain = require('@arcblock/is-valid-domain');
const checkDomainMatch = require('@abtnode/util/lib/check-domain-match');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const { template404, template502, template5xx, templateWelcome } = require('@abtnode/router-templates');

const {
  IP,
  DEFAULT_HTTP_PORT,
  DEFAULT_HTTPS_PORT,
  DEFAULT_IP_DOMAIN_SUFFIX,
  DOMAIN_FOR_DEFAULT_SITE,
  ROUTING_RULE_TYPES,
  SLOT_FOR_IP_DNS_SITE,
} = require('@abtnode/constant');

const decideHttpPort = (port) => port || process.env.ABT_NODE_HTTP_PORT || DEFAULT_HTTP_PORT;
const decideHttpsPort = (port) => port || process.env.ABT_NODE_HTTPS_PORT || DEFAULT_HTTPS_PORT;

const findCertificate = (certs, domain) => {
  const lowerDomain = domain.toLowerCase();

  // First try exact match (highest priority)
  // Note: Domain matching should be case-insensitive per DNS standards
  for (const cert of certs) {
    const certDomains = [cert.domain, ...(cert.meta?.sans || cert.sans || [])].map((d) => d.toLowerCase());
    if (certDomains.includes(lowerDomain)) {
      return cert;
    }
  }

  // Then try wildcard match
  // Note: wildcard cert *.example.com should match foo.example.com
  // but should NOT match example.com itself (per SSL/TLS standards)
  const domainParts = domain.split('.');

  for (const cert of certs) {
    const certDomains = [cert.domain, ...(cert.meta?.sans || cert.sans || [])];

    for (const certDomain of certDomains) {
      // Skip wildcard certs that would incorrectly match the base domain
      // e.g., *.staging.myvibe.so should not match staging.myvibe.so
      if (certDomain.startsWith('*.')) {
        const certBaseParts = certDomain.substring(2).split('.');
        // If domain has same or fewer parts than cert base, it's the base domain or shorter
        // Wildcard should only match domains with more parts (subdomains)
        if (domainParts.length <= certBaseParts.length) {
          continue; // eslint-disable-line no-continue
        }
      }

      if (checkDomainMatch(certDomain, domain)) {
        return cert;
      }
    }
  }

  return undefined;
};

const trimEndSlash = (str) => {
  if (str && str.length > 1 && str[str.length - 1] === '/') {
    return str.substr(0, str.length - 1);
  }

  return str;
};

const concatPath = (prefix = '', suffix = '', root = false) => {
  if (root && suffix) {
    return suffix ? `~* ^${suffix}$` : '/';
  }

  if (prefix === '/') {
    return suffix ? `~* .*${suffix}$` : '/';
  }

  return suffix ? `~* ^${prefix}.*${suffix}$` : prefix;
};

const formatRoutingTable = (routingTable) => {
  const sites = {};
  const configs = [];

  routingTable.forEach((site) => {
    let { domain } = site;
    if (site.domain === DOMAIN_FOR_DEFAULT_SITE) {
      domain = '_';
    }

    configs.push({ domain });

    if (!sites[domain]) {
      sites[domain] = {
        domain,
        type: site.type,
        blockletDid: site.blockletDid,
        rules: [],
        port: site.port,
        serviceType: site.serviceType,
      };
    }

    (site.rules || []).forEach((x) => {
      if (x.to.type === ROUTING_RULE_TYPES.COMPONENT) {
        console.warn(`Rule type is dropped: ${x.to.type}`, x);
        return;
      }

      const prefix = trimEndSlash(x.from.pathPrefix || '/');
      const groupPrefix = trimEndSlash(x.from.groupPathPrefix || '/');
      const suffix = trimEndSlash(x.from.pathSuffix || '');

      const rule = {
        ruleId: x.id,
        type: x.to.type,
        prefix,
        groupPrefix,
        suffix,
        proxyBehavior: x.proxyBehavior,
        response: x.to.response,
        root: !!x.from.root, // do not use x.from.pathPrefix when generate rule
      };
      if (x.to.type === ROUTING_RULE_TYPES.REDIRECT) {
        rule.redirectCode = x.to.redirectCode || 302;
        rule.url = x.to.url;
        if (x.to.preservePath !== undefined) {
          rule.preservePath = x.to.preservePath;
        }
        if (x.to.preserveQuery !== undefined) {
          rule.preserveQuery = x.to.preserveQuery;
        }
      } else if (x.to.type === ROUTING_RULE_TYPES.GENERAL_REWRITE) {
        rule.url = x.to.url;
      } else {
        rule.port = +x.to.port;
        rule.did = x.to.did;
        // Use shared cache zone for all blocklets (defined in nginx.conf http block)
        rule.cacheGroup = x.to.cacheGroup ? 'blockletProxy' : '';
        rule.componentId = x.to.componentId;
        rule.target = trimEndSlash(normalizePathPrefix(x.to.target || '/'));
        rule.targetPrefix = x.to.targetPrefix || '';
        rule.services = x.services || [];
        rule.pageGroup = x.to.pageGroup;
        // Static serving fields for engine-based blocklets
        if (x.to.staticRoot) {
          rule.staticRoot = trimEndSlash(x.to.staticRoot);
        }
      }

      const addRule = (r) => {
        const tmpPath = concatPath(r.prefix, r.suffix);
        const tmpRules = sites[domain].rules;
        if (!tmpRules.find(({ prefix: p, suffix: s }) => concatPath(p, s) === tmpPath)) {
          sites[domain].rules.push(r);
        }
      };

      addRule(rule);
    });

    const { rules } = sites[domain];
    const rulesWithoutSuffix = sortBy(rules.filter((x) => !x.suffix), (x) => -x.prefix.length); // prettier-ignore
    const rulesWithSuffix = sortBy(rules.filter((x) => x.suffix), (x) => -x.prefix.length); // prettier-ignore

    sites[domain].rules = rulesWithoutSuffix.concat(rulesWithSuffix);
  });

  return { sites: Object.values(sites), configs };
};

/**
 *
 *
 * @param {string} domain
 * @return {boolean}
 */
const isSpecificDomain = (domain) => {
  if (isValidDomain(domain) === false) {
    return false;
  }

  return !domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX);
};

const toSlotDomain = (domain) => {
  if (domain.endsWith(DEFAULT_IP_DOMAIN_SUFFIX)) {
    const subDomain = domain.split('.').shift();
    const matches = subDomain.match(IP);
    if (matches) {
      return domain.replace(matches[0].slice(1), SLOT_FOR_IP_DNS_SITE);
    }
  }

  return domain;
};

const findRule = (rules, url) =>
  rules.find((x) => {
    const [pathname] = url.split('?');
    const { prefix, suffix = '' } = x;
    if (suffix) {
      const regex = new RegExp(`${suffix}$`);
      return pathname.startsWith(prefix) && regex.test(pathname);
    }

    if (prefix === '/' && prefix === pathname) {
      return true;
    }

    return pathname.startsWith(prefix);
  });
const matchRule = (rules, url) => {
  const rulesWithSuffix = rules.filter((x) => x.suffix);
  const rulesWithoutSuffix = rules.filter((x) => !x.suffix);
  return findRule(rulesWithSuffix, url) || findRule(rulesWithoutSuffix, url);
};

const isPortOccupied = (port) => portUsed.check(port);
const getUsablePort = async (preferredPorts, hasPortPermission) => {
  for (const port of preferredPorts) {
    const occupied = await isPortOccupied(port);
    if (!occupied) {
      const listenable = await hasPortPermission(port);
      if (listenable) {
        return port;
      }
    }
  }

  return getPort();
};
const getUsablePorts = async (provider, hasPortPermission) => {
  const file = path.join(process.env.PM2_HOME, `${provider}-preferred-ports.json`);
  if (fs.existsSync(file)) {
    const config = fs.readJsonSync(file);
    if (config.httpPort && config.httpsPort) {
      return config;
    }
  }

  const [httpPort, httpsPort] = await Promise.all([
    getUsablePort([80, 8080], hasPortPermission),
    getUsablePort([443, 8443], hasPortPermission),
  ]);

  const config = { httpPort, httpsPort };
  fs.writeJsonSync(file, config);
  return config;
};

module.exports = {
  decideHttpPort,
  decideHttpsPort,
  getUsablePorts,
  getUsablePort,
  isPortOccupied,
  findCertificate,
  concatPath,
  trimEndSlash,
  formatRoutingTable,
  isSpecificDomain,
  toSlotDomain,
  matchRule,
  get404Template: (info) => template404(info),
  get502Template: (info) => template502(info),
  get5xxTemplate: (info) => template5xx(info),
  getWelcomeTemplate: (info) => templateWelcome(info),
};
