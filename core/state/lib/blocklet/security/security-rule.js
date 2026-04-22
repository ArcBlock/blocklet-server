const Joi = require('joi');
const sortBy = require('lodash/sortBy');
const { BlockletEvents } = require('@blocklet/constant');
const {
  SECURITY_RULE_DEFAULT_ID,
  ACCESS_POLICY_PUBLIC,
  RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
} = require('@abtnode/constant');

const logger = require('@abtnode/logger')('@abtnode/core:blocklet:security');

const { _convertResponseHeaderPolicy } = require('./utils');
const { securityRuleSchema } = require('./validator');

const getBlockletSecurityRule = async ({ teamManager }, { did, id }) => {
  const { securityRuleState } = await teamManager.getSecurityState(did);
  const result = await securityRuleState.getSecurityRule(id);
  return result;
};
const getBlockletSecurityRules = async ({ teamManager }, { did, includeDisabled = false, formatted = false }) => {
  const { securityRuleState, accessPolicyState, responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const include = [
    {
      model: accessPolicyState.model,
      as: 'accessPolicy',
    },
    {
      model: responseHeaderPolicyState.model,
      as: 'responseHeaderPolicy',
    },
  ];
  const where = {};
  if (!includeDisabled) {
    where.enabled = true;
  }
  const result = await securityRuleState.model.findAll({ include, where });
  const securityRules = result.map((item) => {
    const resultItem = item.toJSON();
    if (resultItem.responseHeaderPolicy && !formatted) {
      resultItem.responseHeaderPolicy = _convertResponseHeaderPolicy(resultItem.responseHeaderPolicy);
    }
    return resultItem;
  });

  return {
    securityRules: sortBy(securityRules, (item) => {
      if (item.id === SECURITY_RULE_DEFAULT_ID) {
        return Infinity;
      }

      return item.priority;
    }),
    paging: null,
  };
};

// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function addBlockletSecurityRule({ teamManager }, { did, data }) {
  const { securityRuleState } = await teamManager.getSecurityState(did);
  const { value, error } = securityRuleSchema.validate(data);
  if (error) {
    logger.error('Failed to add blocklet security rule', {
      error,
      data,
    });
    throw error;
  }
  const result = await securityRuleState.addSecurityRule(value);
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}

function parseUpdateBlockletSecurityRule(data) {
  const { value, error } = securityRuleSchema
    .concat(
      Joi.object({
        id: Joi.string().required(),
        componentDid: Joi.when('id', {
          is: 'default',
          then: Joi.optional().strip(), // 当 id 为 'default' 时删除 componentDid 字段
          otherwise: securityRuleSchema.extract('componentDid'),
        }),
      })
    )
    .validate(data);
  return { value, error };
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function updateBlockletSecurityRule({ teamManager }, { did, data }) {
  const { securityRuleState } = await teamManager.getSecurityState(did);
  const { value, error } = parseUpdateBlockletSecurityRule(data);
  if (error) {
    logger.error('Failed to update blocklet security rule', {
      error,
      data,
    });
    throw error;
  }
  const [, [result]] = await securityRuleState.updateSecurityRule(value);
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function deleteBlockletSecurityRule({ teamManager }, { did, id }) {
  const { securityRuleState } = await teamManager.getSecurityState(did);
  const result = await securityRuleState.deleteSecurityRule({ id });
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}

const initializeDefaultData = async ({ teamManager }, { did }) => {
  const { securityRuleState } = await teamManager.getSecurityState(did);
  const insertData = [];
  let queryResult = null;
  queryResult = await securityRuleState.getSecurityRule(SECURITY_RULE_DEFAULT_ID);
  if (!queryResult) {
    insertData.push({
      id: SECURITY_RULE_DEFAULT_ID,
      remark: 'Default Security Rule',
      pathPattern: '*',
      accessPolicyId: ACCESS_POLICY_PUBLIC,
      responseHeaderPolicyId: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
      enabled: true,
      priority: -1,
    });
  }
  return securityRuleState.model.bulkCreate(insertData, { returning: true });
};

module.exports = {
  getBlockletSecurityRule,
  getBlockletSecurityRules,
  addBlockletSecurityRule,
  updateBlockletSecurityRule,
  deleteBlockletSecurityRule,
  initializeDefaultData,
  parseUpdateBlockletSecurityRule,
};
