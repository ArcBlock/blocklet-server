const logger = require('@abtnode/logger')('@abtnode/core:states:site');
const { Op, Sequelize } = require('sequelize');
const { BLOCKLET_SITE_GROUP_SUFFIX } = require('@abtnode/constant');

const BaseState = require('./base');
const { getBlockletDomainGroupName } = require('../util/router');
const { validateUpdateDomainAliases } = require('../validators/router');

// type Site = {
//   id: string;
//   domain: string;
//   domainAliases: Array<{value: string, isProtected: boolean}>;
//   isProtected: boolean;
//   rules: Array<Rule>;
//   corsAllowedOrigins: Array<string>;
// };

/**
 * FIXME: some functions may not be performant
 * @extends BaseState<import('@abtnode/models').SiteState>
 */
class SiteState extends BaseState {
  async add(site) {
    const result = await this.insert(site);
    logger.info('site created', { site: result });
    return result;
  }

  async addRuleToSite(id, rule) {
    const { rules } = await this.findOne({ id });
    if (rules.indexOf(rule) === -1) {
      const [addedCount] = await this.update({ id }, { $set: { rules: [...rules, rule] } });
      logger.info('added rule to site', { count: addedCount });
      return addedCount;
    }

    return 0;
  }

  async getSites(...args) {
    let result = null;
    if (args.length === 0) {
      result = await this.find({});
    } else {
      result = await this.find(...args);
    }

    return SiteState.renameIdFiledName(result);
  }

  async getSystemSites() {
    const result = await this.find({
      where: {
        domain: {
          [Op.notLike]: `%${BLOCKLET_SITE_GROUP_SUFFIX}`,
        },
      },
    });
    return SiteState.renameIdFiledName(result);
  }

  async getSitesByBlocklet(did) {
    const sites = await this.getSites();
    return sites.filter((x) => x.rules.some((r) => r.to?.did === did));
  }

  getSiteById(id) {
    return this.findOne({ id });
  }

  async getSiteByRuleId(id, ruleId) {
    const site = await this.findOne({ id });
    if (site && site.rules.some((r) => r.id === ruleId)) {
      return site;
    }

    return null;
  }

  async getRuleById(id) {
    const sites = await this.getSites();
    const site = sites.find((x) => x.rules.some((r) => r.id === id));
    if (!site) {
      return null;
    }

    return site.rules.find((x) => x.id === id);
  }

  /**
   * Check if domain exists as primary domain or alias
   * Optimized: O(1) for primary domain, efficient DB query for alias
   * - PostgreSQL: Uses jsonb @> operator (can leverage GIN index)
   * - SQLite: Uses json_each and json_extract for reliable array element search
   */
  async domainExists(domain) {
    // Fast path: check if domain is a primary domain (indexed query)
    const byPrimaryDomain = await this.findOne({ domain });
    if (byPrimaryDomain) {
      return true;
    }

    const dialect = this.model.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL: Use jsonb @> operator for efficient array containment check
      // This can leverage GIN index on domainAliases if available
      // Use JSON.stringify to safely construct JSON, then escape single quotes for SQL
      const searchJson = JSON.stringify([{ value: domain }]).replace(/'/g, "''");
      const count = await this.count({
        where: Sequelize.literal(`"domainAliases" @> '${searchJson}'::jsonb`),
      });
      return count > 0;
    }

    // SQLite: Use json_each and json_extract for reliable array element search
    // This avoids issues with JSON formatting/spacing in LIKE queries
    const escapedDomain = domain.replace(/'/g, "''");
    const count = await this.count({
      where: Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM json_each("domainAliases")
          WHERE json_extract(value, '$.value') = '${escapedDomain}'
        )
      `),
    });

    return count > 0;
  }

  /**
   * Find site by domain alias
   * Optimized: O(1) for primary domain, efficient DB query for alias
   * - PostgreSQL: Uses jsonb @> operator (can leverage GIN index)
   * - SQLite: Uses json_each and json_extract for reliable array element search
   */
  async findByDomainAlias(domain) {
    // Fast path: check if it's actually a primary domain
    const byPrimaryDomain = await this.findOne({ domain });
    if (byPrimaryDomain) {
      return byPrimaryDomain;
    }

    const dialect = this.model.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL: Use jsonb @> operator for efficient array containment check
      // This can leverage GIN index on domainAliases if available
      // Use JSON.stringify to safely construct JSON, then escape single quotes for SQL
      const searchJson = JSON.stringify([{ value: domain }]).replace(/'/g, "''");
      const sites = await this.find({
        where: Sequelize.literal(`"domainAliases" @> '${searchJson}'::jsonb`),
      });
      return sites[0] || null;
    }

    // SQLite: Use json_each and json_extract for reliable array element search
    // This avoids issues with JSON formatting/spacing in LIKE queries
    const escapedDomain = domain.replace(/'/g, "''");
    const sites = await this.find({
      where: Sequelize.literal(`
        EXISTS (
          SELECT 1 FROM json_each("domainAliases")
          WHERE json_extract(value, '$.value') = '${escapedDomain}'
        )
      `),
    });

    return sites[0] || null;
  }

  findOneByBlocklet(did) {
    return this.findOne({ domain: getBlockletDomainGroupName(did) });
  }

  async getBlockletDomains(did) {
    const site = await this.findOneByBlocklet(did);
    return (site?.domainAliases || []).map((x) => x.value).filter(Boolean);
  }

  async updateDomainAliasList(id, domainAliases) {
    await validateUpdateDomainAliases(domainAliases);
    return super.update({ id }, { $set: { domainAliases } });
  }
}

module.exports = SiteState;
