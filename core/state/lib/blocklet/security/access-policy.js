const Joi = require('joi');
const { BlockletEvents } = require('@blocklet/constant');
const {
  ACCESS_POLICY_PUBLIC,
  ACCESS_POLICY_INVITED_ONLY,
  ACCESS_POLICY_OWNER_ONLY,
  ACCESS_POLICY_ADMIN_ONLY,
} = require('@abtnode/constant');

const logger = require('@abtnode/logger')('@abtnode/core:blocklet:security');
const { accessPolicySchema } = require('./validator');

const getBlockletAccessPolicy = async ({ teamManager }, { did, id }) => {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const result = await accessPolicyState.getAccessPolicy(id);
  return result;
};
const getBlockletAccessPolicies = async ({ teamManager }, { did }) => {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const result = await accessPolicyState.getAccessPolicies(undefined, undefined, {
    createdAt: -1,
  });

  return {
    accessPolicies: result,
    paging: null,
  };
};
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function addBlockletAccessPolicy({ teamManager }, { did, data }) {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const { value, error } = accessPolicySchema.validate(data);
  if (error) {
    logger.error('Failed to add blocklet security rule', {
      error,
      data,
    });
    throw error;
  }
  const result = await accessPolicyState.addAccessPolicy(value);
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function updateBlockletAccessPolicy({ teamManager }, { did, data }) {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const { value, error } = accessPolicySchema
    .concat(
      Joi.object({
        id: Joi.string().required(),
      })
    )
    .validate(data);
  if (error) {
    logger.error('Failed to add blocklet security rule', {
      error,
      data,
    });
    throw error;
  }
  const [, [result]] = await accessPolicyState.updateAccessPolicy(value);
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function deleteBlockletAccessPolicy({ teamManager }, { did, id }) {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const result = await accessPolicyState.deleteAccessPolicy({ id });
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}

const initializeDefaultData = async ({ teamManager }, { did }) => {
  const { accessPolicyState } = await teamManager.getSecurityState(did);
  const insertData = [];
  let queryResult = null;
  queryResult = await accessPolicyState.getAccessPolicy(ACCESS_POLICY_PUBLIC);
  if (!queryResult) {
    insertData.push({
      id: ACCESS_POLICY_PUBLIC,
      name: 'Public',
      description: 'Public access policy',
      roles: null,
      reverse: false,
      isProtected: true,
    });
  }
  queryResult = await accessPolicyState.getAccessPolicy(ACCESS_POLICY_INVITED_ONLY);
  if (!queryResult) {
    insertData.push({
      id: ACCESS_POLICY_INVITED_ONLY,
      name: 'Invite Only',
      description: 'Invite only access policy',
      roles: [],
      reverse: true,
      isProtected: true,
    });
  }
  queryResult = await accessPolicyState.getAccessPolicy(ACCESS_POLICY_ADMIN_ONLY);
  if (!queryResult) {
    insertData.push({
      id: ACCESS_POLICY_ADMIN_ONLY,
      name: 'Admin Only',
      description: 'Owner or admin access policy',
      roles: ['owner', 'admin'],
      reverse: false,
      isProtected: true,
    });
  }
  queryResult = await accessPolicyState.getAccessPolicy(ACCESS_POLICY_OWNER_ONLY);
  if (!queryResult) {
    insertData.push({
      id: ACCESS_POLICY_OWNER_ONLY,
      name: 'Owner Only',
      description: 'Owner access policy',
      roles: ['owner'],
      reverse: false,
      isProtected: true,
    });
  }
  return accessPolicyState.model.bulkCreate(insertData, { returning: true });
};

module.exports = {
  getBlockletAccessPolicy,
  getBlockletAccessPolicies,
  addBlockletAccessPolicy,
  updateBlockletAccessPolicy,
  deleteBlockletAccessPolicy,
  initializeDefaultData,
};
