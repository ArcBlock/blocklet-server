/* eslint-disable @typescript-eslint/quotes */
import {
  SECURITY_RULE_DEFAULT_ID,
  ACCESS_POLICY_INVITED_ONLY,
  ACCESS_POLICY_OWNER_ONLY,
  ACCESS_POLICY_ADMIN_ONLY,
  ACCESS_POLICY_PUBLIC,
  RESPONSE_HEADER_POLICY_SIMPLE_CORS,
  RESPONSE_HEADER_POLICY_SECURITY_HEADER,
  RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
} from '@abtnode/constant';
import { type QueryInterface, QueryTypes } from 'sequelize';

async function getDefaultAccessPolicies({ context }: { context: QueryInterface }) {
  const result = [];
  let queryResults = [];
  queryResults = await context.sequelize.query(`SELECT * from access_policies where id = '${ACCESS_POLICY_PUBLIC}'`, {
    type: QueryTypes.SELECT,
  });
  if (!queryResults?.[0]) {
    result.push({
      id: ACCESS_POLICY_PUBLIC,
      name: 'Public',
      description: 'Public access policy',
      roles: null,
      reverse: false,
      isProtected: true,
    });
  }
  queryResults = await context.sequelize.query(
    `SELECT * from access_policies where id = '${ACCESS_POLICY_INVITED_ONLY}'`,
    {
      type: QueryTypes.SELECT,
    }
  );
  if (!queryResults?.[0]) {
    result.push({
      id: ACCESS_POLICY_INVITED_ONLY,
      name: 'Invite Only',
      description: 'Invite only access policy',
      roles: JSON.stringify([]),
      reverse: true,
      isProtected: true,
    });
  }
  queryResults = await context.sequelize.query(
    `SELECT * from access_policies where id = '${ACCESS_POLICY_ADMIN_ONLY}'`,
    {
      type: QueryTypes.SELECT,
    }
  );
  if (!queryResults?.[0]) {
    result.push({
      id: ACCESS_POLICY_ADMIN_ONLY,
      name: 'Admin Only',
      description: 'Owner or admin access policy',
      roles: JSON.stringify(['owner', 'admin']),
      reverse: false,
      isProtected: true,
    });
  }
  queryResults = await context.sequelize.query(
    `SELECT * from access_policies where id = '${ACCESS_POLICY_OWNER_ONLY}'`,
    {
      type: QueryTypes.SELECT,
    }
  );
  if (!queryResults?.[0]) {
    result.push({
      id: ACCESS_POLICY_OWNER_ONLY,
      name: 'Owner Only',
      description: 'Owner access policy',
      roles: JSON.stringify(['owner']),
      reverse: false,
      isProtected: true,
    });
  }

  return result;
}

async function getDefaultResponseHeaderPolicies({ context }: { context: QueryInterface }) {
  const result = [];
  let queryResults = [];
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

  queryResults = await context.sequelize.query(
    `SELECT * from response_header_policies where id = '${RESPONSE_HEADER_POLICY_SECURITY_HEADER}'`,
    {
      type: QueryTypes.SELECT,
    }
  );
  if (!queryResults?.[0]) {
    result.push({
      id: RESPONSE_HEADER_POLICY_SECURITY_HEADER,
      name: 'Managed-Security-Header',
      description: 'Adds a set of security headers to every response',
      // NOTICE: 必须使用 stringify 处理才能正常插入数据，具体原因未知
      securityHeader: JSON.stringify(securityHeader),
      isProtected: true,
    });
  }
  queryResults = await context.sequelize.query(`SELECT * from response_header_policies where id = :id`, {
    type: QueryTypes.SELECT,
    replacements: { id: RESPONSE_HEADER_POLICY_SIMPLE_CORS },
  });
  if (!queryResults?.[0]) {
    result.push({
      id: RESPONSE_HEADER_POLICY_SIMPLE_CORS,
      name: 'Managed-SimpleCORS',
      description: 'Allows all origins for simple CORS requests',
      cors: JSON.stringify(simpleCORS),
      isProtected: true,
    });
  }

  queryResults = await context.sequelize.query(`SELECT * from response_header_policies where id = :id`, {
    type: QueryTypes.SELECT,
    replacements: { id: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER },
  });
  if (!queryResults?.[0]) {
    result.push({
      id: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
      name: 'Managed-CORS-and-Security-Header',
      description: 'Allows all origins for simple CORS requests and adds security headers',
      cors: JSON.stringify(simpleCORS),
      securityHeader: JSON.stringify(securityHeader),
      isProtected: true,
    });
  }

  return result;
}

async function getDefaultSecurityRules({ context }: { context: QueryInterface }) {
  const result = [];
  const [queryResult] = await context.sequelize.query("SELECT * from security_rules where id = 'default'", {
    type: QueryTypes.SELECT,
  });
  if (!queryResult) {
    result.push({
      id: SECURITY_RULE_DEFAULT_ID,
      remark: 'Default Security Rule',
      pathPattern: '*',
      accessPolicyId: ACCESS_POLICY_PUBLIC,
      responseHeaderPolicyId: RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER,
      enabled: true,
      priority: -1,
    });
  }
  return result;
}

export const up = async ({ context }: { context: QueryInterface }) => {
  const responseHeaderPolicies = await getDefaultResponseHeaderPolicies({ context });
  const accessPolicies = await getDefaultAccessPolicies({ context });
  const securityRules = await getDefaultSecurityRules({ context });

  // NOTICE: bulkInsert 不支持插入空的数组，会导致报错
  if (responseHeaderPolicies.length > 0) await context.bulkInsert('response_header_policies', responseHeaderPolicies);
  if (accessPolicies.length > 0) await context.bulkInsert('access_policies', accessPolicies);
  if (securityRules.length > 0) await context.bulkInsert('security_rules', securityRules);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const down = async ({ context }: { context: QueryInterface }) => {};
