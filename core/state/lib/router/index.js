const get = require('lodash/get');
const uniq = require('lodash/uniq');
const debounce = require('lodash/debounce');
const pick = require('lodash/pick');
const isEqual = require('lodash/isEqual');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const {
  DOMAIN_FOR_DEFAULT_SITE,
  DOMAIN_FOR_IP_SITE_REGEXP,
  ROUTING_RULE_TYPES,
  DEFAULT_IP_DOMAIN,
  BLOCKLET_PROXY_PATH_PREFIX,
  BLOCKLET_SITE_GROUP_SUFFIX,
  GATEWAY_RATE_LIMIT,
  GATEWAY_RATE_LIMIT_GLOBAL,
  GATEWAY_RATE_LIMIT_METHODS,
  DOMAIN_FOR_IP_SITE,
  WELLKNOWN_PATH_PREFIX,
} = require('@abtnode/constant');
const { BLOCKLET_UI_INTERFACES, BLOCKLET_MODES } = require('@blocklet/constant');

const logger = require('@abtnode/logger')('@abtnode/core:router');

const { isGatewayCacheEnabled, isBlockletSite } = require('../util');
const { expandBlacklist } = require('../util/router');
const { getActiveBlacklist } = require('./security/blocker');
const IP = require('../util/ip');

const isServiceFeDevelopment = process.env.ABT_NODE_SERVICE_FE_PORT;

const expandSites = (sites = []) => {
  const result = [];

  sites.forEach((site) => {
    (site.domainAliases || []).forEach((domainAlias) => {
      const domain = typeof domainAlias === 'object' ? domainAlias.value : domainAlias;
      const tmpSite = cloneDeep(site);
      delete tmpSite.domainAliases;

      tmpSite.serviceType = isBlockletSite(site.domain) ? 'blocklet' : 'daemon';

      tmpSite.domain = domain;

      // For nft-domain-forwarding with metadata, replace rules but preserve ACME challenge for certificate issuance
      if (
        typeof domainAlias === 'object' &&
        domainAlias.type === 'nft-domain-forwarding' &&
        domainAlias.metadata?.targetUrl
      ) {
        const { targetUrl, statusCode = 301, preservePath = true, preserveQuery = true } = domainAlias.metadata;
        // Keep existing wellknown rules (/.well-known/*) for ACME challenge and other services
        const wellknownRules = (tmpSite.rules || []).filter((rule) =>
          rule.from?.pathPrefix?.startsWith(WELLKNOWN_PATH_PREFIX)
        );
        tmpSite.rules = [
          ...wellknownRules,
          {
            id: 'domain-forwarding',
            from: { pathPrefix: '/', groupPathPrefix: '/' },
            to: {
              type: ROUTING_RULE_TYPES.REDIRECT,
              url: targetUrl,
              redirectCode: statusCode,
              preservePath,
              preserveQuery,
            },
          },
        ];
      }

      result.push(tmpSite);
    });

    delete site.domainAliases;

    // skip site if domain is BLOCKLET_SITE_GROUP
    if (!site.domain.endsWith(BLOCKLET_SITE_GROUP_SUFFIX)) {
      if (!site.serviceType) {
        site.serviceType = 'daemon';
      }

      result.push(site);
    }
  });

  const defaultSite = result.find((site) => site.domain === DOMAIN_FOR_DEFAULT_SITE);
  const defaultIpSite = result.find((site) => site.domain === DOMAIN_FOR_IP_SITE_REGEXP);
  if (defaultSite && defaultIpSite) {
    defaultSite.rules = defaultSite.rules || [];
    defaultSite.rules.push(...(defaultIpSite.rules || []));
  }

  return result;
};

const isDefaultSite = (domain) => DOMAIN_FOR_DEFAULT_SITE === domain;

const isIpSite = (domain) => [DOMAIN_FOR_IP_SITE, DOMAIN_FOR_IP_SITE_REGEXP].includes(domain);

const filterSites = ({ sites, enableDefaultServer, enableIpServer }) => {
  let result = cloneDeep(sites);

  if (!enableDefaultServer) {
    result = result.filter((x) => !isDefaultSite(x.domain));
    logger.info('disable default server');
  }

  if (!enableIpServer) {
    result = result.filter((x) => !isIpSite(x.domain));
    logger.info('disable ip site');
  }

  return result;
};

const getRoutingTable = ({ sites, nodeInfo }) => {
  const enableDefaultServer = nodeInfo.routing.enableDefaultServer ?? false;
  const enableIpServer = nodeInfo.routing.enableIpServer ?? false;

  // eslint-disable-next-line no-use-before-define
  let routingTable = Router.formatSites(sites, nodeInfo);
  routingTable = expandSites(routingTable);
  routingTable = filterSites({ sites: routingTable, enableDefaultServer, enableIpServer });

  // put ipWildcardDomain to last, to let blockletDomain match first
  // e.g.
  //  ipWildcardDomain: 192-168-3-2.ip.abtnet.io
  //  blockletDomain: static-demo-xxx-192-168-3-2.ip.abtnet.io
  const ipWildcardDomain = get(nodeInfo, 'routing.ipWildcardDomain', '');
  const index = routingTable.findIndex((x) => x.domain === ipWildcardDomain);
  if (index > -1) {
    routingTable.push(...routingTable.splice(index, 1));
  }

  return routingTable;
};

class Router {
  /**
   * Router
   * @constructor
   * @param {object} options
   * @param {object} options.provider - Router provider instance
   * @param {function} options.getAllRoutingParams - Function to get all routing params (for full reload)
   * @param {function} [options.getBlockletRoutingParams] - Function to get single blocklet's routing params (for lightweight updates)
   * @param {function} [options.getSystemRoutingParams] - Function to get global/system routing params (for global-only updates)
   */
  constructor({ provider, getAllRoutingParams, getBlockletRoutingParams, getSystemRoutingParams }) {
    if (!provider) {
      throw new Error('Must provide valid router when create new router');
    }

    if (typeof getAllRoutingParams !== 'function') {
      throw new Error('Must provide a valid getAllRoutingParams function when create new router');
    }

    this.provider = provider;
    this.getAllRoutingParams = getAllRoutingParams;
    this.getBlockletRoutingParams = getBlockletRoutingParams; // Optional - for lightweight single blocklet updates
    this.getSystemRoutingParams = getSystemRoutingParams; // Optional - for global-only updates (O(1))
    this.routingTable = [];

    // Batching for rapid changes
    this.pendingChanges = {
      global: false,
      blocklets: new Set(),
      blockletsRemoved: new Set(),
    };
    this._processingBatch = false;

    // Debounced batch processor - waits 1000ms for more changes, max 5s
    this.debouncedProcessBatch = debounce(() => this._processBatch(), 1000, { maxWait: 5000 });
  }

  /**
   * Update routing table by fetching params and calling provider.update()
   * This is a convenience method that combines _getUpdateParams() and provider.update()
   */
  async updateRoutingTable() {
    logger.info('router: update routing table');

    const params = await this._getUpdateParams();
    if (!params) {
      logger.error('router: failed to get update params in updateRoutingTable');
      return;
    }
    logger.info('router: update routing table params ready');

    await this.provider.update(params);
    logger.info('router: update routing table complete');
  }

  async update() {
    logger.info('router: update');
    await this.updateRoutingTable();
    await this.provider.reload();
    logger.info('router: reload provider success');
  }

  async start() {
    logger.info('router: start');
    await this.updateRoutingTable();
    return this.provider.start();
  }

  async restart() {
    logger.info('router: restart');
    await this.updateRoutingTable();
    return this.provider.restart();
  }

  async reload() {
    logger.info('router: reload');
    await this.updateRoutingTable();
    return this.provider.reload();
  }

  stop() {
    logger.info('router: stop');
    return this.provider.stop();
  }

  async validateConfig() {
    logger.info('router: validateConfig');
    await this.provider.validateConfig();
  }

  async rotateLogs() {
    logger.info('router: rotate logs');
    await this.provider.rotateLogs();
  }

  getLogFilesForToday() {
    return this.provider.getLogFilesForToday();
  }

  getLogDir() {
    return this.provider.getLogDir();
  }

  searchCache(pattern, group) {
    return this.provider.searchCache(pattern, group);
  }

  clearCache(group) {
    return this.provider.clearCache(group);
  }

  supportsModSecurity() {
    return !!this.provider.capabilities?.modsecurity;
  }

  /**
   * Get update parameters for the provider
   * @returns {Promise<object>} Parameters for provider.update()
   */
  async _getUpdateParams(fn = 'getAllRoutingParams') {
    const {
      sites,
      certificates,
      headers = {},
      services = [],
      nodeInfo = {},
      wafDisabledBlocklets = [],
      noIndexOverrides = {},
    } = (await this[fn]()) || {};

    if (!Array.isArray(sites)) {
      logger.error('router:_getUpdateParams: sites is not an array', { fn, sites });
      return null;
    }

    this.routingTable = getRoutingTable({ sites, nodeInfo });

    const requestLimit = Object.assign(
      {
        enabled: false,
        rate: GATEWAY_RATE_LIMIT.min,
        global: GATEWAY_RATE_LIMIT_GLOBAL.min,
        methods: GATEWAY_RATE_LIMIT_METHODS,
        burstFactor: 2,
        burstDelay: 0,
      },
      nodeInfo.routing.requestLimit
    );
    if (requestLimit.enabled) {
      requestLimit.burst = Math.min(Math.round(requestLimit.rate * requestLimit.burstFactor), GATEWAY_RATE_LIMIT.max);
      requestLimit.burstGlobal = Math.min(
        Math.round(requestLimit.global * requestLimit.burstFactor),
        GATEWAY_RATE_LIMIT_GLOBAL.max
      );
    }

    const blockPolicy = nodeInfo.routing.blockPolicy || { enabled: false, blacklist: [] };
    if (blockPolicy.enabled) {
      blockPolicy.blacklist = await expandBlacklist(blockPolicy.blacklist);

      const result = await IP.get({ timeout: 2000 });
      if (result?.internal) {
        blockPolicy.blacklist = blockPolicy.blacklist.filter((x) => x !== result.internal);
      }
      if (result?.external) {
        blockPolicy.blacklist = blockPolicy.blacklist.filter((x) => x !== result.external);
      }

      const blockedIps = await getActiveBlacklist();
      blockPolicy.blacklist = uniq([...blockPolicy.blacklist, ...blockedIps]);
    }

    const proxyPolicy = nodeInfo.routing.proxyPolicy || {
      enabled: false,
      trustRecursive: false,
      trustedProxies: ['0.0.0.0/0'],
      realIpHeader: 'X-Forwarded-For',
    };

    const wafPolicy = nodeInfo.routing.wafPolicy || {
      enabled: false,
      mode: 'DetectionOnly',
      inboundAnomalyScoreThreshold: 10,
      outboundAnomalyScoreThreshold: 10,
    };

    return {
      routingTable: this.routingTable,
      certificates,
      commonHeaders: headers,
      services,
      nodeInfo: pick(nodeInfo, ['did', 'name', 'version', 'port', 'mode', 'enableWelcomePage', 'routing']),
      requestLimit,
      blockPolicy,
      proxyPolicy,
      wafPolicy,
      cacheEnabled: isGatewayCacheEnabled(nodeInfo),
      wafDisabledBlocklets,
      noIndexOverrides,
      enableDefaultServer: nodeInfo.routing.enableDefaultServer ?? false,
      enableIpServer: nodeInfo.routing.enableIpServer ?? false,
    };
  }

  /**
   * Queue a change for batched processing
   * @param {string} changeType - 'global', 'blocklet', or 'blocklet-remove'
   * @param {string} [did] - The blocklet DID (for blocklet changes)
   */
  queueChange(changeType, did = undefined) {
    if (changeType === 'global') {
      this.pendingChanges.global = true;
    } else if (changeType === 'blocklet' && did) {
      this.pendingChanges.blocklets.add(did);
      // If we're updating a blocklet, remove it from the remove list
      this.pendingChanges.blockletsRemoved.delete(did);
    } else if (changeType === 'blocklet-remove' && did) {
      this.pendingChanges.blockletsRemoved.add(did);
      // If we're removing a blocklet, remove it from the update list
      this.pendingChanges.blocklets.delete(did);
    }

    logger.info('router: queued change', {
      changeType,
      did,
      global: this.pendingChanges.global,
      blockletCount: this.pendingChanges.blocklets.size,
      removeCount: this.pendingChanges.blockletsRemoved.size,
    });

    this.debouncedProcessBatch();
  }

  /**
   * Process batched changes with tiered approach:
   * - Global-only changes: O(1) using getSystemRoutingParams
   * - Blocklet changes: O(1) per blocklet using getBlockletRoutingParams
   * - Global + blocklet changes: O(1) global + O(k) blocklets where k = number of changed blocklets
   */
  async _processBatch() {
    if (this._processingBatch) {
      logger.info('router: already processing batch, will retry');
      this.debouncedProcessBatch();
      return;
    }

    const { global: globalChanged, blocklets, blockletsRemoved } = this.pendingChanges;
    const hasBlockletChanges = blocklets.size > 0 || blockletsRemoved.size > 0;
    const hasChanges = globalChanged || hasBlockletChanges;

    if (!hasChanges) {
      logger.debug('router: no pending changes to process');
      return;
    }

    this._processingBatch = true;

    // Clear pending changes before processing
    const blockletsToUpdate = [...blocklets];
    const blockletsToRemove = [...blockletsRemoved];
    this.pendingChanges = {
      global: false,
      blocklets: new Set(),
      blockletsRemoved: new Set(),
    };

    logger.info('router: processing batched changes', {
      globalChanged,
      blockletsToUpdate: blockletsToUpdate.length,
      blockletsToRemove: blockletsToRemove.length,
    });

    try {
      let needsReload = false;

      // Get global params once (O(1)) - needed for both global and blocklet updates
      let globalParams = null;
      if (typeof this.getSystemRoutingParams === 'function') {
        globalParams = await this._getUpdateParams('getSystemRoutingParams');
      }

      // Case 1: Global changed with no blocklet changes - use lightweight global update
      if (globalChanged) {
        if (globalParams) {
          // Use global params for system sites + services + policies
          await this.provider.update({ ...globalParams, skipBlockletSites: true });
          needsReload = true;
          logger.info('router: batch processed global-only changes');
        } else {
          logger.error('router: global-only changes found, but globalParams is not available');
        }
      }

      // Case 2: Process blocklet updates (O(1) per blocklet)
      if (blockletsToUpdate.length > 0 && typeof this.getBlockletRoutingParams === 'function') {
        // eslint-disable-next-line no-restricted-syntax
        for (const did of blockletsToUpdate) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const rawParams = await this.getBlockletRoutingParams(did);
            if (rawParams && rawParams.sites && rawParams.sites.length > 0) {
              const {
                sites,
                certificates,
                headers = {},
                nodeInfo = {},
                wafDisabledBlocklets = [],
                noIndexOverrides = {},
              } = rawParams;
              const blockletParams = {
                routingTable: getRoutingTable({ sites, nodeInfo }),
                certificates,
                commonHeaders: headers,
                nodeInfo: pick(nodeInfo, ['did', 'name', 'version', 'port', 'mode', 'enableWelcomePage', 'routing']),
                wafDisabledBlocklets,
                noIndexOverrides,
              };

              if (typeof this.provider.updateSingleBlocklet === 'function') {
                // eslint-disable-next-line no-await-in-loop
                await this.provider.updateSingleBlocklet(did, blockletParams);
                logger.info('router: batch processed blocklet changes', { did });
                needsReload = true;
              }
            }
          } catch (error) {
            logger.warn('router: failed to update blocklet in batch, skipping', { did, error: error.message });
          }
        }
      }

      // Case 4: Process blocklet removals
      // eslint-disable-next-line no-restricted-syntax
      for (const did of blockletsToRemove) {
        if (typeof this.provider._removeBlockletConfig === 'function') {
          // eslint-disable-next-line no-await-in-loop
          await this.provider._removeBlockletConfig(did);
          logger.info('router: batch processed blocklet removal', { did });
          needsReload = true;
        }
      }

      // Single reload for all changes
      if (needsReload) {
        const status = await this.provider.getStatus();
        logger.info('router: batch needs reload', { status });
        if (!status.running) {
          await this.provider.start();
        } else {
          await this.provider.reload();
        }
      }

      logger.info('router: batch processing complete', {
        globalChanged,
        blockletsUpdated: blockletsToUpdate.length,
        blockletsRemoved: blockletsToRemove.length,
      });
    } catch (error) {
      logger.error('router: batch processing failed', { error: error.message });
      // Try full reload as fallback
      try {
        await this.reload();
      } catch (reloadError) {
        logger.error('router: fallback reload also failed', { error: reloadError.message });
      }
    } finally {
      this._processingBatch = false;
    }
  }

  /**
   * Full regeneration - O(N) complexity
   * Use for startup, manual rebuild, or when complete regeneration is needed
   * @param {Object} options
   * @param {string} [options.message] - Log message describing the reason for regeneration
   */
  async regenerateAll({ message = '' } = {}) {
    logger.info('router: full regeneration', { message });
    const params = await this._getUpdateParams('getAllRoutingParams');
    if (!params) {
      logger.error('router: failed to get update params for full regeneration');
      return;
    }

    await this.provider.update(params);
    await this.provider.reload();
    logger.info('router: full regeneration complete', { message });
  }
}

Router.formatSites = (sites = [], info) => {
  const result = cloneDeep(sites);

  result.forEach((site) => {
    const rules = Array.isArray(site.rules) ? cloneDeep(site.rules) : [];
    const grouped = {};

    // 0. serve robots.txt/sitemap.xml and favicon.ico from root and proxy to daemon
    if (isBlockletSite(site.domain) && !site.rules.find((x) => x.from.pathPrefix === '/robots.txt')) {
      site.rules.push({
        dynamic: true,
        from: {
          root: true,
          pathPrefix: '/',
          groupPathPrefix: '/',
          pathSuffix: '/(robots.txt|sitemap.xml)',
        },
        to: {
          type: ROUTING_RULE_TYPES.DAEMON,
          port: info.port,
          did: site.blockletDid,
        },
      });
    }

    if (isBlockletSite(site.domain) && !site.rules.find((x) => x.from.pathPrefix === '/favicon.ico')) {
      site.rules.push({
        dynamic: true,
        from: { root: true, pathPrefix: '/', groupPathPrefix: '/', pathSuffix: '/favicon.ico' },
        // /favicon.ico must proxy to blocklet-service
        to: { type: ROUTING_RULE_TYPES.SERVICE, port: process.env.ABT_NODE_SERVICE_PORT, did: site.blockletDid },
      });
    }

    // 1. serve blocklet.js for each component: both prefix and suffix do not contain trailing slash
    rules.forEach((rule) => {
      if ([ROUTING_RULE_TYPES.BLOCKLET].includes(rule.to.type) === false) {
        return;
      }

      if (BLOCKLET_UI_INTERFACES.includes(rule.to.interfaceName) === false) {
        return;
      }

      if (rule.dynamic) {
        return;
      }

      grouped[rule.from.groupPathPrefix] = rule;
      site.rules.push({
        dynamic: true,
        from: {
          pathPrefix: rule.from.pathPrefix,
          groupPathPrefix: rule.from.groupPathPrefix,
          pathSuffix: '/__(meta|blocklet)__.js',
        },
        to: {
          type: ROUTING_RULE_TYPES.DAEMON,
          port: info.port,
          did: rule.to.did,
          componentId: rule.to.componentId,
          pageGroup: rule.to.pageGroup,
        },
      });
    });

    // 2. ensure blocklet.js and proxy always served even if there are no components
    if (isBlockletSite(site.domain) && Object.keys(grouped).length === 0) {
      grouped['/'] = {
        id: '',
        to: {
          did: site.blockletDid,
          componentId: site.blockletDid,
        },
      };
    }
    Object.keys(grouped).forEach((groupPathPrefix) => {
      const rootFrom = {
        pathPrefix: groupPathPrefix,
        groupPathPrefix,
        pathSuffix: '/__(meta|blocklet)__.js',
      };

      const rule = grouped[groupPathPrefix];

      // 2.1 ensure /__blocklet__.js should be proxy to daemon
      if (!site.rules.find((x) => isEqual(x.from, rootFrom))) {
        site.rules.push({
          dynamic: true,
          from: rootFrom,
          to: {
            type: ROUTING_RULE_TYPES.DAEMON,
            port: info.port,
            pageGroup: rule.to.pageGroup,
            did: rule.to.did,
          },
        });
      }
      // 2.2 ensure /.blocklet/proxy should be proxy to daemon
      if (!site.rules.find((x) => x.from.pathPrefix === BLOCKLET_PROXY_PATH_PREFIX)) {
        site.rules.push({
          dynamic: true,
          from: {
            pathPrefix: BLOCKLET_PROXY_PATH_PREFIX,
          },
          to: {
            port: info.port,
            type: ROUTING_RULE_TYPES.DAEMON,
            target: BLOCKLET_PROXY_PATH_PREFIX,
            cacheGroup: !isServiceFeDevelopment && site.mode === BLOCKLET_MODES.PRODUCTION ? 'blockletProxy' : '',
            pageGroup: rule.to.pageGroup,
            did: rule.to.did,
          },
        });
      }
    });
  });

  return result;
};

Router.flattenSitesToRules = (sites = [], info = {}) => {
  const result = [];
  const ipWildcardDomain = get(info, 'routing.ipWildcardDomain', DEFAULT_IP_DOMAIN);
  sites.forEach((site) => {
    const aliases = (site.domainAliases || [])
      .map((x) => (typeof x === 'string' ? x : x.value))
      .filter((x) => x !== ipWildcardDomain)
      .filter(Boolean);

    if (Array.isArray(site.rules) && site.rules.length > 0) {
      site.rules.forEach((rule) => {
        rule.from.domain = site.domain;
        result.push(rule);

        aliases.forEach((alias) => {
          const newRule = cloneDeep(rule);
          newRule.from.domain = alias;
          result.push(newRule);
        });
      });
    }
  });

  return result;
};

Router._expandSites = expandSites; // eslint-disable-line no-underscore-dangle
Router._getRoutingTable = getRoutingTable; // eslint-disable-line no-underscore-dangle
Router._filterSites = filterSites; // eslint-disable-line no-underscore-dangle

module.exports = Router;
