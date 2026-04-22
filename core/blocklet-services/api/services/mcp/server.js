// eslint-disable-next-line import/no-unresolved
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const path = require('path');
const { initDbhubServer } = require('@blocklet/dbhub');
const logger = require('../../libs/logger')('mcp:server');

const { version } = require('../../../package.json');

/**
 * @typedef {'loginToken' | 'componentCall' | 'signedToken'} AuthMethod
 */

/**
 * @typedef {Object} SessionUser
 * @property {string} did - The DID of the user
 * @property {string} role - The role of the user
 * @property {string} provider - The provider of the user
 * @property {AuthMethod} [method] - The authentication method used
 * @property {unknown} [key: string] - Additional properties
 */

/**
 * @typedef {Object} AccessPolicy
 * @property {Object} [allow] - Allow rules
 * @property {string[]} [allow.dids] - List of allowed DIDs
 * @property {string[]} [allow.roles] - List of allowed roles
 * @property {string[]} [allow.providers] - List of allowed providers
 * @property {AuthMethod[]} [allow.methods] - List of allowed authentication methods
 * @property {Object} [deny] - Deny rules
 * @property {string[]} [deny.dids] - List of denied DIDs
 * @property {string[]} [deny.roles] - List of denied roles
 * @property {string[]} [deny.providers] - List of denied providers
 * @property {AuthMethod[]} [deny.methods] - List of denied authentication methods
 */

/**
 * Checks if a user has permission based on the access policy
 * @param {object} context - The authorization context to check against
 * @param {AccessPolicy} [policy] - The access policy to check against
 * @returns {boolean} - Whether the user has permission
 */
function checkPermissions(context, policy) {
  if (!policy) {
    return true;
  }

  const user = context.user || null;
  logger.debug('checkPermissions', { user });
  if (!user) {
    return false;
  }

  // Check deny rules first
  if (policy.deny) {
    logger.debug('checkPermissions has deny rules', { policy });
    // Check denied DIDs
    if (policy.deny.dids && policy.deny.dids.includes(user.did)) {
      logger.debug('checkPermissions denied DIDs', { policy });
      return false;
    }

    // Check denied roles
    if (policy.deny.roles && policy.deny.roles.includes(user.role.replace('blocklet-', ''))) {
      logger.debug('checkPermissions denied roles', { policy });
      return false;
    }

    // Check denied providers
    if (policy.deny.providers && policy.deny.providers.includes(user.provider)) {
      logger.debug('checkPermissions denied providers', { policy });
      return false;
    }

    // Check denied auth methods
    if (user.method && policy.deny.methods && policy.deny.methods.includes(user.method)) {
      logger.debug('checkPermissions denied auth methods', { policy });
      return false;
    }
  }

  // Check allow rules
  if (policy.allow) {
    let isAllowed = false;
    logger.debug('checkPermissions has allow rules', { policy });
    // If no allow rules are specified, default to allowed
    if (!policy.allow.dids && !policy.allow.roles && !policy.allow.providers && !policy.allow.methods) {
      logger.debug('checkPermissions default to allowed', { policy });
      isAllowed = true;
    } else {
      // Check allowed DIDs
      if (policy.allow.dids && policy.allow.dids.includes(user.did)) {
        logger.debug('checkPermissions allowed DIDs', { policy });
        isAllowed = true;
      }

      // Check allowed roles
      if (policy.allow.roles && policy.allow.roles.includes(user.role.replace('blocklet-', ''))) {
        logger.debug('checkPermissions allowed roles', { policy });
        isAllowed = true;
      }

      // Check allowed providers
      if (policy.allow.providers && policy.allow.providers.includes(user.provider)) {
        logger.debug('checkPermissions allowed providers', { policy });
        isAllowed = true;
      }

      // Check allowed auth methods
      if (user.method && policy.allow.methods && policy.allow.methods.includes(user.method)) {
        logger.debug('checkPermissions allowed auth methods', { policy });
        isAllowed = true;
      }
    }

    return isAllowed;
  }

  // If no rules specified, default to allowed
  return true;
}

function wrapToolHandler(handler, policy) {
  return async (...input) => {
    const extra = input[input.length - 1];
    const hasPermission = await checkPermissions(extra.authInfo?.extra || {}, policy);
    logger.debug('hasPermission', { hasPermission });

    if (!hasPermission) {
      throw new Error('Unauthorized');
    }

    return handler(...input);
  };
}

function initMcpServer(node) {
  const server = new McpServer({
    name: 'Blocklet Service',
    version,
  });

  initDbhubServer(
    server,
    wrapToolHandler(
      async (extra) => {
        if (!extra?.authInfo?.extra?.blockletDid) {
          throw new Error('blockletDid is required');
        }

        const blocklet = await node.getBlocklet({ did: extra.authInfo?.extra?.blockletDid, useCache: true });
        if (!blocklet) {
          throw new Error('blocklet not found');
        }

        return `sqlite://${path.join(blocklet.env.dataDir, 'blocklet.db')}`;
      },
      {
        allow: {
          roles: ['owner', 'admin', 'member'],
        },
      }
    )
  );

  return server;
}

module.exports = {
  initMcpServer,
  checkPermissions,
  wrapToolHandler,
};
