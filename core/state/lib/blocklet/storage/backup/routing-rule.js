const { outputJson } = require('fs-extra');
const { join } = require('path');
const { BLOCKLET_SITE_GROUP_SUFFIX } = require('@abtnode/constant');
const states = require('../../../states');
const { BaseBackup } = require('./base');
const { getFileObject } = require('../utils/disk');

class RoutingRuleBackup extends BaseBackup {
  filename = 'routing_rule.json';

  /**
   * @description
   * @readonly
   * @returns {string}
   * @memberof RoutingRuleBackup
   */
  get routingRuleExportPath() {
    return join(this.backupDir, this.filename);
  }

  /**
   * @description
   * @returns {Promise<void>}
   * @memberof RoutingRuleBackup
   */
  async export() {
    const routingRule = await states.site.findOne({
      domain: `${this.blocklet.meta.did}${BLOCKLET_SITE_GROUP_SUFFIX}`,
    });

    await outputJson(this.routingRuleExportPath, routingRule);
  }

  /**
   *
   * @returns {Promise<import('./base').SyncObject[]>}
   * @memberof RoutingRuleBackup
   */
  async collectSyncObjects() {
    await this.export();

    const objects = [getFileObject(this.routingRuleExportPath, this.backupDir)];

    return objects;
  }
}

module.exports = { RoutingRuleBackup };
