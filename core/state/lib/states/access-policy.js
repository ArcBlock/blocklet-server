// const logger = require('@abtnode/logger')('@abtnode/core:states:access-policy');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').AccessPolicyState>
 */
class AccessPolicyState extends BaseState {
  getAccessPolicy(id) {
    return this.findOne({ id });
  }

  getAccessPolicies(condition, selection, sort) {
    return this.find(condition, selection, sort);
  }

  addAccessPolicy(params) {
    return this.insert(params);
  }

  updateAccessPolicy({ id, ...params }) {
    return this.updateById(id, params, { returnUpdatedDocs: true });
  }

  deleteAccessPolicy({ id }) {
    return this.remove({ id });
  }
}

module.exports = AccessPolicyState;
