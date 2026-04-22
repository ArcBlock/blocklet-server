import { WHO_CAN_ACCESS } from '@abtnode/constant';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

// 这个函数是 convertParams 反转的实现，用于将数据库的数据转化为页面表单能消费的数据
export const formartAccessPolicyParams = (params) => {
  const result = {
    name: params.name,
    description: params.description,
  };
  const { roles = null, reverse } = params;
  if (roles === null) {
    if (reverse === false) {
      result.whoCanAccess = WHO_CAN_ACCESS.ALL;
      result.roles = null;
    }
  } else if (roles.length === 0 && reverse === true) {
    result.whoCanAccess = WHO_CAN_ACCESS.INVITED;
    result.roles = [];
  } else if (isEqual(roles, [WHO_CAN_ACCESS.OWNER]) && reverse === false) {
    result.whoCanAccess = WHO_CAN_ACCESS.OWNER;
    result.roles = [WHO_CAN_ACCESS.OWNER];
  } else if (isEqual(roles, [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN]) && reverse === false) {
    result.whoCanAccess = WHO_CAN_ACCESS.ADMIN;
    result.roles = [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN];
  } else {
    result.whoCanAccess = reverse ? 'roles_reverse' : 'roles';
    result.roles = roles;
  }
  return result;
};

// 将页面表单的数据转化为数据库能存储的数据
export const convertAccessPolicyParams = (params) => {
  const result = {
    name: params.name,
    description: params.description,
  };
  const { roles = null, whoCanAccess } = params;
  if (whoCanAccess === 'roles') {
    result.roles = roles;
    result.reverse = false;
  } else if (whoCanAccess === 'roles_reverse') {
    result.roles = roles;
    result.reverse = true;
  } else if (whoCanAccess === WHO_CAN_ACCESS.ALL) {
    result.roles = null;
    result.reverse = false;
  } else if (whoCanAccess === WHO_CAN_ACCESS.INVITED) {
    result.roles = [];
    result.reverse = true;
  } else if (whoCanAccess === WHO_CAN_ACCESS.OWNER) {
    result.roles = [WHO_CAN_ACCESS.OWNER];
    result.reverse = false;
  } else if (whoCanAccess === WHO_CAN_ACCESS.ADMIN) {
    result.roles = [WHO_CAN_ACCESS.OWNER, WHO_CAN_ACCESS.ADMIN];
    result.reverse = false;
  }
  return result;
};

export const formatCORSParams = (params) => {
  if (!(params instanceof Object)) return undefined;
  const result = {
    origin: params.origin
      ? {
          override: params.origin?.override ?? true,
          value: params.origin?.value?.join('\n'),
          smart: params.origin?.smart ?? true,
        }
      : undefined,
    methods: params.methods,
    allowedHeaders: params.allowedHeaders
      ? {
          override: params.allowedHeaders?.override ?? true,
          value: params.allowedHeaders?.value?.join('\n'),
        }
      : undefined,
    exposedHeaders: params.exposedHeaders
      ? {
          override: params.exposedHeaders?.override ?? true,
          value: params.exposedHeaders?.value?.join('\n'),
        }
      : undefined,
    maxAge: params.maxAge,
    optionsSuccessStatus: params.optionsSuccessStatus,
    preflightContinue: params.preflightContinue,
    credentials: params.credentials,
  };
  return result;
};

export const convertCORSParams = (params) => {
  if (!(params instanceof Object)) return undefined;
  const result = {
    origin: {
      override: params.origin?.override,
      value: params.origin?.value?.split('\n').filter((x) => x),
      smart: params.origin?.smart,
    },
    methods: params.methods,
    allowedHeaders: {
      override: params.allowedHeaders?.override,
      value: params.allowedHeaders?.value?.split('\n').filter((x) => x),
    },
    exposedHeaders: {
      override: params.exposedHeaders?.override,
      value: params.exposedHeaders?.value?.split('\n').filter((x) => x),
    },
    maxAge: params.maxAge,
    optionsSuccessStatus: params.optionsSuccessStatus,
    preflightContinue: params.preflightContinue,
    credentials: params.credentials,
  };
  return result;
};

export const formatHeaderParams = (params) => {
  if (!(params instanceof Object)) return undefined;
  const result = {
    contentSecurityPolicy: params.contentSecurityPolicy,
    referrerPolicy: params.referrerPolicy,
    xFrameOptions: params.xFrameOptions,
    xPoweredBy: params.xPoweredBy,
    xXssProtection: params.xXssProtection,
  };
  return result;
};
export const convertHeaderParams = (params) => {
  if (!(params instanceof Object)) return undefined;
  const result = {
    contentSecurityPolicy: params.contentSecurityPolicy,
    referrerPolicy: params.referrerPolicy,
    xFrameOptions: params.xFrameOptions,
    xPoweredBy: params.xPoweredBy,
    xXssProtection: params.xXssProtection,
  };
  return result;
};

export const formatResponseHeaderPolicy = (data) => {
  const result = cloneDeep(data);
  if (data.securityHeader) {
    try {
      result.securityHeader = JSON.parse(data.securityHeader);
    } catch {
      result.securityHeader = null;
    }
  }
  if (data.cors) {
    try {
      result.cors = JSON.parse(data.cors);
    } catch {
      result.cors = null;
    }
  }
  return result;
};
export const convertResponseHeaderPolicy = (data) => {
  const result = cloneDeep(data);
  if (result.cors) {
    result.cors = JSON.stringify(result.cors);
  }
  if (result.securityHeader) {
    result.securityHeader = JSON.stringify(result.securityHeader);
  }
  return result;
};
