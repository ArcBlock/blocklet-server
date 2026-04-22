const Joi = require('joi');
const { BlockletEvents } = require('@blocklet/constant');
const {
  RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
  RESPONSE_HEADER_POLICY_SIMPLE_CORS,
  RESPONSE_HEADER_POLICY_SECURITY_HEADER,
} = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:blocklet:security');

const { _convertResponseHeaderPolicy, _formatResponseHeaderPolicy } = require('./utils');
const { responseHeaderPolicySchema } = require('./validator');

const getBlockletResponseHeaderPolicy = async ({ teamManager }, { did, id, formatted = false }) => {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const result = await responseHeaderPolicyState.getResponseHeaderPolicy(id);
  return formatted ? result : _convertResponseHeaderPolicy(result);
};
const getBlockletResponseHeaderPolicies = async ({ teamManager }, { did, formatted = false }) => {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const result = await responseHeaderPolicyState.getResponseHeaderPolicies(undefined, undefined, {
    createdAt: -1,
  });
  const responseHeaderPolicies = result.map((item) => (formatted ? item : _convertResponseHeaderPolicy(item)));
  return {
    responseHeaderPolicies,
    paging: null,
  };
};
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function addBlockletResponseHeaderPolicy({ teamManager }, { did, data }) {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const { value, error } = responseHeaderPolicySchema.validate(data);
  if (error) {
    logger.error('Failed to add blocklet security rule', {
      error,
      data,
    });
    throw error;
  }
  const result = await responseHeaderPolicyState.addResponseHeaderPolicy(_formatResponseHeaderPolicy(value));
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return _convertResponseHeaderPolicy(result);
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function updateBlockletResponseHeaderPolicy({ teamManager }, { did, data, formatted = false }) {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const { value, error } = responseHeaderPolicySchema
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
  const result = await responseHeaderPolicyState.updateResponseHeaderPolicy(_formatResponseHeaderPolicy(value));
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return formatted ? result : _convertResponseHeaderPolicy(result);
}
// HACK: 由于需要使用 this.emit，所以这里不能使用箭头函数（尝试过传入 emit，会报错，目前只能这样）
async function deleteBlockletResponseHeaderPolicy({ teamManager }, { did, id }) {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const result = await responseHeaderPolicyState.deleteResponseHeaderPolicy({ id });
  this.emit(BlockletEvents.securityConfigUpdated, { did });
  return result;
}

const initializeDefaultData = async ({ teamManager }, { did }) => {
  const { responseHeaderPolicyState } = await teamManager.getSecurityState(did);
  const simpleCORS = {
    origin: {
      override: false,
      value: ['*'],
      smart: true,
    },
    methods: {
      override: false,
      value: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    },
    allowedHeaders: {
      override: false,
      value: ['*'],
    },
    exposedHeaders: {
      override: false,
      value: ['*'],
    },
    maxAge: {
      override: false,
    },
    optionsSuccessStatus: {
      override: false,
      value: 204,
    },
    preflightContinue: {
      override: false,
      value: false,
    },
    credentials: {
      override: false,
      value: false,
    },
  };
  const securityHeader = {
    contentSecurityPolicy: {
      override: false,
      value: false,
    },
    referrerPolicy: {
      override: false,
      value: false,
    },
    xFrameOptions: {
      override: false,
      value: {
        action: 'sameorigin',
      },
    },
    xPoweredBy: {
      override: false,
      value: true,
    },
    xXssProtection: {
      override: false,
      value: true,
    },
  };
  const insertData = [];
  let queryResult = null;
  queryResult = await responseHeaderPolicyState.getResponseHeaderPolicy(RESPONSE_HEADER_POLICY_SECURITY_HEADER);
  if (!queryResult) {
    insertData.push({
      id: RESPONSE_HEADER_POLICY_SECURITY_HEADER,
      name: 'Managed-Security-Header',
      description: 'Adds a set of security headers to every response',
      securityHeader,
      isProtected: true,
    });
  }
  queryResult = await responseHeaderPolicyState.getResponseHeaderPolicy(RESPONSE_HEADER_POLICY_SIMPLE_CORS);
  if (!queryResult) {
    insertData.push({
      id: RESPONSE_HEADER_POLICY_SIMPLE_CORS,
      name: 'Managed-SimpleCORS',
      description: 'Allows all origins for simple CORS requests',
      cors: simpleCORS,
      isProtected: true,
    });
  }
  queryResult = await responseHeaderPolicyState.getResponseHeaderPolicy(
    RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER
  );
  if (!queryResult) {
    insertData.push({
      id: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
      name: 'Managed-CORS-and-Security-Header',
      description: 'Allows all origins for simple CORS requests and adds security headers',
      cors: simpleCORS,
      securityHeader,
      isProtected: true,
    });
  }
  return responseHeaderPolicyState.model.bulkCreate(insertData, { returning: true });
};

module.exports = {
  getBlockletResponseHeaderPolicy,
  getBlockletResponseHeaderPolicies,
  addBlockletResponseHeaderPolicy,
  updateBlockletResponseHeaderPolicy,
  deleteBlockletResponseHeaderPolicy,
  initializeDefaultData,
};
