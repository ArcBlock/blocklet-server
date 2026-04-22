export const ROLES = /* #__PURE__ */ Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',
});

export const SERVER_ROLES = /* #__PURE__ */ Object.freeze({
  ...ROLES,
  CI: 'ci',
  CERTIFICATE: 'certificate',

  // blocklet user or sdk. must start with 'blocklet-
  BLOCKLET_OWNER: 'blocklet-owner',
  BLOCKLET_ADMIN: 'blocklet-admin',
  BLOCKLET_MEMBER: 'blocklet-member',
  BLOCKLET_SDK: 'blocklet-sdk',

  // external user
  EXTERNAL_BLOCKLET_CONTROLLER: 'external-blocklet-controller',
  EXTERNAL_BLOCKLETS_MANAGER: 'external-blocklets-manager',
});

export const SERVICES_ROLES = /* #__PURE__ */ Object.freeze({
  BLOCKLET_GUEST: 'blocklet-guest',
});

export const BLOCKLET_ROLES = [
  SERVER_ROLES.BLOCKLET_OWNER,
  SERVER_ROLES.BLOCKLET_ADMIN,
  SERVER_ROLES.BLOCKLET_MEMBER,
  SERVER_ROLES.BLOCKLET_SDK,
];

export const isBlockletRole = (role) => role && BLOCKLET_ROLES.includes(role);
export const isSystemRole = (role) => role && ROLES[(role || '').toUpperCase()];

export const BLOCKLET_MULTIPLE_TENANT_ROLES = [
  SERVER_ROLES.BLOCKLET_OWNER,
  SERVER_ROLES.BLOCKLET_ADMIN,
  SERVER_ROLES.BLOCKLET_MEMBER,
  SERVER_ROLES.BLOCKLET_SDK,
  SERVICES_ROLES.BLOCKLET_GUEST,
];

export const isBlockletMultipleTenantRole = (role) => role && BLOCKLET_MULTIPLE_TENANT_ROLES.includes(role);

export const AUTH_CERT_TYPE = {
  USER: 'user',
  OWNERSHIP_NFT: 'ownership_nft',
  BLOCKLET_USER: 'blocklet_user',
  BLOCKLET_CONTROLLER: 'blocklet_controller',
};

export const RBAC_CONFIG = {
  roles: /* #__PURE__ */ Object.freeze([
    {
      name: SERVER_ROLES.OWNER,
      title: 'Owner',
      description: 'Has full administrative access to the Blocklet Server',
      passport: true,
    },
    {
      name: SERVER_ROLES.ADMIN,
      title: 'Admin',
      description:
        'Has full permissions to manage blocklet and Blocklet Server such as install/remove/start/stop blocklet, manage blocklet URL mapping and certificates, manage blocklet team, manage node integrations and access keys, upgrade node to a new version',
      passport: true,
    },
    {
      name: SERVER_ROLES.MEMBER,
      title: 'Member',
      description:
        'Has permissions to manage blocklets, such as install/remove/start/stop blocklet, manage blocklet URL mapping and certificates',
      passport: true,
    },
    {
      name: SERVER_ROLES.GUEST,
      title: 'Guest',
      description: 'Has all read permissions on Blocklet Server',
      passport: true,
    },
    {
      name: SERVER_ROLES.CI,
      title: 'CI',
      description: 'Deploy blocklet to Blocklet Server',
      passport: true,
      noHuman: true,
    },
    {
      name: SERVER_ROLES.CERTIFICATE,
      title: 'Certificate',
      description: 'Manage https certificates for blocklets on the Blocklet Server',
      noHuman: true,
    },
    {
      name: SERVER_ROLES.BLOCKLET_OWNER,
      title: 'Blocklet Owner',
    },
    {
      name: SERVER_ROLES.BLOCKLET_ADMIN,
      title: 'Blocklet Admin',
    },
    {
      name: SERVER_ROLES.BLOCKLET_MEMBER,
      title: 'Blocklet Member',
    },
    {
      name: SERVER_ROLES.BLOCKLET_SDK,
      title: 'Blocklet SDK',
    },
    {
      name: SERVER_ROLES.EXTERNAL_BLOCKLET_CONTROLLER,
      title: 'External Blocklet Controller',
    },
    {
      name: SERVER_ROLES.EXTERNAL_BLOCKLETS_MANAGER,
      title: 'External Blocklets Manager',
      description: 'Manage external blocklets in the Blocklet Server',
      noHuman: true,
    },
  ]),
  permissions: /* #__PURE__ */ Object.freeze([
    {
      name: 'query_node',
      description:
        'View node data, include dashboard and node settings, log stream for both Blocklet Server and blocklets',
    },
    {
      name: 'mutate_node',
      description: 'Change node settings, upgrade node to a new version',
    },
    {
      name: 'query_session',
      description: 'Get data from a long running session',
    },
    {
      name: 'mutate_session',
      description: 'Start/update/end a long running session',
    },
    {
      name: 'query_accessKey',
      description: 'View access keys for Blocklet Server',
    },
    {
      name: 'mutate_accessKey',
      description: 'Manage access keys for server and blocklets, such as create/update/delete',
    },
    {
      name: 'query_team',
      description: 'View team data(members/roles/permissions) for Blocklet Server and blocklets',
    },
    {
      name: 'mutate_team',
      description: 'Manage team data(members/roles/permissions) for Blocklet Server and blocklets',
    },
    {
      name: 'query_blocklets',
      description: 'View store and installed blocklets, including blocklet runtime configuration, domains and urls',
    },
    {
      name: 'mutate_blocklets',
      description: 'Perform state changing actions on blocklets, such as install/upgrade/config/start/stop/remove',
    },
    {
      name: 'query_router',
      description: 'View sites, URL mapping and certificates in service gateway',
    },
    {
      name: 'mutate_router',
      description: 'Manage sites, URL mapping and certificates in service gateway',
    },
    {
      name: 'query_certificate',
      description: 'View certificates in service gateway',
    },
    {
      name: 'mutate_certificate',
      description: 'Manage certificates in service gateway',
    },
    {
      name: 'query_notification',
      description: 'View notifications',
    },
    {
      name: 'mutate_notification',
      description: 'Manage notifications, such as mark notifications as read',
    },
    {
      name: 'query_webhook',
      description: 'View integrations',
    },
    {
      name: 'mutate_webhook',
      description: 'Manage integrations',
    },
    // query_blocklet, mutate_blocklet are only for blocklet members
    {
      name: 'query_blocklet',
      description: 'View a blocklet, including blocklet runtime configuration, domains and urls',
    },
    {
      name: 'mutate_blocklet',
      description: 'Perform state changing actions on a blocklet, such as upgrade/config/start/stop',
    },
  ]),
  grants: /* #__PURE__ */ Object.freeze({
    [SERVER_ROLES.GUEST]: [
      'query_blocklets',
      'query_router',
      'query_webhook',
      'query_notification',
      'query_team',
      'query_accessKey',
      'query_node',
      'query_session',
    ],
    [SERVER_ROLES.MEMBER]: [
      SERVER_ROLES.GUEST,
      'mutate_blocklets',
      'mutate_router',
      'mutate_notification',
      'mutate_session',
    ],
    [SERVER_ROLES.ADMIN]: [
      SERVER_ROLES.MEMBER,
      'mutate_team',
      'mutate_webhook',
      'mutate_accessKey',
      'mutate_node',
      'mutate_certificate',
    ],
    [SERVER_ROLES.OWNER]: [ROLES.ADMIN],
    [SERVER_ROLES.CI]: ['query_blocklets', 'mutate_blocklets'],
    [SERVER_ROLES.CERTIFICATE]: ['query_certificate', 'mutate_certificate'],

    // blocklet app or blocklet user
    [SERVER_ROLES.BLOCKLET_SDK]: [
      'query_team',
      'mutate_team',
      'query_blocklet',
      'query_accessKey',
      'mutate_accessKey',
      'mutate_blocklet',
    ],
    [SERVER_ROLES.BLOCKLET_OWNER]: [SERVER_ROLES.BLOCKLET_ADMIN],
    [SERVER_ROLES.BLOCKLET_ADMIN]: [
      SERVER_ROLES.BLOCKLET_MEMBER,
      'mutate_team',
      'mutate_accessKey',
      'mutate_blocklet',
      'mutate_notification',
    ],
    [SERVER_ROLES.BLOCKLET_MEMBER]: ['query_team', 'query_blocklet', 'query_notification', 'query_accessKey'],

    // external user
    [SERVER_ROLES.EXTERNAL_BLOCKLET_CONTROLLER]: ['query_blocklets', 'mutate_blocklets'],
    [SERVER_ROLES.EXTERNAL_BLOCKLETS_MANAGER]: ['query_blocklets', 'mutate_blocklets', 'query_node'],
  }),
};

export const genPermissionName = (resource, action = 'access') => `${action}_${resource.replace('_', '-')}`; // resource cannot include '_'

export const PASSPORT_STATUS = {
  VALID: 'valid',
  REVOKED: 'revoked',
  EXPIRED: 'expired',
};

export const WHO_CAN_ACCESS = /* #__PURE__ */ Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  INVITED: 'invited',
  ALL: 'all',
});

export const WHO_CAN_ACCESS_PREFIX_ROLES = 'roles:';
