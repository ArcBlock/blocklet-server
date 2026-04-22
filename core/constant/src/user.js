export const WEB_WALLET_URL = 'https://web.abtwallet.io';

export const USER_AVATAR_DIR = '/.assets/avatar';
export const USER_AVATAR_URL_PREFIX = 'bn://avatar';
export const USER_AVATAR_PATH_PREFIX = '/user/avatar';
export const USER_MAX_INVITE_DEPTH = 8;

export const USER_TYPE = /* #__PURE__ */ Object.freeze({
  DERIVED: 'derived',
  WALLET: 'wallet',
});

export const MAX_USER_PAGE_SIZE = 100;

export const USER_PROFILE_SYNC_FIELDS = [
  'action', // indicates the action on this user
  'did',
  'pk',
  'avatar',
  'fullName',
  'locale',
  'email',
  'connectedAccount',
  'disconnectedAccount',
  'sourceAppPid',
  'inviter',
  'generation',
  'emailVerified',
  'phoneVerified',
  'metadata',
  'address',
  'extra',
  'name',
];

export const SITE_SYNC_FIELDS = [
  'action',
  'appId',
  'appPid',
  'aliasDid',
  'appName',
  'appDescription',
  'appUrl',
  'aliasDomain',
  'appLogo',
  'appLogoRect',
  'appliedAt',
  'did',
  'pk',
  'serverId',
  'serverVersion',
  'version',
  'isMaster',
  'status',
];

export const UNOWNED_DID = 'z'.repeat(35);
