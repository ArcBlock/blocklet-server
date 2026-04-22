// const logger = require('@abtnode/logger')('@abtnode/core:states:security-rule');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').SecurityRuleState>
 */
class SecurityRuleState extends BaseState {
  getSecurityRule(id) {
    return this.findOne({ id });
  }

  getSecurityRules(condition, selection, sort) {
    return this.find(condition, selection, sort);
  }

  addSecurityRule(rawData) {
    return this.insert(rawData);
  }

  updateSecurityRule(rawData) {
    const { id, ...params } = rawData;
    return this.updateById(id, params, { returnUpdatedDocs: true });
  }

  deleteSecurityRule({ id }) {
    return this.remove({ id });
  }
}

module.exports = SecurityRuleState;
