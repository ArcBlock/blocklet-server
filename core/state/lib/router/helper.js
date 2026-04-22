/* eslint-disable no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
const fs = require('fs-extra');
const path = require('path');
const tar = require('tar');
const dns = require('dns').promises;
const UUID = require('uuid');
const dayjs = require('@abtnode/util/lib/dayjs');
const get = require('lodash/get');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const groupBy = require('lodash/groupBy');
const uniq = require('lodash/uniq');
const isEqual = require('lodash/isEqual');
const countBy = require('lodash/countBy');
const { joinURL } = require('ufo');
const {
  replaceSlotToIp,
  findComponentById,
  findWebInterface,
  getComponentId,
  hasStartEngine,
} = require('@blocklet/meta/lib/util');
const { getProvider } = require('@abtnode/router-provider');
const md5 = require('@abtnode/util/lib/md5');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const getTmpDir = require('@abtnode/util/lib/get-tmp-directory');
const downloadFile = require('@abtnode/util/lib/download-file');
const axios = require('@abtnode/util/lib/axios');
const { getIpDnsDomainForBlocklet, getDidDomainForBlocklet } = require('@abtnode/util/lib/get-domain-for-blocklet');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');
const { forEachBlockletSync } = require('@blocklet/meta/lib/util');
const { processLogByDate } = require('@abtnode/analytics');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');
const pRetry = require('p-retry');
const { buildLauncherUrl, buildRequestHeaders } = require('@abtnode/auth/lib/launcher');
const {
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  DOMAIN_FOR_INTERNAL_SITE,
  WELLKNOWN_PATH_PREFIX,
  WELLKNOWN_SERVICE_PATH_PREFIX,
  USER_AVATAR_PATH_PREFIX,
  DOMAIN_FOR_IP_SITE,
  NAME_FOR_WELLKNOWN_SITE,
  ROUTING_RULE_TYPES,
  CERTIFICATE_EXPIRES_OFFSET,
  SLOT_FOR_IP_DNS_SITE,
  BLOCKLET_SITE_GROUP_SUFFIX,
  WELLKNOWN_ACME_CHALLENGE_PREFIX,
  WELLKNOWN_DID_RESOLVER_PREFIX,
  WELLKNOWN_OAUTH_SERVER,
  WELLKNOWN_OPENID_SERVER,
  WELLKNOWN_PING_PREFIX,
  WELLKNOWN_ANALYTICS_PREFIX,
  LOG_RETAIN_IN_DAYS,
  ABT_NODE_ANALYTICS_RETAIN_IN_DAYS,
  EVENTS,
  DEFAULT_IP_DOMAIN,
  WELLKNOWN_BLACKLIST_PREFIX,
  NODE_MODES,
  ACCESS_POLICY_PUBLIC,
  DEFAULT_DID_DOMAIN,
} = require('@abtnode/constant');
const {
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_PUBLIC,
  BLOCKLET_INTERFACE_WELLKNOWN,
  BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
  BlockletEvents,
  BLOCKLET_MODES,
} = require('@blocklet/constant');
const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');

const pkg = require('../../package.json');
// eslint-disable-next-line
const logger = require('@abtnode/logger')(`${pkg.name}:router:helper`);
const {
  getHttpsCertInfo,
  findInterfacePortByName,
  getWellknownSitePort,
  getServerDidDomain,
  isGatewayCacheEnabled,
  isBlockletSite,
} = require('../util');
const { getFromCache: getAccessibleExternalNodeIp } = require('../util/get-accessible-external-node-ip');

const Router = require('./index');
const states = require('../states');
const monitor = require('./monitor');
const scanner = require('./security/scanner');
const blocker = require('./security/blocker');
const { createLimiter } = require('./security/limiter');
const {
  getBlockletDomainGroupName,
  getDidFromDomainGroupName,
  createProviderInstance,
  expandBlacklist,
} = require('../util/router');
const {
  getBlockletDidDomainList,
  updateDidDocument: updateBlockletDocument,
  getPackConfig,
} = require('../util/blocklet');
const { toCamelCase } = require('../util/index');
const { get: getIp } = require('../util/ip');
const { cleanupAnalyticsData } = require('../util/cleanup-analytics');
const { getBlockletSecurityRules } = require('../blocklet/security/security-rule');

const isServiceFeDevelopment = process.env.ABT_NODE_SERVICE_FE_PORT;

// 使用 DBCache 实现分布式锁，防止同一个 blocklet 的路由操作并发执行
const ensureBlockletRoutingLock = new DBCache(() => ({
  prefix: 'ensure-blocklet-routing-lock',
  ttl: 1000 * 60, // 60 seconds timeout
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

const hasRuleByPrefix = (site, value) => site.rules.find((x) => x.isProtected && get(x, 'from.pathPrefix') === value);

const pingWellknownRule = {
  isProtected: true,
  from: { pathPrefix: WELLKNOWN_PING_PREFIX },
  to: {
    type: ROUTING_RULE_TYPES.DIRECT_RESPONSE,
    response: {
      status: 200,
      contentType: 'application/javascript',
      body: "'pong'",
    },
  },
};

const analyticsWellknownRule = {
  isProtected: true,
  from: { pathPrefix: WELLKNOWN_ANALYTICS_PREFIX },
  to: {
    type: ROUTING_RULE_TYPES.DIRECT_RESPONSE,
    response: {
      status: 200,
      contentType: 'application/javascript',
      body: "''",
    },
  },
};

const formatDomains = (sites) => {
  const domains = sites
    .map((x) => x.domain)
    .filter((x) => ![DOMAIN_FOR_IP_SITE_REGEXP, DOMAIN_FOR_DEFAULT_SITE].includes(x));

  let domainsAliases = [];
  sites.forEach((x) => domainsAliases.push(...(x.domainAliases || [])));

  // backward compatible
  domainsAliases = domainsAliases.map((item) => {
    if (typeof item === 'string') {
      return { value: item, isProtected: false };
    }

    return item;
  });

  return { domains, domainsAliases };
};

/**
 * replace 888-888-888-888 with accessible ip for domain
 */
const attachRuntimeDomainAliases = async ({ sites = [], context = {} }) => {
  if (!sites) {
    return [];
  }

  let ip;
  const ipRegex = /\d+[-.]\d+[-.]\d+[-.]\d+/;
  const match = ipRegex.exec(context.hostname || '');
  if (match) {
    ip = match[0];
  } else {
    const nodeIp = await getAccessibleExternalNodeIp();
    if (nodeIp) {
      ip = nodeIp;
    }
  }

  if (!ip) {
    const result = await getIp({ includeExternal: false });
    if (result) {
      ip = result.internal;
    }
  }

  logger.info('attachRuntimeDomainAliases', { ip });

  const getDomainAliases = (site) =>
    (site.domainAliases || []).map((domain) => {
      if (!domain.value) {
        return domain;
      }
      if (ip) {
        if (domain.value.includes(SLOT_FOR_IP_DNS_SITE)) {
          domain.value = replaceSlotToIp(domain.value, ip);
        } else if (domain.value === DEFAULT_IP_DOMAIN) {
          domain.value = `${ip.split('.').join('-')}${domain.value.substring(1)}`;
        }
      }
      return domain;
    });

  if (!Array.isArray(sites)) {
    sites.domainAliases = getDomainAliases(sites);
    return sites;
  }

  return sites.map((site) => {
    site.domainAliases = getDomainAliases(site);

    return site;
  });
};

const isBasicSite = (domain) =>
  [DOMAIN_FOR_INTERNAL_SITE, DOMAIN_FOR_IP_SITE, DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(domain);

const ensureRootRule = (sites) => {
  return sites.map((site) => {
    if (!isBasicSite(site.domain) && !site.rules.some((x) => x.from.pathPrefix === '/')) {
      site.rules.push({
        from: { pathPrefix: '/' },
        to: {
          type: ROUTING_RULE_TYPES.NONE,
        },
      });
    }
    return site;
  });
};

const ensureLatestNodeInfo = (sites = [], info) => {
  return sites.map((site) => {
    site.rules = site.rules.map((rule) => {
      if (rule.to.did === info.did && rule.to.type === ROUTING_RULE_TYPES.DAEMON) {
        rule.to.port = info.port;
        if (site.domain === DOMAIN_FOR_IP_SITE && rule.isProtected) {
          rule.from.pathPrefix = info.routing.adminPath;
        }
      }

      return rule;
    });

    if (site.domain === DOMAIN_FOR_IP_SITE) {
      // We use an regular expression to match ip domain so that it is adaptive
      // @ref https://stackoverflow.com/questions/9454764/nginx-server-name-wildcard-or-catch-all
      site.domain = DOMAIN_FOR_IP_SITE_REGEXP;
    }

    return site;
  });
};

/**
 * set rule.to.target by interface.path and interface.prefix
 */
const ensureLatestInterfaceInfo = async (sites = [], blocklets = []) => {
  const interfaces = await states.blocklet.groupAllInterfaces(blocklets);
  return sites.map((site) => {
    if (!Array.isArray(site.rules)) {
      return site;
    }

    site.rules = site.rules.map((rule) => {
      if (rule.dynamic) {
        return rule;
      }
      // If a rule already has a target and target is WELLKNOWN_SERVICE_PATH_PREFIX, just return
      // Indicates that the rule id generated by the system for auth service
      if (rule.isProtected && rule.to.target === WELLKNOWN_SERVICE_PATH_PREFIX) {
        return rule;
      }
      if (rule.isProtected && rule.to.target === joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, USER_AVATAR_PATH_PREFIX)) {
        return rule;
      }

      const { componentId, interfaceName } = rule.to;
      if (interfaces[componentId] && interfaces[componentId][interfaceName]) {
        // eslint-disable-next-line no-shadow
        const { path, prefix } = interfaces[componentId][interfaceName];
        if (prefix === BLOCKLET_DYNAMIC_PATH_PREFIX) {
          rule.to.target = path;
        } else {
          rule.to.target = normalizePathPrefix(`${prefix}/${path}`);
        }
      }

      return rule;
    });

    return site;
  });
};

const ensureWellknownRule = async (sites = []) => {
  const wellknownPort = await getWellknownSitePort();

  for (const site of sites) {
    // 不向 default site & ip site & wellknown site 添加 wellknown rule
    if (![DOMAIN_FOR_INTERNAL_SITE, DOMAIN_FOR_IP_SITE, DOMAIN_FOR_DEFAULT_SITE].includes(site.domain)) {
      const isExists = site.rules.find((x) => x.from.pathPrefix === WELLKNOWN_PATH_PREFIX);
      if (!isExists) {
        site.rules.push({
          from: { pathPrefix: WELLKNOWN_PATH_PREFIX },
          to: {
            port: wellknownPort,
            type: ROUTING_RULE_TYPES.GENERAL_PROXY,
            interfaceName: BLOCKLET_INTERFACE_WELLKNOWN,
            did: site.blockletDid,
          },
          isProtected: true,
        });
      }
    }

    // add /.well-known/service for blocklet
    const blockletRules = site.rules
      .filter((x) => x.to.type === ROUTING_RULE_TYPES.BLOCKLET)
      // 可能存在挂载的 blocklet 不是自己, 是其他 blocklet
      // 这里默认 pathPrefix 最短的是自己 ( 通常自己在 /, 其他 blocklet 在 /xxxx )
      // 挂载其他 blocklet 的使用方式不推荐, 将来可能会被废弃
      .sort((a, b) => (a.from.pathPrefix.length > b.from.pathPrefix.length ? 1 : -1));

    // Group component rules and ensure that there is always a group even if there are no components
    const grouped = groupBy(blockletRules, (x) => x.from.groupPathPrefix);
    if (isBlockletSite(site.domain)) {
      if (Object.keys(grouped).length === 0) {
        grouped['/'] = [
          {
            id: '',
            to: {
              did: site.blockletDid,
              componentId: site.blockletDid,
            },
          },
        ];
      }
    }

    Object.keys(grouped).forEach((groupPathPrefix) => {
      const rule = grouped[groupPathPrefix][0];

      // Serve blocklet service always
      const servicePathPrefix = joinURL(groupPathPrefix, WELLKNOWN_SERVICE_PATH_PREFIX);
      if (!site.rules.some((x) => x.from.pathPrefix === servicePathPrefix)) {
        site.rules.push({
          id: rule.id,
          from: {
            pathPrefix: servicePathPrefix,
            groupPathPrefix,
          },
          to: {
            type: 'blocklet',
            did: rule.to.did,
            componentId: rule.to.componentId,
            target: servicePathPrefix,
          },
          isProtected: true,
          dynamic: true,
        });
      }

      // Cache user avatar from gateway
      const avatarPathPrefix = joinURL(servicePathPrefix, USER_AVATAR_PATH_PREFIX);
      if (!site.rules.some((x) => x.from.pathPrefix === avatarPathPrefix)) {
        site.rules.push({
          id: rule.id,
          from: {
            pathPrefix: avatarPathPrefix,
            groupPathPrefix,
          },
          to: {
            type: 'blocklet',
            did: rule.to.did,
            componentId: rule.to.componentId,
            cacheGroup: isServiceFeDevelopment ? '' : 'blockletProxy',
            target: avatarPathPrefix,
            port: process.env.ABT_NODE_SERVICE_PORT,
          },
          isProtected: true,
          dynamic: true,
        });
      }
    });
  }

  return sites;
};

const ensureBlockletDid = (sites = [], info) => {
  return sites.map((site) => {
    if (site.domain === DOMAIN_FOR_INTERNAL_SITE) {
      return site;
    }

    if ([DOMAIN_FOR_IP_SITE, DOMAIN_FOR_DEFAULT_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(site.domain)) {
      site.blockletDid = info.did;
      return site;
    }

    site.blockletDid = getDidFromDomainGroupName(site.domain);

    return site;
  });
};

const filterSitesForRemovedBlocklets = (sites = [], blocklets) => {
  return sites.filter((site) => {
    if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
      return true;
    }

    const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);
    return !!blocklet;
  });
};

/**
 * Add system routing rules for blocklet in wellknown site
 *
 * @returns {boolean} if routing changed
 */
const ensureBlockletWellknownRules = (sites, blocklets) => {
  /**
   * 1. component blocklet 不允许有相同多的 wellknown
   * 1. wellknown 可以访问的路由:
   *    /.well-known/xxx
   *    /{wellknown owner blocklet}/.well-known/xxx
   */
  const isWellknownInterface = (x) => x.type === BLOCKLET_INTERFACE_TYPE_WELLKNOWN;

  const handler = ({ rules, site, blocklet, tmpInterface, mountPoint }) => {
    let pathPrefix = normalizePathPrefix(tmpInterface.prefix);
    if (!pathPrefix.startsWith(WELLKNOWN_PATH_PREFIX)) {
      throw new Error(`Wellknown path prefix must start with: ${WELLKNOWN_PATH_PREFIX}`);
    }

    const tmpMountPoint = mountPoint || blocklet.mountPoint;
    if (tmpMountPoint) {
      pathPrefix = joinURL(tmpMountPoint, pathPrefix);
    }

    const port = findInterfacePortByName(blocklet, tmpInterface.name);
    const existedRule = hasRuleByPrefix(site, pathPrefix);
    if (existedRule) {
      return;
    }

    rules.push({
      from: { pathPrefix },
      to: {
        did: blocklet.meta.did,
        port,
        targetPrefix: tmpMountPoint,
        type: ROUTING_RULE_TYPES.GENERAL_PROXY,
        interfaceName: tmpInterface.name,
      },
      isProtected: true,
    });
  };

  return sites
    .map((site) => {
      if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
        return site;
      }

      const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);

      const rules = [];

      forEachBlockletSync(blocklet, (b) => {
        (b.meta.interfaces || []).forEach((item) => {
          if (isWellknownInterface(item)) {
            handler({ rules, blocklet: b, tmpInterface: item, site });

            // 在站点的根路由下挂载一个
            if (b.mountPoint && b.mountPoint !== '/') {
              handler({ rules, blocklet: b, tmpInterface: item, site, mountPoint: '/' });
            }
          }
        });
      });

      site.rules = site.rules.concat(rules);
      return site;
    })
    .filter(Boolean);
};

const isNotComponentRule = (x) =>
  [
    ROUTING_RULE_TYPES.GENERAL_PROXY,
    ROUTING_RULE_TYPES.DIRECT_RESPONSE,
    ROUTING_RULE_TYPES.GENERAL_REWRITE,
    ROUTING_RULE_TYPES.REDIRECT,
    ROUTING_RULE_TYPES.NONE,
  ].includes(x.to.type);
const expandComponentRules = (sites = [], blocklets) => {
  return sites
    .map((site) => {
      if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
        return site;
      }

      if (site.componentExpanded) {
        return site;
      }

      const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);
      const expandedRules = blocklet.children
        .filter((x) => hasMountPoint(x.meta))
        .map((x) => ({
          id: UUID.v4(),
          from: {
            pathPrefix: x.mountPoint,
            groupPathPrefix: '/',
          },
          to: {
            type: ROUTING_RULE_TYPES.BLOCKLET,
            componentId: getComponentId(x, [blocklet]),
            interfaceName: BLOCKLET_INTERFACE_PUBLIC,
            port: findInterfacePortByName(x, BLOCKLET_INTERFACE_PUBLIC),
            did: blocklet.meta.did,
            target: '/',
            pageGroup: '',
          },
        }));

      // console.info('expandComponentRules.before.rules', JSON.stringify(site.rules, null, 2));
      site.rules = site.rules
        .filter((x) => x.isProtected || x.to.pageGroup || isNotComponentRule(x))
        .concat(expandedRules);
      site.rules.forEach((x) => {
        if (x.to.type === ROUTING_RULE_TYPES.COMPONENT) {
          x.to.type = ROUTING_RULE_TYPES.BLOCKLET;
          x.to.componentId = [blocklet.meta.did, x.to.componentId].join('/');
        }
      });
      // console.info('expandComponentRules.after.rules', JSON.stringify(site.rules, null, 2));

      site.componentExpanded = true;
      return site;
    })
    .filter(Boolean);
};

const ensureBlockletCache = (sites = [], blocklets = []) => {
  return sites
    .map((site) => {
      if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
        return site;
      }

      if (site.cacheableGenerated) {
        return site;
      }

      // For each rule, get component, check cacheable, clone and push new rule
      const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);
      const cacheRules = [];
      site.rules
        .filter(
          (x) =>
            x.to.type === ROUTING_RULE_TYPES.BLOCKLET &&
            x.to.interfaceName === BLOCKLET_INTERFACE_PUBLIC &&
            x.from.pathPrefix.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX) === false
        )
        .forEach((rule) => {
          const component = findComponentById(blocklet, rule.to.componentId);
          if (!component) {
            return;
          }

          if (component.mode !== BLOCKLET_MODES.PRODUCTION) {
            return;
          }
          const cacheable = get(findWebInterface(component), 'cacheable', []);
          cacheable.forEach((cachePrefix) => {
            const clone = cloneDeep(rule);
            clone.from.pathPrefix = joinURL(rule.from.pathPrefix, cachePrefix);
            clone.to.cacheGroup = isServiceFeDevelopment ? '' : 'blockletProxy';
            clone.to.targetPrefix = cachePrefix;
            clone.dynamic = true; // mark as dynamic to avoid redundant generated rules
            cacheRules.push(clone);
          });
        });

      site.rules = site.rules.concat(cacheRules);
      site.mode = blocklet.mode;
      site.cacheableGenerated = true;

      return site;
    })
    .filter(Boolean);
};

const ensureBlockletProxyBehavior = (sites, blocklets = []) => {
  return sites
    .map((site) => {
      if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
        return site;
      }
      if (site.cacheableGenerated) {
        return site;
      }
      const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);
      if (!blocklet) {
        return site;
      }

      site.rules
        .filter((x) => x.to.type === ROUTING_RULE_TYPES.BLOCKLET && x.to.interfaceName === BLOCKLET_INTERFACE_PUBLIC)
        .forEach((rule) => {
          const component = findComponentById(blocklet, rule.to.componentId);
          const webInterface = (component?.meta?.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
          if (!webInterface) {
            return rule;
          }
          rule.proxyBehavior = webInterface.proxyBehavior;
          return rule;
        });

      return site;
    })
    .filter(Boolean);
};

/**
 * Get static root path for a component
 * @param {object} component - Blocklet component
 * @returns {string|null} - Absolute path to static files root, or null if not available
 */
const getStaticRoot = (component) => {
  const appDir = component.environments.find((e) => e.key === 'BLOCKLET_APP_DIR')?.value;
  if (!appDir) {
    return null;
  }

  const main = component.meta?.main;
  const root = main ? path.join(appDir, main) : appDir;
  if (root?.endsWith('index.html') || root?.endsWith('index.htm')) {
    return path.dirname(root);
  }
  return root;
};

/**
 * Check if a component can be served directly by Nginx
 * Conditions:
 * 1. Engine-based blocklet using 'blocklet' interpreter (static-server engine)
 * 2. Engine source is the built-in static-server (not a custom engine)
 * 3. Has a default security rule (pathPattern: '*') with ACCESS_POLICY_PUBLIC
 *
 * @param {object} component - Blocklet component
 * @param {Array} securityRules - Security rules for the blocklet
 * @returns {boolean} - True if can serve static directly
 */
const canServeStaticDirectly = (component, securityRules) => {
  if (hasStartEngine(component.meta)) {
    return false;
  }

  if (!securityRules || securityRules.length === 0) {
    return false;
  }

  const componentRules = securityRules.filter((x) => x.componentDid === component.meta.did);
  if (componentRules.length) {
    return componentRules.every((x) => x.accessPolicy.id === ACCESS_POLICY_PUBLIC);
  }

  const fallbackRules = securityRules.filter((x) => !x.componentDid);
  if (fallbackRules.length) {
    return fallbackRules.every((x) => x.accessPolicy.id === ACCESS_POLICY_PUBLIC);
  }

  return false;
};

/**
 * Ensure static serving info is added to routing rules for eligible blocklets
 * This function adds serveStatic and staticRoot fields to rules that:
 * 1. Are engine-based static blocklets
 * 2. Have public access policy for all paths
 *
 * @param {Array} sites - Routing sites
 * @param {Array} blocklets - All blocklets
 * @param {object} teamManager - Team manager for querying security rules
 * @returns {Promise<Array>} - Sites with static serving info added
 */
const ensureBlockletStaticServing = async (sites = [], blocklets = [], teamManager = null) => {
  if (!teamManager) {
    return sites;
  }

  const result = await Promise.all(
    sites.map(async (site) => {
      if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
        return site;
      }

      const blocklet = blocklets.find((x) => x.meta.did === site.blockletDid);
      if (!blocklet) {
        return site;
      }

      // Get security rules for this blocklet
      const { securityRules } = await getBlockletSecurityRules(
        { teamManager },
        { did: blocklet.meta.did, formatted: true }
      );

      // Process each rule
      site.rules
        .filter((x) => x.to.type === ROUTING_RULE_TYPES.BLOCKLET && x.to.interfaceName === BLOCKLET_INTERFACE_PUBLIC)
        .forEach((rule) => {
          const component = findComponentById(blocklet, rule.to.componentId);
          if (!component) {
            return;
          }

          // Check if this component can be served directly
          if (canServeStaticDirectly(component, securityRules)) {
            const staticRoot = getStaticRoot(component);
            logger.info('ensureBlockletStaticServing.canServeStaticDirectly', {
              blockletDid: blocklet.meta.did,
              componentDid: component.meta.did,
              staticRoot,
            });
            if (staticRoot) {
              rule.to.staticRoot = staticRoot;
            }
          }
        });

      return site;
    })
  );

  return result.filter(Boolean);
};

/**
 * Generate sub-service sites for blocklets with subService configuration
 * @param {Array} sites - Existing routing sites
 * @param {Array} blocklets - All blocklets
 * @returns {Promise<Array>} Sites with sub-service sites added
 */
const ensureSubServiceSites = async (sites = [], blocklets = []) => {
  const settingsPromises = blocklets.map((blocklet) => {
    return states.blockletExtras.getSettings(blocklet.meta.did).then((settings) => ({
      did: blocklet.meta.did,
      dataDir: blocklet.environments?.find((e) => e.key === 'BLOCKLET_DATA_DIR')?.value ?? '',
      config: settings?.subService,
    }));
  });

  const settingsResults = await Promise.all(settingsPromises);

  // Generate sub-service sites
  const subServiceSites = settingsResults
    .filter(({ config }) => {
      const domain = config?.domain;
      // Validate configuration is complete and enabled
      return config?.enabled && domain && config.staticRoot;
    })
    .map(({ did, dataDir, config }) => {
      const domain = config.domain;

      // Security: Normalize and validate path to prevent directory traversal
      const normalizedDataDir = path.resolve(dataDir);
      const absoluteStaticRoot = path.resolve(dataDir, config.staticRoot);

      // Ensure the resolved path is still within dataDir
      if (!absoluteStaticRoot.startsWith(normalizedDataDir + path.sep)) {
        logger.error('ensureSubServiceSites.pathTraversalAttempt', {
          did,
          dataDir: normalizedDataDir,
          staticRoot: config.staticRoot,
          resolved: absoluteStaticRoot,
        });
        throw new Error(`Invalid staticRoot path: ${config.staticRoot} - path traversal detected`);
      }

      logger.info('ensureSubServiceSites.created', {
        did,
        domain,
        staticRoot: config.staticRoot,
        absoluteStaticRoot,
      });

      return {
        domain,
        type: ROUTING_RULE_TYPES.SUB_SERVICE,
        blockletDid: did,
        serviceType: 'blocklet',
        rules: [
          {
            from: { pathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.SUB_SERVICE,
              staticRoot: absoluteStaticRoot,
            },
          },
        ],
      };
    });

  return [...sites, ...subServiceSites];
};

const ensureLatestInfo = async (sites = [], blocklets = [], teamManager = null, { nodeInfo = null } = {}) => {
  const info = nodeInfo ?? (await states.node.read());
  // CAUTION: following steps are very important, please do not change the order
  let result = ensureLatestNodeInfo(sites, info);
  result = ensureBlockletDid(result, info);
  result = filterSitesForRemovedBlocklets(result, blocklets);
  result = ensureBlockletProxyBehavior(result, blocklets);
  result = ensureBlockletCache(result, blocklets);
  result = await ensureWellknownRule(result);
  result = await ensureLatestInterfaceInfo(result, blocklets);
  result = ensureBlockletWellknownRules(result, blocklets);
  result = expandComponentRules(result, blocklets);
  result = await ensureBlockletStaticServing(result, blocklets, teamManager);
  result = await ensureSubServiceSites(result, blocklets);

  return result;
};

const decompressCertificates = async (source, dest) => {
  fs.ensureDirSync(dest);
  await tar.x({ file: source, C: dest });
  return dest;
};

const joinCertDownUrl = (baseUrl, name) => joinURL(baseUrl, '/certs', name);

const getDummyCertDownloadUrl = (baseUrl) => joinCertDownUrl(baseUrl, 'dummy.tar.gz');
const getIpEchoCertDownloadUrl = (baseUrl) => joinCertDownUrl(baseUrl, 'ip-abtnet-io.tar.gz');
const getDidDomainCertDownloadUrl = (baseUrl) => joinCertDownUrl(baseUrl, 'did-abtnet-io.tar.gz');
const getDownloadCertBaseUrl = (info) =>
  process.env.ABT_NODE_WILDCARD_CERT_HOST || get(info, 'routing.wildcardCertHost', '');

/**
 * 根据 DID 获取域名
 */
const getDomainsByDid = async (did, teamManager) => {
  if (!did) {
    return [];
  }

  try {
    const sites = await states.site.getSitesByBlocklet(did);
    const blocklet = await states.blocklet.getBlocklet(did);
    const blocklets = blocklet ? [blocklet] : [];
    const domainAliases = await attachRuntimeDomainAliases({
      sites: await ensureLatestInfo(sites, blocklets, teamManager),
      context: {},
    });

    const result = formatDomains(domainAliases);

    return (result?.domainsAliases || []).map((x) => x.value);
  } catch (error) {
    logger.error('getDomainsByDid failed', { error });
    return [];
  }
};

module.exports = function getRouterHelpers({
  dataDirs,
  routerManager,
  blockletManager,
  certManager,
  daemon = false,
  teamManager,
}) {
  const nodeState = states.node;
  const blockletState = states.blocklet;
  const siteState = states.site;
  const trafficInsight = states.trafficInsight;

  const downloadCert = async ({ domain, url }) => {
    const destFolder = getTmpDir(path.join(`certificate-${md5(domain)}-${Date.now()}`));
    logger.info('download certificate start', { domain, url, destFolder });

    try {
      const filename = path.join(destFolder, 'certificate.tar.gz');
      fs.ensureDirSync(destFolder);

      await downloadFile(url, filename);
      await decompressCertificates(filename, destFolder);

      const certificateFilePath = path.join(destFolder, 'cert.pem');
      const privateKeyFilePath = path.join(destFolder, 'privkey.pem');

      if (!fs.existsSync(certificateFilePath)) {
        throw new Error('dashboard certificate invalid: cert.pem does not exist');
      }

      if (!fs.existsSync(privateKeyFilePath)) {
        throw new Error('dashboard certificate invalid: privkey.pem does not exist');
      }

      const certificate = fs.readFileSync(certificateFilePath).toString();
      const privateKey = fs.readFileSync(privateKeyFilePath).toString();

      await certManager.upsertByDomain({
        domain,
        privateKey,
        certificate,
        isProtected: true,
      });

      logger.info('dashboard certificate updated', { domain });
    } catch (error) {
      logger.error('update dashboard certificate failed', { error });
      throw error;
    } finally {
      fs.removeSync(destFolder);
      logger.info('remove certificate dest folder', { domain, url, destFolder });
    }
  };

  const updateCert = async (domain, url) => {
    try {
      const cert = await certManager.getByDomain(domain);
      if (!cert) {
        return;
      }

      const now = Date.now();
      const certInfo = getHttpsCertInfo(cert.certificate);

      if (certInfo.validTo - now >= CERTIFICATE_EXPIRES_OFFSET) {
        logger.info('skip dashboard certificate update before not expired', { domain, url });
        return;
      }

      await downloadCert({
        domain,
        url,
      });
    } catch (err) {
      logger.error('failed to check dashboard certificate expiration', { error: err, domain, url });
    }
  };

  const updateDashboardCertificates = async () => {
    const info = await nodeState.read();
    const https = get(info, 'routing.https', true);
    const ipWildcardDomain = get(info, 'routing.ipWildcardDomain', '');
    const didDomain = info.didDomain;
    const certDownloadAddress = getDownloadCertBaseUrl(info);

    if (!https || !certDownloadAddress) {
      return;
    }

    await updateCert(ipWildcardDomain, getIpEchoCertDownloadUrl(certDownloadAddress));
    await updateCert(`*.${didDomain}`, getDidDomainCertDownloadUrl(certDownloadAddress));
  };

  const ensureWildcardCerts = async () => {
    const info = await nodeState.read();
    const didDomain = info.didDomain;
    const ipWildcardDomain = get(info, 'routing.ipWildcardDomain', '');

    const ensureDomainCert = async (domain, url) => {
      const cert = await certManager.getByDomain(domain);
      if (!cert || get(cert, 'meta.validTo') <= Date.now()) {
        await downloadCert({
          domain,
          url,
        });
      }
    };

    const certBaseUrl = getDownloadCertBaseUrl(info);

    if (!info.routing.enableDefaultServer && certBaseUrl) {
      // update dummy certificate if not enable default server
      // if update failed, it will not affect the normal certificate update
      let dummyCertUrl;
      try {
        dummyCertUrl = getDummyCertDownloadUrl(certBaseUrl);
        await ensureDomainCert('abtnode_dummy', dummyCertUrl);

        logger.info('update dummy certificate success');
      } catch (error) {
        logger.error('update dummy certificate failed', { error, dummyCertUrl });
      }
    }

    await Promise.all([
      ensureDomainCert(ipWildcardDomain, getIpEchoCertDownloadUrl(certBaseUrl)),
      ensureDomainCert(`*.${didDomain}`, getDidDomainCertDownloadUrl(certBaseUrl)),
    ]);
  };

  const ensureServerlessCerts = async () => {
    const info = await nodeState.read();

    if (info.mode !== NODE_MODES.SERVERLESS) {
      logger.warn('ensureServerlessCerts: not in serverless mode', { mode: info.mode });
      return;
    }

    const launcherUrl = process.env.ABT_NODE_BLOCKLET_LAUNCHER_URL || info.registerUrl;
    const provisionToken = process.env.ABT_NODE_PROVISION_TOKEN;

    if (!launcherUrl) {
      logger.warn('ensureServerlessCerts: missing launcher URL');
      return;
    }

    let authHeaders = {};
    let authType = 'none';

    const payload = {
      did: info.did,
      version: info.version,
    };

    if (provisionToken) {
      authHeaders = { Authorization: `Bearer ${provisionToken}` };
      authType = 'bearer';
    } else if (info.sk) {
      try {
        authHeaders = await buildRequestHeaders(info.sk, payload);
        authType = 'signature';
      } catch (error) {
        logger.error('ensureServerlessCerts: failed to create signature', { error });
        return;
      }
    } else {
      logger.warn('ensureServerlessCerts: no authentication method available');
      return;
    }

    const fn = async () => {
      const provisionUrl = await buildLauncherUrl(launcherUrl, '/api/serverless/provision');
      const destFolder = getTmpDir(path.join(`serverless-cert-${Date.now()}`));

      logger.info('download serverless certificate start', { provisionUrl, destFolder, authType });

      try {
        const filename = path.join(destFolder, 'certificate.tar.gz');
        fs.ensureDirSync(destFolder);

        const { data } = await axios({
          method: 'post',
          url: provisionUrl,
          headers: authHeaders,
          responseType: 'stream',
          data: payload,
        });

        const fileStream = data.pipe(fs.createWriteStream(filename));
        await new Promise((resolve, reject) => {
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });

        await decompressCertificates(filename, destFolder);

        const certificateFilePath = path.join(destFolder, 'cert.pem');
        const privateKeyFilePath = path.join(destFolder, 'privkey.pem');

        if (!fs.existsSync(certificateFilePath)) {
          throw new Error('serverless certificate invalid: cert.pem does not exist');
        }

        if (!fs.existsSync(privateKeyFilePath)) {
          throw new Error('serverless certificate invalid: privkey.pem does not exist');
        }

        const certificate = fs.readFileSync(certificateFilePath).toString();
        const privateKey = fs.readFileSync(privateKeyFilePath).toString();

        const certInfo = getHttpsCertInfo(certificate);
        const domain = certInfo.sans?.[0] || certInfo.domain;

        if (!domain) {
          throw new Error('serverless certificate invalid: no domain found');
        }

        await certManager.upsertByDomain({
          domain,
          privateKey,
          certificate,
          isProtected: false,
        });

        logger.info('serverless certificate updated', { domain, authType });
        return domain;
      } catch (error) {
        logger.error('serverless certificate download failed', { error, authType });
        throw error;
      } finally {
        fs.removeSync(destFolder);
        logger.info('remove serverless certificate dest folder', { destFolder });
      }
    };

    const delay = 10 * 1000;
    try {
      await pRetry(fn, {
        retries: 3,
        minTimeout: delay,
        maxTimeout: delay,
        onFailedAttempt: (error) => {
          logger.error('serverless certificate download retry', {
            error,
            attempt: error.attemptNumber,
            retriesLeft: error.retriesLeft,
          });
          if (error.response && error.response.status >= 400 && error.response.status < 500) {
            throw error;
          }
        },
      });
    } catch (error) {
      logger.error('serverless certificate update failed', { error, authType });
    }
  };

  const upsertSiteRule = async ({ site, rule }, context) => {
    const findExistingRule = (prefix) => site.rules.find((r) => r.from.pathPrefix === normalizePathPrefix(prefix));

    const newSiteRule = {
      id: site.id,
      rule,
      skipValidation: true, // Skip nginx validation for system rules - validated at end
    };

    const existingRule = findExistingRule(get(rule, 'from.pathPrefix'));
    if (!existingRule) {
      await routerManager.addRoutingRule(newSiteRule, context);
      return true;
    }

    if (!isEqual(existingRule.to, rule.to)) {
      newSiteRule.rule.id = existingRule.id;
      newSiteRule.skipProtectedRuleChecking = true;
      await routerManager.updateRoutingRule(newSiteRule, context);
      return true;
    }

    return false;
  };

  /**
   * Add wellknown site with routing rules
   * @param {object|null} site - Pre-fetched wellknown site or null if not exists
   * @param {object} context
   * @returns {Promise<boolean>} - true if routing changed
   */
  const addWellknownSite = async (site, context) => {
    try {
      const info = await nodeState.read();
      const proxyTarget = {
        port: info.port,
        type: ROUTING_RULE_TYPES.GENERAL_PROXY,
        interfaceName: BLOCKLET_INTERFACE_WELLKNOWN,
      };

      const didResolverWellknownRule = {
        isProtected: true,
        from: { pathPrefix: WELLKNOWN_DID_RESOLVER_PREFIX },
        to: proxyTarget,
      };

      const blacklistWellknownRule = {
        isProtected: true,
        from: { pathPrefix: WELLKNOWN_BLACKLIST_PREFIX },
        to: proxyTarget,
      };

      const acmeChallengeWellknownRule = {
        isProtected: true,
        from: { pathPrefix: WELLKNOWN_ACME_CHALLENGE_PREFIX },
        to: proxyTarget,
      };

      const oauthServerWellknownRule = {
        isProtected: true,
        from: { pathPrefix: WELLKNOWN_OAUTH_SERVER },
        to: proxyTarget,
      };

      const openidWellknownRule = {
        isProtected: true,
        from: { pathPrefix: WELLKNOWN_OPENID_SERVER },
        to: proxyTarget,
      };

      if (site) {
        const didResolverRuleUpdateRes = await upsertSiteRule({ site, rule: didResolverWellknownRule }, context);
        const acmeRuleUpdateRes = await upsertSiteRule({ site, rule: acmeChallengeWellknownRule }, context);
        const blacklistUpdateRes = await upsertSiteRule({ site, rule: blacklistWellknownRule }, context);
        const pingRuleRes = await upsertSiteRule({ site, rule: pingWellknownRule }, context);
        const analyticsRuleRes = await upsertSiteRule({ site, rule: analyticsWellknownRule }, context);
        const oauthServerRuleRes = await upsertSiteRule({ site, rule: oauthServerWellknownRule }, context);
        const openidRuleRes = await upsertSiteRule({ site, rule: openidWellknownRule }, context);
        return (
          didResolverRuleUpdateRes ||
          acmeRuleUpdateRes ||
          blacklistUpdateRes ||
          pingRuleRes ||
          analyticsRuleRes ||
          oauthServerRuleRes ||
          openidRuleRes
        );
      }

      await routerManager.addRoutingSite(
        {
          site: {
            domain: DOMAIN_FOR_INTERNAL_SITE,
            port: await getWellknownSitePort(),
            name: NAME_FOR_WELLKNOWN_SITE,
            rules: [
              didResolverWellknownRule,
              acmeChallengeWellknownRule,
              blacklistWellknownRule,
              pingWellknownRule,
              analyticsWellknownRule,
              oauthServerWellknownRule,
              openidWellknownRule,
            ],
            isProtected: true,
          },
          skipCheckDynamicBlacklist: true,
          skipValidation: true,
        },
        context
      );

      return true;
    } catch (err) {
      console.error('add well-known site failed:', err);
      return false;
    }
  };

  /**
   * Add system routing sites for the dashboard
   * Which should contain: default site, ip site, wellknown site
   *
   * Optimized to use O(1) targeted queries instead of loading all sites.
   * With thousands of blocklets, this avoids loading all sites into memory.
   *
   * @returns {boolean} if routing changed
   */
  const ensureDashboardRouting = async (context = {}) => {
    // eslint-disable-next-line
    let [info, dashboardSite, defaultSite, wellknownSite] = await Promise.all([
      nodeState.read(),
      siteState.findOne({ domain: DOMAIN_FOR_IP_SITE }),
      siteState.findOne({ domain: DOMAIN_FOR_DEFAULT_SITE }),
      siteState.findOne({ name: NAME_FOR_WELLKNOWN_SITE }),
    ]);
    const updatedResult = [];
    if (!dashboardSite) {
      try {
        dashboardSite = await routerManager.addRoutingSite(
          {
            site: {
              domain: DOMAIN_FOR_IP_SITE,
              rules: [
                {
                  from: { pathPrefix: normalizePathPrefix(info.routing.adminPath) },
                  to: { port: info.port, did: info.did, type: ROUTING_RULE_TYPES.DAEMON },
                  isProtected: true,
                },
              ],
            },
            skipCheckDynamicBlacklist: true,
            skipValidation: true, // Skip nginx validation for system sites
          },
          context
        );

        updatedResult.push(dashboardSite);
      } catch (err) {
        console.error('ensureSystemSites failed:', err);
      }
    }

    const ipWildcardDomain = get(info, 'routing.ipWildcardDomain', '');

    const domainAliases = (dashboardSite.domainAliases || []).filter(
      (item) => !item.value.endsWith(ipWildcardDomain) && !item.value.endsWith(info.didDomain)
    );

    const didDomain = getServerDidDomain(info);
    const dashboardAliasDomains = [
      { value: ipWildcardDomain, isProtected: true },
      { value: didDomain, isProtected: true },
    ];
    domainAliases.push(...dashboardAliasDomains);

    try {
      const result = await siteState.update({ id: dashboardSite.id }, { $set: { domainAliases } });
      updatedResult.push(result);
    } catch (error) {
      logger.error('add dashboard domain rule failed', { error });
      console.error('Add dashboard domain rule failed:', error);
    }

    try {
      const result = await upsertSiteRule({ site: dashboardSite, rule: analyticsWellknownRule }, context);
      updatedResult.push(result);
    } catch (error) {
      logger.error('add dashboard analytics rule failed', { error });
    }

    if (!defaultSite) {
      try {
        const result = await routerManager.addRoutingSite(
          {
            site: {
              domain: DOMAIN_FOR_DEFAULT_SITE,
              rules: [],
            },
            skipCheckDynamicBlacklist: true,
            skipValidation: true, // Skip nginx validation for system sites
          },
          context
        );

        updatedResult.push(result);
      } catch (err) {
        console.error('add default site failed:', err);
      }
    }

    const wellknownRes = await addWellknownSite(wellknownSite, context);
    if (wellknownRes) {
      updatedResult.push(wellknownRes);
    }

    return updatedResult.length > 0;
  };

  async function updateSiteDomainAliases(site, blocklet, nodeInfo) {
    try {
      const domainAliases = cloneDeep(site.domainAliases || []);
      const didDomainList = getBlockletDidDomainList(blocklet, nodeInfo);
      didDomainList.forEach((item) => {
        if (!domainAliases.some((alias) => alias.value === item.value)) {
          domainAliases.push(item);
        }
      });

      // let didDomain in front of ipEchoDnsDomain
      domainAliases.sort((a, b) => b.value.length - a.value.length);
      if (isEqual(site.domainAliases, domainAliases)) {
        logger.info('site domain aliases is up to date', {
          siteId: site.id,
          existedDomainAliases: site.domainAliases,
          domainAliases,
          didDomainList,
        });
      } else {
        await states.site.updateDomainAliasList(site.id, domainAliases);
        logger.info('update site domain aliases', { site, domainAliases, didDomainList });
        return true;
      }
    } catch (error) {
      logger.error('update site domain aliases failed', { error, site });
    }

    return false;
  }

  const _ensureBlockletRouting = async (blocklet, nodeInfo, context = {}) => {
    const webInterface = (blocklet.meta.interfaces || []).find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
    if (!webInterface) {
      return false;
    }

    const getPrefix = (str) => {
      if (!str || str === '*') {
        return '/';
      }
      return `/${str}`.replace(/^\/+/, '/');
    };

    const domainGroup = getBlockletDomainGroupName(blocklet.meta.did);
    const rule = {
      from: { pathPrefix: getPrefix(webInterface.prefix) },
      to: {
        port: findInterfacePortByName(blocklet, webInterface.name),
        did: blocklet.meta.did,
        type: ROUTING_RULE_TYPES.BLOCKLET,
        interfaceName: webInterface.name, // root blocklet interface
      },
    };

    const existSite = await states.site.findOne({ domain: domainGroup });
    if (existSite) {
      await updateSiteDomainAliases(existSite, blocklet, nodeInfo);
      logger.info('site already exists', { did: blocklet.meta.did, site: existSite });
    } else {
      const domainAliases = getBlockletDidDomainList(blocklet, nodeInfo);
      // let didDomain in front of ipEchoDnsDomain
      domainAliases.push({ value: getIpDnsDomainForBlocklet(blocklet), isProtected: true });

      const rules = [rule];

      // inject rules in pack after app installed
      const config = await getPackConfig(blocklet);
      const rulesInPack = (config?.site?.rules || []).map((x) => {
        const y = { ...x };
        if (y.to.did) {
          y.to.did = blocklet.meta.did;
        }
        return y;
      });
      rules.push(...rulesInPack);

      const created = await routerManager.addRoutingSite(
        {
          site: {
            domain: domainGroup,
            domainAliases,
            isProtected: true,
            rules,
          },
          skipCheckDynamicBlacklist: true,
          skipValidation: true,
        },
        context
      );
      logger.info('create routing site for blocklet', {
        did: blocklet.meta.did,
        siteId: created.id,
        rules,
        domainAliases,
      });

      const bindDomainCap = await states.blockletExtras.getSettings(blocklet.meta.did, 'bindDomainCap');
      const nftDid = await states.blockletExtras.getSettings(blocklet.meta.did, 'domainNftDid');
      const domainAlias = bindDomainCap?.cap?.domain;

      if (bindDomainCap && nftDid && domainAlias) {
        logger.info('bind cap and nft did domain alias', {
          did: blocklet.meta.did,
          domainAlias,
          nftDid,
          chainHost: context.domainChainHost,
        });

        const site = await states.site.findOneByBlocklet(blocklet.meta.did);

        await routerManager
          .addDomainAlias(
            {
              id: site?.id,
              type: 'nft-domain',
              domainAlias,
              nftDid,
            },
            context
          )
          .then(() => {
            logger.info('bind domain alias', {
              did: blocklet.meta.did,
              domainAlias,
              nftDid,
              chainHost: context.domainChainHost,
            });

            const appURL = `https://${domainAlias}`;
            blockletManager
              .config({
                did: blocklet.meta.did,
                configs: [{ key: 'BLOCKLET_APP_URL', value: appURL }],
              })
              .then(() => {
                logger.info('update blocklet app url', {
                  did: blocklet.meta.did,
                  domainAlias,
                  appURL,
                });
              })
              .catch((error) => {
                logger.error('update blocklet app url failed', {
                  error,
                  did: blocklet.meta.did,
                  domainAlias,
                  appURL,
                });
              });
          })
          .catch((error) => {
            logger.error('bind domain alias failed', {
              error,
              did: blocklet.meta.did,
              domainAlias,
              nftDid,
            });
          });

        logger.info('bind cap and nft did domain alias done', {
          did: blocklet.meta.did,
          domainAlias,
          nftDid,
          chainHost: context.domainChainHost,
        });
      }
    }

    updateBlockletDocument({
      did: blocklet.meta.did,
      nodeInfo,
      teamManager,
      states,
    })
      .then(() => {
        logger.info('updated did document succeed on add blocklet', { did: blocklet.meta.did });

        // Trigger DNS lookup to warm up DNS cache (non-blocking)
        // This helps reduce DNS resolution time when user accesses the blocklet after install
        const domain = getDidDomainForBlocklet({
          did: blocklet.meta.did,
          didDomain: nodeInfo.didDomain || DEFAULT_DID_DOMAIN,
        });
        dns
          .resolve(domain)
          .then((result) => {
            logger.info('dns cache warm-up completed', { did: blocklet.meta.did, domain, result });
          })
          .catch((error) => {
            logger.warn('dns cache warm-up failed', { did: blocklet.meta.did, domain, error: error.message });
          });
      })
      .catch((err) => {
        logger.error('update did document failed on add blocklet', { did: blocklet.meta.did, error: err });
      });

    return true;
  };

  const removeBlockletCerts = async (certIds) => {
    const tasks = certIds.map((id) => certManager.remove({ id }));

    await Promise.all(tasks);
  };

  const _removeBlockletSites = async (blocklet, context = {}) => {
    let changed = false;

    const site = await states.site.findOne({ domain: `${blocklet.meta.did}${BLOCKLET_SITE_GROUP_SUFFIX}` });
    if (site) {
      await routerManager.deleteRoutingSite({ id: site.id }, context);
      changed = true;

      const certsToRemove = (site.domainAliases || [])
        .filter((domain) => domain.isProtected === false && domain.certificateId)
        .map((domain) => domain.certificateId);

      if (certsToRemove.length) {
        removeBlockletCerts(certsToRemove)
          .then(() => logger.info('removed certs for blocklet', { certsToRemove }))
          .catch((error) => logger.error('remove certs for blocklet failed', { error, certsToRemove }));
      }
    }

    return changed;
  };

  /**
   * Add system routing for blocklet
   *    add rules dashboard site that supports path prefix endpoint
   *    add ip-dns site that supports domain endpoint
   *    add rules in wellknown site
   * This function should be called after `ensureDashboardRouting`
   *
   * @returns {Promise<boolean>} if routing changed
   */
  const ensureBlockletRouting = async (blocklet, context = {}) => {
    const lockName = `ensure-blocklet-routing-${blocklet.meta.did}`;

    await ensureBlockletRoutingLock.acquire(lockName);

    try {
      const nodeInfo = await nodeState.read();
      return await _ensureBlockletRouting(blocklet, nodeInfo, context);
    } finally {
      await ensureBlockletRoutingLock.releaseLock(lockName);
    }
  };

  /**
   * remove custom rules of blocklet in old interface does not exist
   * update custom rules of blocklet
   *
   * @returns {Promise<boolean>} if routing changed
   */
  const ensureBlockletCustomRouting = async (blocklet) => {
    // Only one blocklet web interface can be declared since router 2.0
    const interfaces = (blocklet.meta.interfaces || []).filter((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
    const hasInterface = (name) => interfaces.some((x) => x.name === name);

    const sites = await siteState.getSitesByBlocklet(blocklet.meta.did);
    let changed = false;

    for (const site of sites) {
      const rulesToRemove = [];
      const rulesToUpdate = [];

      // get rule to remove and to update
      for (const rule of site.rules) {
        if (
          rule.isProtected ||
          rule.to.type !== ROUTING_RULE_TYPES.BLOCKLET ||
          !rule.to.interfaceName ||
          rule.to.did !== blocklet.meta.did
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (hasInterface(rule.to.interfaceName) === false) {
          rulesToRemove.push(rule.id);
        } else {
          rulesToUpdate.push(rule);
        }
      }

      // update rule
      for (const rule of rulesToUpdate) {
        // eslint-disable-next-line no-await-in-loop
        await routerManager.updateRoutingRule({ id: site.id, rule });
        changed = true;
      }

      // delete rule
      if (rulesToRemove.length > 0) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await states.site.update(
            { id: site.id },
            { $set: { rules: site.rules.filter((x) => rulesToRemove.includes(x.id) === false) } }
          );
          changed = true;
          logger.info('remove routing rule since interface does not exist', { rulesToRemove, did: blocklet.meta.did });
        } catch (err) {
          logger.error('failed to remove routing rule since interface does not exist', {
            rulesToRemove,
            did: blocklet.meta.did,
            error: err,
          });
        }
      }
    }

    return changed;
  };

  /**
   * Update routing for blocklet when blocklet is upgraded
   * This function should be called after `ensureDashboardRouting`
   *
   * @returns {Promise<boolean>} if routing changed
   */
  const ensureBlockletRoutingForUpgrade = async (blocklet, context = {}) => {
    await routerManager.deleteRoutingRulesItemByDid(
      { did: blocklet.meta.did, ruleFilter: (x) => x.isProtected },
      context
    );
    await ensureBlockletCustomRouting(blocklet, context);
    await ensureBlockletRouting(blocklet, context);

    // Always return true to trigger update of provider
    return true;
  };

  const clearBlockletRoutingCache = async (blocklet) => {
    const info = await nodeState.read();
    // eslint-disable-next-line no-use-before-define
    const provider = providers[info.routing.provider];
    if (provider) {
      await provider.clearCache(blocklet.appPid);
    }
  };

  /**
   * Remove routing for blocklet
   *
   * @returns {Promise<boolean>} if routing changed
   */
  const removeBlockletRouting = async (blocklet, context = {}) => {
    const ruleChanged = await routerManager.deleteRoutingRulesItemByDid({ did: blocklet.meta.did }, context);
    let siteChanged;
    if (!context.keepRouting) {
      siteChanged = await _removeBlockletSites(blocklet, context);
    }

    await clearBlockletRoutingCache(blocklet);
    return ruleChanged || siteChanged;
  };

  async function readAllRoutingSites() {
    const sites = await siteState.getSites();
    const blocklets = await states.blocklet.getBlocklets();
    return {
      sites: await ensureLatestInfo(sites, blocklets, teamManager),
    };
  }

  /**
   * Lightweight version of readAllRoutingSites for a single blocklet
   * Only queries the specific blocklet's data from database
   * @param {string} blockletDid - The blocklet DID
   * @returns {Promise<Array>}
   */
  async function readBlockletRoutingSite(blockletDid) {
    const [site, blocklet] = await Promise.all([
      siteState.findOneByBlocklet(blockletDid),
      states.blocklet.getBlocklet(blockletDid),
    ]);

    if (!site || !blocklet) {
      logger.warn('readBlockletRoutingSite: site or blocklet not found', {
        blockletDid,
        hasSite: !!site,
        hasBlocklet: !!blocklet,
      });
      return [];
    }

    return ensureLatestInfo([site], [blocklet], teamManager);
  }

  /**
   * Lightweight version of readAllRoutingSites for system sites only (no blocklet sites)
   * O(1) complexity - only queries system sites from database
   * System sites: dashboard, wellknown, IP site, default site
   * @returns {Promise<{sites: Array}>}
   */
  async function readSystemRoutingSites() {
    // getSystemSites() returns sites where domain NOT LIKE '%@blocklet-site-group'
    const systemSites = await siteState.getSystemSites();
    const sites = await ensureLatestInfo(systemSites, [], teamManager);
    return { sites };
  }

  async function resetSiteByDid(did, { refreshRouterProvider = true } = {}) {
    const blocklet = await states.blocklet.getBlocklet(did);
    await removeBlockletRouting(blocklet);
    await ensureBlockletRouting(blocklet);
    if (refreshRouterProvider) {
      // eslint-disable-next-line no-use-before-define
      await handleBlockletRouting({ did, message: 'reset blocklet routing rules' });
    }
  }

  const startAccessLogWatcher = (info) => {
    const providerName = get(info, 'routing.provider', null);
    if (!providerName || !providers[providerName] || isWorkerInstance()) {
      return;
    }

    if (daemon && process.env.ABT_NODE_MONITOR_GATEWAY_5XX === '1') {
      monitor.stopLogWatcher();
      const logs = providers[providerName].getLogFilesForToday();
      monitor.startLogWatcher(logs.access, (logEntries) => {
        teamManager.createNotification({
          title: 'Server 5xx Alert',
          description: `5xx request detected: ${
            Array.isArray(logEntries) && logEntries.length > 0
              ? JSON.stringify(logEntries.slice(0, 1), null, 2)
              : 'Unknown error'
          }`,
          entityType: 'server',
          severity: 'error',
          source: 'system',
          sticky: false,
        });
      });
    }
  };

  const startErrorLogWatcher = async (info, shouldScheduleReload = false) => {
    const providerName = get(info, 'routing.provider', null);
    if (!providerName || !providers[providerName] || isWorkerInstance()) {
      return;
    }

    if (daemon && info.routing.blockPolicy?.autoBlocking?.enabled && providers[providerName].supportsModSecurity()) {
      scanner.stopLogWatcher();
      const logs = providers[providerName].getLogFilesForToday();
      const limiter = createLimiter(info.routing.blockPolicy.autoBlocking, (entry) => {
        teamManager.createNotification({
          title: 'User IP Blocked',
          description: `User IP blocked: ${JSON.stringify(entry, null, 2)}`,
          entityType: 'server',
          severity: 'error',
          source: 'system',
          sticky: false,
        });
      });
      scanner.startLogWatcher(logs.error, async (logEntries) => {
        const blocked = [];
        const grouped = countBy(logEntries, 'ip');
        for (const [ip, count] of Object.entries(grouped)) {
          // eslint-disable-next-line no-await-in-loop
          const timeout = await limiter.check(ip, count);
          if (timeout > 0) {
            blocked.push(timeout);
          }
        }

        logger.debug('router error detected', { logEntries, grouped, blocked, timestamp: dayjs().unix() });

        if (blocked.length) {
          // Queue global change to update blacklist in nginx config
          providers[providerName].queueChange('global');
          // Schedule reload after block expiration to remove IPs from blacklist
          uniq(blocked).forEach((timeout) => {
            setTimeout(() => {
              logger.info('router reload on block expire', { timeout, timestamp: dayjs().unix() });
              providers[providerName].queueChange('global');
            }, timeout + 1000);
          });
        }
      });
    }

    // Schedule router reload for active blacklist expiration
    if (daemon && shouldScheduleReload) {
      const blacklist = await blocker.getActiveBlacklist(false);
      if (blacklist.length) {
        logger.info('schedule router reload for active blacklist', blacklist);
        const now = dayjs().unix();
        blacklist.forEach((x) => {
          const timeout = x.expiresAt - now + 1;
          setTimeout(() => {
            logger.info('router reload on block expire', { ip: x.key });
            providers[providerName].queueChange('global');
          }, timeout * 1000);
        });
      }
    }
  };

  const providers = {}; // we need to keep reference for different router instances
  const providerInitPromises = {}; // track ongoing initializations for race condition handling

  /**
   * Ensure routing provider is initialized (idempotent, race-condition safe)
   * Multiple concurrent calls will await the same initialization promise
   * @returns {Promise<{ provider: Router, nodeInfo: object, providerName: string }>}
   */
  const ensureRoutingProvider = async () => {
    const nodeInfo = await nodeState.read();
    const providerName = get(nodeInfo, 'routing.provider');
    const httpsEnabled = get(nodeInfo, 'routing.https', true);

    // Already initialized - fast path
    if (providers[providerName]) {
      return { provider: providers[providerName], nodeInfo, providerName };
    }

    // Already initializing - await the same promise
    if (providerInitPromises[providerName]) {
      await providerInitPromises[providerName];
      return { provider: providers[providerName], nodeInfo, providerName };
    }

    // Start initialization - store promise so concurrent calls can await it
    providerInitPromises[providerName] = (async () => {
      const startedAt = Date.now();
      logger.info('ensureRoutingProvider: initializing', { providerName, httpsEnabled });

      const Provider = getProvider(providerName);
      const checkResult = await Provider.check({ configDir: dataDirs.router });
      if (!checkResult.available) {
        throw new Error(`routing provider ${providerName} pre-check failed, ${checkResult.error}`);
      }

      providers[providerName] = new Router({
        provider: createProviderInstance({ nodeInfo, routerDataDir: dataDirs.router }),
        getAllRoutingParams: async () => {
          try {
            // Parallelize all independent async operations
            const [info, { sites }, services, certificates, wafDisabledList, noIndexOverrides] = await Promise.all([
              nodeState._read(),
              readAllRoutingSites(),
              blockletState.getServices(),
              httpsEnabled ? certManager.getAllNormal() : Promise.resolve([]),
              states.blockletExtras.getWafDisabledBlocklets(),
              states.blockletExtras.getNoIndexOverrides(),
            ]);

            // Fetch site info for WAF disabled blocklets in parallel
            const wafDisabledBlocklets = await Promise.all(
              wafDisabledList.map((x) =>
                states.site.findOneByBlocklet(x.did).then((result) => ({ did: x.did, site: result }))
              )
            );

            logger.info('router:getAllRoutingParams read routing params', { services });

            return {
              sites: await ensureRootRule(sites),
              certificates,
              headers: get(nodeInfo, 'routing.headers', {}),
              services,
              nodeInfo: info,
              wafDisabledBlocklets,
              noIndexOverrides,
            };
          } catch (err) {
            logger.error('Read routing rules failed', { error: err });
            teamManager.createNotification({
              title: 'Read routing rules failed',
              entityType: 'router',
              description: err?.message || 'Unknown error occurred while reading routing rules',
              severity: 'error',
              source: 'system',
            });

            return {};
          }
        },
        // Lightweight getter for single blocklet updates - O(1) database queries
        getBlockletRoutingParams: async (blockletDid) => {
          try {
            // Parallelize all independent async operations
            const [info, sites, certificates, noIndexOverrides] = await Promise.all([
              nodeState._read(),
              readBlockletRoutingSite(blockletDid),
              httpsEnabled ? certManager.getAllNormal() : Promise.resolve([]),
              states.blockletExtras.getNoIndexOverrides(),
            ]);

            if (!sites || sites.length === 0) {
              logger.warn('router: getBlockletRoutingParams empty', { blockletDid });
              return null;
            }

            logger.info('router: getBlockletRoutingParams success', { blockletDid, sites });

            return {
              sites,
              certificates,
              headers: get(info, 'routing.headers', {}),
              nodeInfo: info,
              wafDisabledBlocklets: [],
              noIndexOverrides,
            };
          } catch (err) {
            logger.error('router: getBlockletRoutingParams failed', { blockletDid, error: err });
            return null;
          }
        },
        // Lightweight getter for global/system routing params - O(1) database queries
        // Returns only system sites (dashboard, wellknown, IP, default) + services + global policies
        getSystemRoutingParams: async () => {
          try {
            // Parallelize all independent async operations
            const [info, { sites }, services, certificates, wafDisabledList] = await Promise.all([
              nodeState._read(),
              readSystemRoutingSites(),
              blockletState.getServices(),
              httpsEnabled ? certManager.getAllNormal() : Promise.resolve([]),
              states.blockletExtras.getWafDisabledBlocklets(),
            ]);

            // Fetch site info for WAF disabled blocklets in parallel
            const wafDisabledBlocklets = await Promise.all(
              wafDisabledList.map((x) =>
                states.site.findOneByBlocklet(x.did).then((result) => ({ did: x.did, site: result }))
              )
            );

            logger.info('router: getSystemRoutingParams success', {
              services,
              wafDisabledBlocklets,
              sites,
            });

            return {
              sites,
              certificates,
              services,
              headers: get(info, 'routing.headers', {}),
              nodeInfo: info,
              wafDisabledBlocklets,
              noIndexOverrides: {},
            };
          } catch (err) {
            logger.error('router: getSystemRoutingParams failed', { error: err });
            return null;
          }
        },
      });

      // Helper to find affected blocklets by certificate
      const findAffectedBlockletsByCert = async (cert) => {
        if (!cert) return [];

        const sites = await siteState.getSites();
        const affectedDids = new Set();

        for (const site of sites) {
          if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) continue;

          const domains = [site.domain, ...(site.domainAliases || []).map((x) => x.value)];
          const isMatch = domains.some((domain) => domain && routerManager.isCertMatchedDomain(cert, domain));

          if (isMatch) {
            affectedDids.add(site.domain.replace(BLOCKLET_SITE_GROUP_SUFFIX, ''));
          }
        }

        return Array.from(affectedDids);
      };

      // Set up cert event handlers - trigger targeted routing updates
      [
        BlockletEvents.certIssued,
        EVENTS.CERT_ADDED,
        EVENTS.CERT_REMOVED,
        EVENTS.CERT_ISSUED,
        EVENTS.CERT_UPDATED,
      ].forEach((event) => {
        certManager.on(event, async (cert) => {
          if (!cert) return;

          logger.info('cert event triggered routing update', { event, domain: cert.domain });

          // Always update global routing for cert changes
          // eslint-disable-next-line no-use-before-define
          await handleSystemRouting({ message: `cert event: ${event}` });

          // Find and update affected blocklets
          const affectedDids = await findAffectedBlockletsByCert(cert);
          for (const did of affectedDids) {
            // eslint-disable-next-line no-await-in-loop, no-use-before-define
            await handleBlockletRouting({ did, message: `cert event: ${event}` });
          }
        });
      });

      await startAccessLogWatcher(nodeInfo);
      await startErrorLogWatcher(nodeInfo, true);

      logger.info('ensureRoutingProvider: initialized', { providerName, duration: Date.now() - startedAt });
    })();

    try {
      await providerInitPromises[providerName];
    } finally {
      // Clean up promise regardless of success/failure
      delete providerInitPromises[providerName];
    }

    return { provider: providers[providerName], nodeInfo, providerName };
  };

  /**
   * Lightweight handler for global/system routing updates - O(1) complexity
   * Use this for changes that only affect global config (policies, system sites, services)
   * @param {Object} options
   * @param {string} [options.message] - Log message describing the change
   */
  const handleSystemRouting = async ({ message = '' } = {}) => {
    logger.info('handleSystemRouting: triggered', { message });
    const { provider, providerName } = await ensureRoutingProvider();
    provider.queueChange('global');
    logger.info('handleSystemRouting: queued', { message, providerName });
  };

  /**
   * Lightweight handler for single blocklet routing updates - O(2) complexity
   * Updates blocklet config + global config (for services that may have changed)
   * @param {Object} options
   * @param {string} options.did - Blocklet DID
   * @param {string} [options.message] - Log message describing the change
   * @param {boolean} [options.isRemoval] - Whether this is a blocklet removal
   */
  const handleBlockletRouting = async ({ did, message = '', isRemoval = false }) => {
    logger.info('handleBlockletRouting: triggered', { did, message, isRemoval });
    if (!did) {
      return;
    }

    const { provider, providerName } = await ensureRoutingProvider();
    const changeType = isRemoval ? 'blocklet-remove' : 'blocklet';
    provider.queueChange('global');
    provider.queueChange(changeType, did);
    logger.info('handleBlockletRouting: queued', { did, message, isRemoval, providerName });
  };

  /**
   * Full regeneration handler - O(N) complexity
   * Use this for startup, manual rebuild, or when complete regeneration is needed
   * @param {Object} options
   * @param {string} [options.message] - Log message describing the change
   */
  const handleAllRouting = async ({ message = '' } = {}) => {
    logger.info('handleAllRouting: triggered', { message });
    const { provider, providerName } = await ensureRoutingProvider();
    await provider.regenerateAll({ message });
    logger.info('handleAllRouting: done', { message, providerName });
  };

  const rotateRouterLog = async () => {
    const info = await nodeState.read();
    const providerName = get(info, 'routing.provider', null);

    if (providerName && providers[providerName] && typeof providers[providerName].rotateLogs === 'function') {
      await providers[providerName].rotateLogs({ retain: LOG_RETAIN_IN_DAYS });
      await startAccessLogWatcher(info);
      await startErrorLogWatcher(info);
    }
  };

  const analyzeRouterLog = async () => {
    const info = await nodeState.read();
    const providerName = get(info, 'routing.provider', null);
    if (!providerName || !providers[providerName]) {
      logger.warn('No router provider instance found');
      return;
    }

    const groups = [];
    const sites = await attachRuntimeDomainAliases({ sites: await siteState.getSites(), context: {} });

    const server = sites.find((x) =>
      x.rules.some((rule) => rule.to.type === ROUTING_RULE_TYPES.DAEMON && rule.to.did === info.did)
    );
    if (server) {
      groups.push({
        did: info.did,
        type: 'server',
        hosts: server.domainAliases.map((d) => d.value).filter(Boolean),
      });
    }

    // blocklets
    sites
      .filter((x) => x.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX))
      .forEach((site) => {
        groups.push({
          did: site.domain.replace(BLOCKLET_SITE_GROUP_SUFFIX, ''),
          type: 'blocklet',
          hosts: site.domainAliases.map((d) => d.value).filter(Boolean),
        });
      });
    logger.info('Prepare analyze router logs', groups);

    const logDir = providers[providerName].getLogDir();
    const doAnalyze = async (date, groupsRaw) => {
      logger.info('Start analyze router logs', { date });
      try {
        let results = await processLogByDate(logDir, dataDirs.tmp, dataDirs.data, date, groupsRaw);
        logger.info('Done analyze router logs', { date, results });

        results = await Promise.all(
          results
            .filter((x) => x.result)
            .map((x) => ({ did: x.did, date, ...toCamelCase(x.result) }))
            .map((x) => trafficInsight.upsert({ did: x.did, date: x.date }, x))
        );
        logger.info('Done insert insight results', { date, results });
      } catch (err) {
        logger.error('Failed to analyze router logs', { date, error: err });
      }
    };

    const analyzeLock = path.join(logDir, '.analyze.lock20241030');
    if (fs.existsSync(analyzeLock)) {
      // FIXME: how do we support real time logs
      const date = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      await doAnalyze(date, cloneDeep(groups));
    } else {
      fs.writeFileSync(analyzeLock, '1');
      for (let i = 1; i <= 15; i++) {
        const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
        // eslint-disable-next-line no-await-in-loop
        await doAnalyze(date, cloneDeep(groups));
      }
    }
  };

  const refreshGatewayBlacklist = async () => {
    const info = await nodeState.read();
    const blockPolicy = info.routing.blockPolicy || { enabled: false, blacklist: [] };
    if (!blockPolicy.enabled) {
      logger.debug('gateway blacklist is disabled');
      return;
    }

    const blacklist = await expandBlacklist(blockPolicy.blacklist);
    if (!blacklist.length) {
      logger.debug('gateway blacklist is empty');
      return;
    }
    const hash = md5(blacklist.join(','));
    if (hash === info.routing.blacklistHash) {
      logger.debug('gateway blacklist not changed', { hash });
      return;
    }

    await nodeState.updateGateway({ ...info.routing, blacklistHash: hash });
    logger.info('refresh gateway blacklist from cron', { hash, blacklist });
  };

  const getSitesFromState = async (scope = 'all') => {
    const sites = scope === 'all' ? await siteState.getSites() : await siteState.getSystemSites();
    const blocklets = scope === 'all' ? await states.blocklet.getBlocklets() : [];

    return ensureLatestInfo(sites, blocklets, teamManager);
  };

  /**
   *
   * @param {*} params
   * @param {*} context
   * @param {string} withInterfaceUrls
   */
  const getRoutingSites = async (params, context = {}, { withInterfaceUrls = true, scope = 'all' } = {}) => {
    const sites = await getSitesFromState(scope);

    if (!withInterfaceUrls) {
      return sites;
    }

    return attachRuntimeDomainAliases({
      sites,
      context,
    });
  };

  const getCertificates = async () => {
    const certificates = await certManager.getAll();
    const sites = await attachRuntimeDomainAliases({ sites: await siteState.getSites(), context: {} });

    const isMatch = (cert, domain) =>
      domain !== DOMAIN_FOR_DEFAULT_SITE && domain && routerManager.isCertMatchedDomain(cert, domain);

    return certificates.map((cert) => {
      cert.matchedSites = [];
      sites.forEach((site) => {
        const domains = [site.domain, ...(site.domainAliases || []).map((x) => x.value)];
        domains.forEach((domain) => {
          if (isMatch(cert, domain)) {
            cert.matchedSites.push({ id: site.id, domain });
          }
        });
      });

      return cert;
    });
  };

  /**
   * proxy to routerManager and trigger handleBlockletRouting after operation
   */
  const _proxyToRouterManager =
    (fnName) =>
    async (...args) => {
      const res = await routerManager[fnName](...args);
      const { teamDid: did } = args[0] || {};
      await handleBlockletRouting({ did, message: fnName });
      if (did) {
        routerManager.emit(BlockletEvents.updated, { meta: { did } });
      }

      return res;
    };

  const addRoutingSite = _proxyToRouterManager('addRoutingSite');
  const updateRoutingSite = _proxyToRouterManager('updateRoutingSite');
  const deleteRoutingSite = _proxyToRouterManager('deleteRoutingSite');
  const addRoutingRule = _proxyToRouterManager('addRoutingRule');
  const addRoutingRuleToDefaultSite = _proxyToRouterManager('addRoutingRuleToDefaultSite');
  const updateRoutingRule = _proxyToRouterManager('updateRoutingRule');
  const deleteRoutingRule = _proxyToRouterManager('deleteRoutingRule');
  // FIXME: should verify domain owner before added
  const addDomainAlias = _proxyToRouterManager('addDomainAlias');
  const deleteDomainAlias = _proxyToRouterManager('deleteDomainAlias');

  // @ts-ignore
  const gatewayBlacklistRefreshInterval = +process.env.ABT_NODE_BLACKLIST_REFRESH_INTERVAL || 2;

  const getGatewayBlacklist = async (type = 'both') => {
    const info = await nodeState.read();
    const blockPolicy = info.routing.blockPolicy || { enabled: false, blacklist: [] };
    const blacklist = await expandBlacklist(blockPolicy.blacklist);
    const blockedIps = await blocker.getActiveBlacklist();
    if (type === 'both') {
      return uniq([...blacklist, ...blockedIps]);
    }
    if (type === 'dynamic') {
      return uniq([...blockedIps]);
    }

    return uniq([...blacklist]);
  };

  const handleBlockletWafChange = async ({ teamDid, wafPolicy }) => {
    const blocklet = await blockletManager.detail({ did: teamDid });
    if (!blocklet) {
      return;
    }

    const domainAliases = blocklet?.site?.domainAliases || [];
    if (!domainAliases.length) {
      return;
    }

    const doc = await nodeState.read();
    const providerName = get(doc, 'routing.provider', null);
    const defaultWAF = doc.routing.wafPolicy?.mode;

    // update nginx waf
    const provider = providerName && providers[providerName] && providers[providerName].provider;
    if (provider && typeof provider.addCustomWAFConf === 'function') {
      await provider.addCustomWAFConf({ did: teamDid, domainAliases, wafPolicy, defaultWAF });
      nodeState.emit(EVENTS.RELOAD_GATEWAY, doc);
    }
  };

  return {
    handleBlockletWafChange,
    ensureDashboardRouting,
    ensureBlockletRouting,
    ensureBlockletRoutingForUpgrade,
    removeBlockletRouting,
    handleSystemRouting, // O(1) - for global config changes only
    handleBlockletRouting, // O(2) - for single blocklet + global (services)
    handleAllRouting, // O(N) - for full regeneration
    resetSiteByDid,
    getRoutingSites,
    getSitesFromState,
    getCertificates,
    ensureWildcardCerts,
    ensureServerlessCerts,
    addWellknownSite,
    upsertSiteRule,
    getRouterProvider: (name) => providers[name],
    updateSiteDomainAliases,

    getRoutingCrons: () => [
      {
        name: 'update-dashboard-certificate',
        time: '0 1 */6 * * *', // refetch on 0:00, 6:00, etc.
        fn: () => updateDashboardCertificates(),
        options: { runOnInit: true },
      },
      {
        name: 'update-serverless-certificate',
        time: '0 10 */6 * * *', // refetch on 0:10, 6:10, etc. (offset from dashboard cert update)
        fn: () => ensureServerlessCerts(),
        options: { runOnInit: false },
      },
      {
        name: 'rotate-log-files',
        time: '1 0 0 * * *', // rotate at 00:00:01 every day
        fn: rotateRouterLog,
        options: { runOnInit: process.env.ABT_NODE_JOB_NAME === 'rotate-log-files' },
      },
      {
        name: 'analyze-log-files',
        time: '0 5 0 * * *', // analyze at 00:05:00 every day
        fn: analyzeRouterLog,
        options: { runOnInit: process.env.ABT_NODE_JOB_NAME === 'analyze-log-files' },
      },
      {
        name: 'refresh-gateway-blacklist',
        time: `0 */${gatewayBlacklistRefreshInterval} * * * *`, // refresh blocking list every 2 minutes
        fn: refreshGatewayBlacklist,
        options: { runOnInit: process.env.ABT_NODE_JOB_NAME === 'refresh-gateway-blacklist' },
      },
      {
        name: 'cleanup-analytics-data',
        time: '0 30 6 * * *', // cleanup at 06:30 every day
        fn: () =>
          cleanupAnalyticsData({
            trafficInsight,
            dataDir: dataDirs.data,
            retainDays: Number(process.env.ABT_NODE_ANALYTICS_RETENTION_DAYS) || ABT_NODE_ANALYTICS_RETAIN_IN_DAYS,
          }),
        options: { runOnInit: true },
      },
    ],

    addRoutingSite,
    deleteRoutingSite,
    updateRoutingSite,
    addRoutingRule,
    addRoutingRuleToDefaultSite,
    updateRoutingRule,
    deleteRoutingRule,
    addDomainAlias,
    deleteDomainAlias,
    isGatewayCacheEnabled,
    getGatewayBlacklist,
  };
};

const ensureBlockletHasMultipleInterfaces = (blocklet, componentDids) => {
  if (!componentDids?.length) {
    return false;
  }
  for (const child of blocklet.children) {
    if (!child?.meta) {
      continue;
    }
    const interfaces = (child.meta.interfaces || []).filter((x) => !!x.port);
    if (componentDids.includes(child.meta.did) && interfaces.length > 1) {
      return true;
    }
  }
  return false;
};

module.exports.attachRuntimeDomainAliases = attachRuntimeDomainAliases;
module.exports.ensureLatestNodeInfo = ensureLatestNodeInfo;
module.exports.ensureLatestInterfaceInfo = ensureLatestInterfaceInfo;
module.exports.ensureLatestInfo = ensureLatestInfo;
module.exports.ensureWellknownRule = ensureWellknownRule;
module.exports.ensureBlockletWellknownRules = ensureBlockletWellknownRules;
module.exports.ensureBlockletProxyBehavior = ensureBlockletProxyBehavior;
module.exports.ensureBlockletStaticServing = ensureBlockletStaticServing;
module.exports.ensureSubServiceSites = ensureSubServiceSites;
module.exports.expandComponentRules = expandComponentRules;
module.exports.getDomainsByDid = getDomainsByDid;
module.exports.ensureBlockletHasMultipleInterfaces = ensureBlockletHasMultipleInterfaces;
