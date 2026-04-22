// const logger = require('@abtnode/logger')('@abtnode/core:states:response-header-policy');
const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').ResponseHeaderPolicyState>
 */
class ResponseHeaderPolicyState extends BaseState {
  getResponseHeaderPolicy(id) {
    return this.findOne({ id });
  }

  getResponseHeaderPolicies(condition, selection, sort) {
    return this.find(condition, selection, sort);
  }

  addResponseHeaderPolicy(rawData) {
    return this.insert(rawData);
  }

  updateResponseHeaderPolicy(rawData) {
    const { id, ...params } = rawData;
    return this.updateById(id, params, { returnUpdatedDocs: true });
  }

  deleteResponseHeaderPolicy({ id }) {
    return this.remove({ id });
  }
}

module.exports = ResponseHeaderPolicyState;
