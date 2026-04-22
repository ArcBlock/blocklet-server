export const VC_TYPE_BLOCKLET_PURCHASE = 'BlockletPurchaseCredential';
export const VC_TYPE_NODE_PASSPORT = 'ABTNodePassport';
export const VC_TYPE_GENERAL_PASSPORT = 'NFTPassport';

export const NFT_TYPE_SERVER_OWNERSHIP = 'BlockletServerOwnershipNFT';
export const NFT_TYPE_SERVERLESS = 'BlockletServerServerlessNFT';

export const OAUTH_ENDPOINTS = {
  AUTHORIZATION: '/authorize',
  TOKEN: '/token',
  REGISTRATION: '/register',
  REVOCATION: '/revoke',
  USERINFO: '/userinfo',
  JWKS: '/jwks',
  LOGOUT: '/logout',
};

export const OAUTH_CODE_TTL = 10 * 60; // 10 minutes
export const OAUTH_ACCESS_TOKEN_TTL = 24 * 60 * 60; // 1 day
export const OAUTH_REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days
export const OAUTH_CLIENT_SECRET_TTL = 30 * 24 * 60 * 60; // 90 days
export const OAUTH_SCOPES = {
  // User scopes
  'profile:read': 'Read your profile (name, email, avatar)',

  // Blocklet related scopes
  'blocklet:read': 'Read blocklet information and database',
  'blocklet:write': 'Manage blocklet components and configuration',
};

export const SESSION_TOKEN_STORAGE_KEY = 'login_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export const VERIFY_CODE_LENGTH = 6;
export const VERIFY_CODE_TTL = 30 * 60 * 1000;
export const VERIFY_SEND_TTL = 1 * 60 * 1000;

// methods that always require MFA verification
export const MFA_PROTECTED_METHODS = [
  'deleteBlocklet',
  'deleteComponent',
  'rotateSessionKey',
  'upgradeNodeVersion',
  'removeUser',
  'updateUserApproval',
  'deleteRoutingRule',
  'deleteDomainAlias',
  'deleteCertificate',
  'deleteAccessKey',
  'deleteWebHook',
  'deleteBlockletSecurityRule',
  'deleteBlockletResponseHeaderPolicy',
  'deleteBlockletAccessPolicy',
  'configVault',
  'removeOrgMember',
  'deleteOrg',
];

// these methods can skip ACCESS VERIFY
export const SKIP_ACCESS_VERIFY_METHODS = {
  makeAllNotificationsAsRead: true,
  readNotifications: true,
  unreadNotifications: true,
  launchBlockletByLauncher: true,
  launchBlockletWithoutWallet: true,
  backupBlocklet: true,
  destroySelf: true,
  connectToAigne: true,
  disconnectToAigne: true,
  verifyAigneConnection: true,
  connectToEndpoint: true,
  disconnectFromEndpoint: true,
};

export const PASSPORT_SOURCE = {
  INVITE: 'invite',
  ISSUE: 'issue',
  RECOVER: 'recover',
  TRUSTED: 'trusted',
};

export const PASSPORT_LOG_ACTION = {
  ISSUE: 'issue',
  REVOKE: 'revoke',
  APPROVE: 'approve',
  RECOVER: 'recover',
  LOGIN: 'login',
  EXPIRED: 'expired',
  USED: 'used',
};

export const PASSPORT_ISSUE_ACTION = {
  ISSUE_ON_INVITE: 'issueOnInvite',
  ISSUE_ON_LAUNCH: 'issueOnLaunch',
  ISSUE_ON_KYC: 'issueOnKyc',
  ISSUE_ON_RECOVER: 'issueOnRecover',
  ISSUE_ON_ROTATE_KEY_PAIR: 'issueOnRotateKeyPair',
  ISSUE_ON_TRANSFER: 'issueOnTransferPassportForBindWallet',
  ISSUE_ON_BLOCKLET_START: 'issueOnBlockletStart',
  ISSUE_ON_RECEIVE_TRANSFER_APP_OWNER: 'receiveTransferAppOwner',
  ISSUE_ON_AUTH0: 'issueOnAuth0',
  ISSUE_ON_SETUP_APP_OWNER: 'issueOnLaunchSetupAppOwner',
  ISSUE_ON_EXCHANGE_PASSPORT: 'issueOnExchangePassport',
  ISSUE_ON_TRUST_PASSPORT: 'issueOnTrustPassport',
};

export const AIGNE_CONFIG_ENCRYPT_SALT = 'AIGNE_CONFIG_ENCRYPT_SALT';
