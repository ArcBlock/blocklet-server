/* eslint-disable no-await-in-loop */

/**
 * Router manager is the business logic layer of router related, includes:
 * RoutingRuleState, HttpsCertState
 */
const https = require('https');
const path = require('path');
const dns = require('dns');
const fse = require('fs-extra');
const get = require('lodash/get');
const toLower = require('lodash/toLower');
const trim = require('lodash/trim');
const { EventEmitter } = require('events');
const uuid = require('uuid');
const isUrl = require('is-url');
const { joinURL } = require('ufo');
const cloneDeep = require('@abtnode/util/lib/deep-clone');
const normalizePathPrefix = require('@abtnode/util/lib/normalize-path-prefix');
const logger = require('@abtnode/logger')('@abtnode/core:router:manager');
const { getProvider } = require('@abtnode/router-provider');
const checkDomainMatch = require('@abtnode/util/lib/check-domain-match');
const { isDidDomain, isCustomDomain } = require('@abtnode/util/lib/url-evaluation');
const { isTopLevelDomain } = require('@abtnode/util/lib/domain');
const { EVENTS, WELLKNOWN_PING_PREFIX } = require('@abtnode/constant');
const { DOMAIN_FOR_IP_SITE, DOMAIN_FOR_DEFAULT_SITE, ROUTING_RULE_TYPES } = require('@abtnode/constant');
const {
  BLOCKLET_BUNDLE_FOLDER,
  BLOCKLET_DYNAMIC_PATH_PREFIX,
  BLOCKLET_INTERFACE_TYPE_WEB,
} = require('@blocklet/constant');
const { forEachComponentV2Sync, isGatewayBlocklet, getComponentId } = require('@blocklet/meta/lib/util');
const { fromPublicKey } = require('@ocap/wallet');
const { hasMountPoint } = require('@blocklet/meta/lib/engine');

const {
  validateAddSite,
  validateAddRule,
  validateEditRule,
  validateAddDomainAlias,
  validateUpdateSite,
} = require('../validators/router');
const { getProviderFromNodeInfo, findInterfaceByName, isCLI, findInterfacePortByName } = require('../util');
const { findWebInterface } = require('../util/blocklet');
const { attachRuntimeDomainAliases, ensureLatestInfo } = require('./helper');
const Router = require('./index');
const states = require('../states');
const {
  getDidFromDomainGroupName,
  updateNFTDomainRecord,
  revokeAndDeleteNFTDomainRecord,
  getAvailableGatewayPorts,
} = require('../util/router');
const checkDNS = require('../util/check-dns');

const checkPathPrefixInBlackList = (pathPrefix, extraBlackList = []) => {
  const blacklist = ['static', 'build', 'dist', 'assets', '.service', BLOCKLET_BUNDLE_FOLDER].concat(extraBlackList);
  const prefixBlacklist = ['_abtnode_'].concat(extraBlackList);
  if (blacklist.find((b) => normalizePathPrefix(pathPrefix) === normalizePathPrefix(b))) {
    throw new Error(`path prefix can't be one of these values: ${blacklist.join(', ')}`);
  }

  if (prefixBlacklist.find((b) => normalizePathPrefix(pathPrefix).startsWith(`/${b}`))) {
    throw new Error(`path prefix can't start with one of these values: ${prefixBlacklist.join(', ')}`);
  }
};

const normalizeRedirectUrl = (url) => {
  if (isUrl(url)) {
    return url;
  }

  return normalizePathPrefix(url);
};

/**
 * Check if a domain matches any pattern in ABT_NODE_MOCK_DID_NAMES
 * e.g. ABT_NODE_MOCK_DID_NAMES=example.com,*.abtnet.io
 * @param {string} domain - Domain to check
 * @returns {boolean} - Returns true if domain matches any pattern
 */
const isMockedDidDomain = (domain) => {
  if (!process.env.ABT_NODE_MOCK_DID_NAMES || !domain) {
    return false;
  }

  const mockedDidNames = process.env.ABT_NODE_MOCK_DID_NAMES.split(',').map((x) => x.trim());

  return mockedDidNames.some((mockDomain) => {
    // Exact match
    if (mockDomain === domain) {
      return true;
    }

    // Wildcard match (e.g. *.abtnet.io)
    if (mockDomain.startsWith('*.')) {
      const suffix = mockDomain.substring(1);
      return domain.endsWith(suffix) && domain.length > suffix.length;
    }

    return false; // Only support exact match and wildcard match
  });
};

class RouterManager extends EventEmitter {
  constructor({ certManager, dataDirs }) {
    super();
    this.dataDirs = dataDirs;
    this.certManager = certManager;

    // HACK: do not emit any events from CLI
    if (isCLI()) {
      this.emit = (name) => logger.debug('stopped router manager event in CLI', name);
    }
  }

  // ============================================================================================
  // Public API that can be call from GQL, should have the same signature: doXXX(params, context)
  // ============================================================================================

  // eslint-disable-next-line no-unused-vars
  async addRoutingSite({ site, skipCheckDynamicBlacklist = false, skipValidation = false }, context = {}) {
    logger.info('add site', { site });

    let newSite = site;
    if (!skipValidation) {
      newSite = await validateAddSite(site, context);
    }

    logger.info('new site', { newSite });

    if (await states.site.domainExists(newSite.domain)) {
      throw new Error(`Site ${newSite.domain} already exists`);
    }

    const dynamicPathBlackList = skipCheckDynamicBlacklist === true ? [] : await this.createDynamicPathBlackList();
    if (!newSite.rules) {
      newSite.rules = [];
    }

    // get root rules and child rules
    const rules = [];
    if (Array.isArray(newSite.rules)) {
      for (const rule of newSite.rules) {
        this.fixRootBlockletRule(rule);
        checkPathPrefixInBlackList(rule.from.pathPrefix, dynamicPathBlackList);
        rules.push(...(await this.getRulesForMutation(rule)));
      }
    }
    newSite.rules = rules;

    if (skipCheckDynamicBlacklist === false) {
      await this.validatePathPrefix(newSite.rules);
    }

    await this.validateRouterConfig('addRoutingSite', { site: newSite });

    const result = await states.site.add(newSite);
    await attachRuntimeDomainAliases({ sites: result, context, node: states.node });

    this.emit('router.site.created', result);
    return result;
  }

  // eslint-disable-next-line no-unused-vars
  async deleteRoutingSite({ id }, context = {}) {
    const site = await states.site.findOne({ id });
    if ([DOMAIN_FOR_IP_SITE, DOMAIN_FOR_DEFAULT_SITE].includes(site.domain)) {
      throw new Error('Cannot delete this site because it is protected');
    }

    const removedSiteCount = await states.site.remove({ id });

    if (removedSiteCount === 0) {
      throw new Error(`remove site ${id} failed`);
    }

    logger.info('router.site.removed', { id });
    this.emit('router.site.removed', id);
  }

  // eslint-disable-next-line no-unused-vars
  async updateRoutingSite(params, context = {}) {
    const site = await validateUpdateSite(params, context);
    const existed = await states.site.findOne({ id: site.id });
    if (!existed) {
      throw new Error('Cannot update non-existing site');
    }

    const updateSet = {};

    if (site.corsAllowedOrigins) {
      updateSet.corsAllowedOrigins = site.corsAllowedOrigins.filter((x) => x !== '__none__');
    }

    if (site.domain) {
      const newDomain = site.domain;
      const exist = await states.site.domainExists(newDomain);
      if (exist) {
        throw new Error(`Site ${newDomain} already exists`);
      }

      updateSet.domain = newDomain;
    }

    const updated = await states.site.update({ id: site.id }, { $set: updateSet });

    logger.info('router.site.updated', { site, updated });
    this.emit('router.site.updated', site.id);

    const dbSite = await states.site.findOne({ id: site.id });
    await attachRuntimeDomainAliases({ sites: dbSite, context, node: states.node });
    return dbSite;
  }

  /**
   *
   * @param {object} params
   * @param {string} params.domain
   * @returns
   */
  async isDidDomain({ domain } = {}) {
    if (!domain) {
      throw new Error('domain is required');
    }

    if (isMockedDidDomain(domain)) {
      return true;
    }

    const tempArray = toLower(domain).split('.');
    let domainTld = domain;
    if (tempArray.length > 2) {
      domainTld = tempArray.slice(tempArray.length - 2).join('.');
    }

    if (process.env.ABT_NODE_TEST_DNS_SERVER) {
      dns.setServers([process.env.ABT_NODE_TEST_DNS_SERVER]);
      logger.info('use test dns server', { server: process.env.ABT_NODE_TEST_DNS_SERVER });
    }

    const results = await dns.promises.resolveTxt(domainTld).catch(() => []);

    return !!results.find(
      (x) =>
        !!x.find((v) => {
          try {
            const [type, value] = v.split('=');
            if (type === 'dv') {
              const [sig, pk] = value.split('.');
              const wallet = fromPublicKey(pk);

              return wallet.verify(domainTld, sig);
            }

            return false;
          } catch (error) {
            // do nothing
            return false;
          }
        })
    );
  }

  async addDomainAlias(
    {
      id,
      domainAlias: tmpAlias,
      force,
      type,
      nftDid,
      chainHost,
      metadata: rawMetadata,
      inBlockletSetup = false,
      issueCert = true,
    },
    context = {}
  ) {
    // metadata is passed as a JSON string from the GraphQL layer
    let metadata;
    if (rawMetadata && typeof rawMetadata === 'string') {
      try {
        metadata = JSON.parse(rawMetadata);
      } catch {
        metadata = rawMetadata;
      }
    } else {
      metadata = rawMetadata;
    }

    const domainAlias = await validateAddDomainAlias(tmpAlias, context);
    const dbSite = await states.site.findOne({ id });
    if (!dbSite) {
      throw new Error(`site ${id} does not exist`);
    }

    if (type !== 'nft-domain' && type !== 'nft-domain-forwarding') {
      if (await this.isDidDomain({ domain: domainAlias })) {
        throw new Error(`domain ${domainAlias} is a did domain`);
      }
    }

    let domain = toLower(trim(domainAlias));
    if (type === 'nft-domain' && isTopLevelDomain(domain)) {
      domain = `www.${domain}`;
    }

    // check domain exists in site domain
    const mainDomainSiteCount = await states.site.count({
      domain,
    });

    if (mainDomainSiteCount > 0) {
      if (!force) {
        throw new Error(`${domain} already exists`);
      } else {
        throw new Error(`${domain} cannot be forced-added`);
      }
    }

    // check domain exists in site alias domain
    const aliasDomainSite = await states.site.findByDomainAlias(domain);
    if (aliasDomainSite) {
      // If alias exists on the same site, update it in place
      if (aliasDomainSite.id === id) {
        const doc = await states.site.findOne({ id });
        const updatedAliases = doc.domainAliases.map((alias) => {
          const aliasValue = typeof alias === 'object' ? alias.value : alias;
          if (toLower(aliasValue) === domain) {
            const updated = typeof alias === 'object' ? { ...alias } : { value: alias, isProtected: false };
            if (type) {
              updated.type = type;
            }
            if (type === 'nft-domain') {
              updated.nftDid = nftDid;
              updated.chainHost = chainHost;
            } else if (type === 'nft-domain-forwarding' && metadata) {
              updated.metadata = metadata;
            }
            return updated;
          }
          return alias;
        });

        await states.site.update({ id }, { $set: { domainAliases: updatedAliases } });
        logger.info('updated domain alias', { id, domain, type });

        const newSite = await states.site.findOne({ id });
        await attachRuntimeDomainAliases({ sites: newSite, context, node: states.node });

        const did = getDidFromDomainGroupName(newSite.domain);

        // Issue certificate for the updated domain alias
        if (issueCert) {
          logger.info('try to issue cert for updated alias', { domain, id });
          this.issueCert({ did, siteId: id, site: newSite, domain, inBlockletSetup, type })
            .then(() => {
              logger.info('try to issue cert done', { domain, id });
            })
            .catch((error) => {
              logger.error('try to issue cert failed', { error, domain, id });
            });
        }

        this.emit(EVENTS.UPDATE_DOMAIN_ALIAS, did);
        return newSite;
      }

      if (!force) {
        throw new Error(`${domain} already exists`);
      } else {
        await this.deleteDomainAlias({ id: aliasDomainSite.id, domainAlias: domain });
      }
    }

    const doc = await states.site.findOne({ id });
    const item = { value: domain, isProtected: false };
    if (type === 'nft-domain') {
      item.type = type;
      item.nftDid = nftDid;
      item.chainHost = chainHost;
    } else if (type === 'nft-domain-forwarding') {
      item.type = type;
      if (metadata) {
        item.metadata = metadata;
      }
    }

    await states.site.update({ id }, { $set: { domainAliases: [...doc.domainAliases, item] } });
    logger.info('added domain alias', { id, domain });

    const did = getDidFromDomainGroupName(doc.domain);
    if (type === 'nft-domain') {
      const didDomain = doc.domainAliases.find((x) => isDidDomain(x.value));
      const blocklet = await states.blocklet.getBlocklet(did);
      const nodeInfo = await states.node.read();

      await updateNFTDomainRecord({
        name: domain,
        value: didDomain.value,
        blocklet,
        nodeInfo,
        bindCap: context.bindDomainCap,
      });
      logger.info('update nft domain record', { domain, didDomain, nftDid, id });
    }

    if (issueCert) {
      logger.info('try to issue cert', { domain, id });
      this.issueCert({ did, siteId: id, site: doc, domain, inBlockletSetup, type })
        .then(() => {
          logger.info('try to issue cert done', { domain, id });
        })
        .catch((error) => {
          logger.error('try to issue cert failed', { error, domain, id });
        });
    }

    const newSite = await states.site.findOne({ id });
    await attachRuntimeDomainAliases({ sites: newSite, context, node: states.node });

    this.emit(EVENTS.UPDATE_DOMAIN_ALIAS, did);
    return newSite;
  }

  async deleteDomainAlias({ id, domainAlias: tmpAlias }, context = {}) {
    let domainAlias = await validateAddDomainAlias(tmpAlias, context);
    domainAlias = toLower(domainAlias);

    const dbSite = await states.site.findOne({ id });
    if (!dbSite) {
      throw new Error(`site ${id} does not exist`);
    }

    const toDelete = dbSite.domainAliases.find((x) => toLower(x.value) === domainAlias);

    dbSite.domainAliases = dbSite.domainAliases.filter((x) => {
      if (typeof x === 'string') {
        return toLower(x) !== domainAlias;
      }

      return toLower(x.value) !== domainAlias;
    });

    const updateResult = await states.site.update({ id }, { $set: { domainAliases: dbSite.domainAliases } });
    logger.debug('remove domain alias update result', { id, updateResult, domainAlias });

    await attachRuntimeDomainAliases({ sites: dbSite, context, node: states.node });

    if (toDelete?.type === 'nft-domain') {
      const blockletDid = getDidFromDomainGroupName(dbSite.domain);
      const blocklet = await states.blocklet.getBlocklet(blockletDid);
      const nodeInfo = await states.node.read();

      revokeAndDeleteNFTDomainRecord({ name: domainAlias, blocklet, nodeInfo })
        .then(() => logger.info('revoke and delete nft domain record', { domain: domainAlias, blockletDid, id }))
        .catch((error) =>
          logger.error('revoke and delete nft domain record failed', { error, domain: domainAlias, blockletDid, id })
        );
    }

    if (toDelete?.certificateId && toDelete?.isProtected === false) {
      this.certManager
        .remove({ id: toDelete.certificateId })
        .then(() =>
          logger.info('removed un-protected cert', { certificateId: toDelete.certificateId, domain: toDelete.value })
        )
        .catch((error) =>
          logger.error('remove un-protected cert failed', {
            error,
            certificateId: toDelete.certificateId,
            domain: toDelete.value,
          })
        );
    }

    this.emit(EVENTS.UPDATE_DOMAIN_ALIAS, getDidFromDomainGroupName(dbSite.domain));
    return dbSite;
  }

  async addRoutingRule(
    { id, rule: tempRule, skipCheckDynamicBlacklist = false, formatPathPrefix = true, skipValidation = false },
    context = {}
  ) {
    const { rule } = await validateAddRule({ id, rule: tempRule }, context);

    if (!formatPathPrefix) {
      rule.from.pathPrefix = tempRule.from.pathPrefix;
    }

    const dbSite = await states.site.findOne({ id });
    if (!dbSite) {
      throw new Error(`site ${id} does not exist`);
    }

    const dynamicPathBlackList = skipCheckDynamicBlacklist === true ? [] : await this.createDynamicPathBlackList();
    const originalPathPrefix = rule.from.pathPrefix;

    this.fixRootBlockletRule(rule);
    checkPathPrefixInBlackList(rule.from.pathPrefix, dynamicPathBlackList);

    if (Array.isArray(dbSite.rules)) {
      const existedRule = dbSite.rules.find((x) => x.from.pathPrefix === rule.from.pathPrefix);

      if (existedRule) {
        if (
          rule.from.pathPrefix === '/' &&
          rule.to.type === ROUTING_RULE_TYPES.BLOCKLET &&
          existedRule.to.type !== ROUTING_RULE_TYPES.BLOCKLET
        ) {
          // Do nothing
          // This is a special case that we allow a non-blocklet rule already exists in '/'
        } else {
          throw new Error(`addRoutingRule: path prefix '${originalPathPrefix}' already exists`);
        }
      }
    }

    await this.validatePathPrefix(rule);
    if (!skipValidation) {
      await this.validateRouterConfig('addRoutingRule', { id, rule });
    }

    // add child blocklet rules
    for (const x of await this.getRulesForMutation(rule)) {
      await states.site.addRuleToSite(id, x);
    }

    const newSite = await states.site.findOne({ id });
    await attachRuntimeDomainAliases({ sites: newSite, context, node: states.node });

    this.emit('router.rule.created', newSite);
    return newSite;
  }

  async addRoutingRuleToDefaultSite(rule) {
    const defaultSite = await states.site.findOne({ domain: DOMAIN_FOR_DEFAULT_SITE });
    if (!defaultSite) {
      throw new Error('default site does not exist');
    }

    return this.addRoutingRule({ id: defaultSite.id, rule });
  }

  async updateRoutingRule(
    { id, rule: tmpRule, skipProtectedRuleChecking = false, formatPathPrefix = true, skipValidation = false },
    context = {}
  ) {
    const { rule } = await validateEditRule({ id, rule: tmpRule }, context);

    if (!formatPathPrefix) {
      rule.from.pathPrefix = tmpRule.from.pathPrefix;
    }

    const dbSite = await states.site.findOne({ id });
    if (!dbSite) {
      throw new Error(`site ${id} does not exist`);
    }
    if (!dbSite.rules.find((x) => x.id === rule.id)) {
      throw new Error(`site ${id}, rule ${rule.id} does not exist`);
    }

    const dynamicPathBlackList = await this.createDynamicPathBlackList();
    const originalPathPrefix = rule.from.pathPrefix;

    this.fixRootBlockletRule(rule);
    checkPathPrefixInBlackList(rule.from.pathPrefix, dynamicPathBlackList);

    // Ensure path prefix is unique across the site
    const existedRule = dbSite.rules.find((x) => x.id !== rule.id && x.from.pathPrefix === rule.from.pathPrefix);
    if (existedRule) {
      throw new Error(`updateRoutingRule: path prefix '${originalPathPrefix}' already exists`);
    }

    // Ensure we are not updating protected rules
    const protectedRule = dbSite.rules.find((x) => x.id === rule.id && x.isProtected);
    if (protectedRule && skipProtectedRuleChecking === false) {
      throw new Error('Updating an system protected rule is forbidden');
    }

    await this.validatePathPrefix(rule);
    if (!skipValidation) {
      await this.validateRouterConfig('updateRoutingRule', { id, rule });
    }

    // update rules
    const newRules = [...dbSite.rules.filter((x) => x.id !== rule.id), ...(await this.getRulesForMutation(rule))];

    const updateResult = await states.site.update({ id }, { $set: { rules: newRules } });
    logger.info('update result', { updateResult });
    const newSite = await states.site.findOne({ id });

    await attachRuntimeDomainAliases({ sites: newSite, context, node: states.node });

    this.emit('router.rule.updated', newSite);

    return newSite;
  }

  async deleteRoutingRule({ id, ruleId }, context = {}) {
    const tmpRule = await states.site.getSiteByRuleId(id, ruleId);
    if (!tmpRule) {
      throw new Error(`rule item ${ruleId} in rule ${id} does not exist`);
    }

    // Ensure we are not deleting protected rules
    const protectedRule = tmpRule.rules.find((x) => x.id === ruleId && x.isProtected);
    if (protectedRule) {
      throw new Error('Deleting an system protected rule is forbidden');
    }

    // 只要有匹配到的查询条件，不管是否删除成功都不会返回 0，所以这里没用 update 的返回值
    const doc = await states.site.findOne({ id });
    if (doc.rules.some((x) => x.id === ruleId)) {
      const newRules = doc.rules.filter((x) => x.id !== ruleId);
      await states.site.update({ id }, { $set: { rules: newRules } });
    }

    logger.info('router.rule.removed', { id, ruleId });
    const newSite = await states.site.findOne({ id });

    await attachRuntimeDomainAliases({ sites: newSite, context, node: states.node });

    this.emit('router.rule.removed', newSite);
    return newSite;
  }

  // ============================================================================================
  // Internal API that are used by public APIs and called from CLI
  // ============================================================================================

  async createDynamicPathBlackList() {
    const info = await states.node.read();
    if (!info.routing.adminPath) {
      return [];
    }

    const blackList = [info.routing.adminPath];
    const blocklets = await states.blocklet.getBlocklets();
    blocklets.forEach((x) => {
      blackList.push(normalizePathPrefix(`/${info.routing.adminPath}/${x.meta.name}`));
      (x.meta.interfaces || [])
        .filter((f) => f.type === BLOCKLET_INTERFACE_TYPE_WEB)
        .forEach((f) => {
          blackList.push(normalizePathPrefix(`/${info.routing.adminPath}/${x.meta.name}/${f.name}`));
        });
    });

    return blackList.filter(Boolean);
  }

  // eslint-disable-next-line no-unused-vars
  async deleteRoutingRulesItemByDid({ did, ruleFilter }, context = {}) {
    logger.info('deleteRoutingRulesItemByDid.did', { did });
    const sites = await states.site.getSitesByBlocklet(did);
    if (!sites.length) {
      return false;
    }

    const tasks = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const site of sites) {
      site.rules = site.rules.filter((rule) => {
        if (rule.to.did !== did) {
          return true;
        }
        if (ruleFilter) {
          return !ruleFilter(rule); // delete rule that pass filter
        }
        return false;
      });

      tasks.push(states.site.update({ id: site.id }, { $set: { rules: site.rules } })); // eslint-disable-line no-underscore-dangle
    }

    const result = await Promise.all(tasks);
    logger.info('deleteRoutingRulesItemByDid.removed', { result });
    return sites.length > 0;
  }

  async getMatchedCert(domain) {
    const certs = await this.certManager.getAllNormal();
    const matchedCert = certs.find((cert) => this.isCertMatchedDomain(cert, domain));

    if (matchedCert) {
      return {
        id: matchedCert.id,
        domain: matchedCert.domain,
        issuer: matchedCert.meta.issuer,
        validFrom: matchedCert.meta.validFrom,
        validTo: matchedCert.meta.validTo,
      };
    }

    return null;
  }

  checkDomainDNS(domain, cnameDomain) {
    try {
      if (isCustomDomain(domain)) {
        return checkDNS(domain, cnameDomain);
      }

      return Promise.resolve({
        isDnsResolved: true,
        hasCname: true,
        cnameRecords: [cnameDomain],
        isCnameMatch: true,
      });
    } catch (error) {
      logger.error('check domain dns error', error?.message);
      return Promise.resolve({
        isDnsResolved: false,
        hasCname: false,
        cnameRecords: [],
        isCnameMatch: false,
      });
    }
  }

  async issueCert({ did, siteId, site, domain, inBlockletSetup = false, type }) {
    const didDomain = site.domainAliases.find((x) => isDidDomain(x.value));
    const [dnsValue, cert] = await Promise.all([
      this.checkDomainDNS(domain, didDomain?.value),
      this.getHttpsCert({ domain }),
    ]);

    // For nft-domain-forwarding, skip CNAME check since these domains use A records pointing directly to server IP
    const requireCnameMatch = type !== 'nft-domain-forwarding';

    // 自定义域名如果 DNS 未解析成功 或 CNAME 不匹配 或 已配置证书，则不自动颁发证书
    const shouldSkipCertIssue =
      isCustomDomain(domain) && (!dnsValue.isDnsResolved || (requireCnameMatch && !dnsValue.isCnameMatch) || !!cert);

    if (shouldSkipCertIssue) {
      const reasonFn = () => {
        if (cert) {
          return 'cert already exists';
        }

        if (!dnsValue.isDnsResolved) {
          return 'DNS not resolved';
        }

        if (!dnsValue.isCnameMatch) {
          return 'CNAME not match';
        }

        return 'unknown reason';
      };

      logger.warn('skip cert issue for domain alias', {
        cert,
        domain,
        dnsValue,
        reason: reasonFn(),
      });

      return;
    }

    // 延迟 3s, 需要等待的原因: Nginx Reload, DNS 生效
    await this.certManager.issue({ domain, did, siteId, inBlockletSetup }, { delay: 3000 });
    logger.info('issue cert for domain alias', { domain, did });
  }

  async getHttpsCert({ domain }) {
    const matchedCert = await this.getMatchedCert(domain);

    if (matchedCert) {
      return matchedCert;
    }

    return new Promise((resolve) => {
      const req = https.request(
        { host: domain, path: WELLKNOWN_PING_PREFIX, method: 'GET', timeout: 1000 * 10 },
        (res) => {
          try {
            const data = res.socket.getPeerCertificate();
            const cert = {
              issuer: {
                countryName: data.issuer.C,
                organizationName: data.issuer.O,
                commonName: data.issuer.CN,
              },
              validFrom: data.valid_from,
              validTo: data.valid_to,
            };
            resolve(cert);
          } catch {
            resolve(null);
          }
        }
      );

      req.on('error', () => resolve(null));
      req.end();
    });
  }

  isCertMatchedDomain(cert, domain = '') {
    return [cert.domain, ...(cert.meta?.sans || cert.sans || [])].some((d) => checkDomainMatch(d, domain));
  }

  // eslint-disable-next-line consistent-return
  async repopulateRouting({ sites }) {
    if (Array.isArray(sites) && sites.length) {
      const result = await states.site.remove({});
      logger.info('routing rules all removed', { result });
      await states.site.insertMany(sites.map((x) => ({ ...x, id: x.id })));
    }
  }

  async validatePathPrefix(rules) {
    const doValidate = async (rule) => {
      const {
        from: { pathPrefix },
        to: { did, interfaceName },
      } = rule;

      const blocklet = await states.blocklet.getBlocklet(did);
      if (!blocklet) {
        return new Error(`Can not add path prefix ${pathPrefix} for non-exist blocklet`);
      }

      if (pathPrefix === '/') {
        return true;
      }

      const found = findInterfaceByName(blocklet, interfaceName);
      if (!found) {
        return new Error(`The interface ${interfaceName} is not found on blocklet ${blocklet.meta.name}`);
      }

      if (found.prefix !== BLOCKLET_DYNAMIC_PATH_PREFIX && normalizePathPrefix(found.prefix) !== pathPrefix) {
        // eslint-disable-next-line max-len
        return new Error(`Can not add path prefix ${pathPrefix} for blocklet that can only mount on ${found.prefix}`); // prettier-ignore
      }

      return true;
    };

    const sites = Array.isArray(rules) ? rules : [rules];
    const results = await Promise.all(
      sites.filter((x) => x.to.type === ROUTING_RULE_TYPES.BLOCKLET).map((x) => doValidate(x))
    );
    const error = results.find((x) => x instanceof Error);
    if (error) {
      throw error;
    }
  }

  async validateRouterConfig(action, data) {
    logger.info('validateRouterConfig.start', { action, data });

    // get data from db
    const info = await states.node.read();
    const httpsEnabled = get(info, 'routing.https', true);

    const certificates = httpsEnabled ? await this.certManager.getAllNormal() : [];

    let site;
    if (data.site) {
      site = cloneDeep(data.site);
    } else if (data.id) {
      site = await states.site.getSiteById(data.id);
    }

    // mutate data by input
    const mutations = {
      addRoutingRule: ({ rule }) => {
        site.rules.push(rule);
      },
      updateRoutingRule: ({ rule }) => {
        site.rules = site.rules.map((x) => {
          if (x.id === rule.id) {
            return rule;
          }
          return x;
        });
      },
    };
    if (mutations[action]) {
      mutations[action](cloneDeep(data));
    }

    // get provider
    const providerName = getProviderFromNodeInfo(info);
    const Provider = getProvider(providerName);

    const tmpDir = path.join(this.dataDirs.tmp, `${providerName}-${Date.now()}`);
    fse.ensureDirSync(tmpDir);
    logger.info('validateRouterConfig.tmpDir', { tmpDir });

    const { httpPort, httpsPort } = await getAvailableGatewayPorts();
    logger.info('validateRouterConfig.gatewayPorts', { httpPort, httpsPort });

    // disable cache to reduce nginx reload time and memory consumption
    const provider = new Provider({
      configDir: tmpDir,
      cacheEnabled: false,
      httpPort,
      httpsPort,
    });
    const tempRouter = new Router({
      provider,
      getAllRoutingParams: async () => ({
        sites: await ensureLatestInfo([site]),
        certificates,
        commonHeaders: get(info, 'routing.headers', {}),
        services: [], // TODO: do we need to add some item here?
        nodeInfo: info,
      }),
    });

    await tempRouter.updateRoutingTable();
    try {
      await tempRouter.validateConfig();
      await fse.remove(tmpDir);
      logger.info('validateRouterConfig.done', { action, data });
    } catch (error) {
      // 如果出错，保留 Nginx 配置文件，方便定位问题
      logger.error('validateRouterConfig.failed', { error, action, data });
      throw error;
    }
  }

  fixRootBlockletRule(rule) {
    if (!rule.id) {
      rule.id = uuid.v4();
    }
    rule.from.pathPrefix = normalizePathPrefix(rule.from.pathPrefix);
    if (rule.to.type === ROUTING_RULE_TYPES.BLOCKLET) {
      // pathPrefix of root blocklet maybe changed to another prefix than '/', so use old groupPathPrefix first
      rule.from.groupPathPrefix = rule.from.groupPathPrefix || rule.from.pathPrefix;
      rule.to.componentId = rule.to.did;
    }
    if (rule.to.url) {
      rule.to.url = normalizeRedirectUrl(rule.to.url);
    }
  }

  /**
   * get all rules to be add or update to site from root rule
   * @param {*} rawRule
   */
  async getRulesForMutation(rawRule) {
    if (rawRule.to.type !== ROUTING_RULE_TYPES.BLOCKLET) {
      return [rawRule];
    }

    const rules = [];

    // get child rules
    const blocklet = await states.blocklet.getBlocklet(rawRule.to.did);

    // blocklet may be mounted in relative prefix (for old usage), so blockletPrefix may not be '/'
    // blocklet prefix is the origin pathPrefix in rawRule
    const blockletPrefix = normalizePathPrefix(rawRule.from.pathPrefix);

    // root component's mountPoint may not be '/'
    const rootComponentPrefix = joinURL(blockletPrefix, blocklet.mountPoint || '/');
    rawRule.from.pathPrefix = normalizePathPrefix(rootComponentPrefix);

    const isOccupiable = isGatewayBlocklet(blocklet.meta);
    if (!isOccupiable) {
      rules.push(rawRule);
    }

    forEachComponentV2Sync(blocklet, (component) => {
      const { meta } = component;
      if (hasMountPoint(meta) === false) {
        return;
      }

      const { mountPoint } = component;
      if (!mountPoint) {
        // 这个不一定是错误，因为有些 blocklet 可能没有 mount point
        logger.info(`mountPoint of child ${component.meta.name} does not exist`);
        // eslint-disable-next-line no-continue
        return;
      }

      const childWebInterface = findWebInterface(component);
      if (!childWebInterface) {
        // 这个不一定是错误，因为有些 blocklet 可能没有 web interface
        logger.info(`web interface of child ${component.meta.name} does not exist`);
        // eslint-disable-next-line no-continue
        return;
      }

      const pathPrefix = path.join(blockletPrefix, mountPoint);

      const occupied = normalizePathPrefix(pathPrefix) === normalizePathPrefix(rawRule.from.pathPrefix);

      if (occupied && !isOccupiable) {
        return;
      }

      // if is root path, child rule become root rule
      const childRule = {
        id: occupied ? rawRule.id : uuid.v4(),
        from: {
          pathPrefix: normalizePathPrefix(pathPrefix),
          groupPathPrefix: blockletPrefix,
        },
        to: {
          type: ROUTING_RULE_TYPES.BLOCKLET,
          port: findInterfacePortByName(component, childWebInterface.name),
          did: rawRule.to.did, // root component did
          interfaceName: rawRule.to.interfaceName, // root component interface
          componentId: getComponentId(component, [blocklet]),
        },
        isProtected: occupied ? rawRule.isProtected : true,
      };

      rules.push(childRule);
    });

    return rules;
  }
}

module.exports = RouterManager;
module.exports.isMockedDidDomain = isMockedDidDomain;
