import SUPPORTED_LANGUAGES, { baseLanguages } from './languages';

export { SUPPORTED_LANGUAGES, baseLanguages };

export {
  ALLOW_VERIFY_PROVIDERS,
  LOGIN_PROVIDER,
  PROVIDER_NAME,
  OAUTH_PROVIDER_PUBLIC_FIELDS,
  BUILTIN_PROVIDER_PUBLIC_FIELDS,
} from './login';

/* eslint-disable @typescript-eslint/indent */
type StringNumberObject = { [key: string]: number };

export const ABT_NODE_KERNEL_OR_BLOCKLET_MODE = Object.freeze({
  NORMAL: 'normal',
  PERFORMANT: 'performant',
});

const fromEntry =
  (entries: StringNumberObject) =>
  (v: number | string): string => {
    const match = Object.entries(entries).find((x) => x[1] === Number(v));
    return match ? match[0] : 'unknown';
  };

// deprecated: toEntry is same as fromEntry
const toEntry =
  (entries: StringNumberObject) =>
  (v: number | string): string =>
    Object.keys(entries).find((x) => entries[x] === Number(v));

// Blocklet Status

export const BlockletStatus = Object.freeze({
  added: 0,
  downloading: 1,
  downloaded: 2, // Deprecated
  installing: 3,
  installed: 4,
  starting: 5,
  running: 6,
  stopping: 7,
  stopped: 8,
  error: 9,
  upgrading: 10,
  restarting: 11, // Deprecated
  corrupted: 12,
  waiting: 13,
  deleted: 14,
});

export const BLOCKLET_CONTROLLER_STATUS = {
  normal: 0,
  suspended: 10,
};

export const SUSPENDED_REASON = {
  expired: 'expired',
};

export const fromBlockletStatus = fromEntry(BlockletStatus);
export const toBlockletStatus = toEntry(BlockletStatus); // deprecated

// Blocklet Source

export const BlockletSource: StringNumberObject = Object.freeze({
  // Installed from Blocklet Store
  registry: 0,

  // Installed from local development source folder
  local: 1,

  // Installed from uploading bundle directly
  upload: 2,

  // Installed from a url (similar to Blocklet Store)
  url: 3,

  // Installed by custom creation
  custom: 4,
});

export const fromBlockletSource = fromEntry(BlockletSource);
export const toBlockletSource = toEntry(BlockletSource); // deprecated

// Blocklet Group(Type)

export const BlockletGroup = Object.freeze({
  // Only static website
  // The website is served by by Blocklet Server at runtime
  static: 'static',

  // The runtime instance is provided by its own backend server
  dapp: 'dapp',

  // This type is used to combine other component blocklets
  // No instance will be spawned at runtime
  gateway: 'gateway',

  // This type is used to pack other blocklets
  // No instance will be spawned at runtime
  // The difference is that a pack is a component in an app, whereas a gateway is an app itself.
  pack: 'pack',
});

export const BLOCKLET_GROUPS = ['dapp', 'static', 'gateway', 'pack'];

// Blocklet Events

export const BlockletEvents = Object.freeze({
  // status updated
  added: 'blocklet.added',
  downloadFailed: 'blocklet.downloadFailed',
  installed: 'blocklet.installed',
  installFailed: 'blocklet.installFailed',
  upgraded: 'blocklet.upgraded', // only for internal use (refresh router)
  removed: 'blocklet.removed',
  started: 'blocklet.started',
  startFailed: 'blocklet.startFailed',
  stopped: 'blocklet.stopped',
  statusChange: 'blocklet.statusChange',
  dataCleaned: 'blocklet.dataCleaned',
  componentInstalled: 'blocklet.componentInstalled',
  componentInstallFailed: 'blocklet.componentInstallFailed',
  componentUpgraded: 'blocklet.componentUpgraded',
  componentUpgradeFailed: 'blocklet.componentUpgradeFailed',
  componentRemoved: 'blocklet.componentRemoved',

  // Disable automatic backup
  disableAutoBackup: 'blocklet.disableAutoBackup',

  // Backup/restore progress
  backupProgress: 'blocklet.backupProgress',
  restoreProgress: 'blocklet.restoreProgress',

  downloadBundleProgress: 'blocklet.downloadBundleProgress',

  // state updated
  updated: 'blocklet.updated',
  domainStatus: 'blocklet.domainStatus',
  storeChange: 'blocklet.storeChange',
  appDidChanged: 'blocklet.appDidChanged',

  // purchase
  purchaseChange: 'blocklet.purchaseChange',

  // cert
  certError: 'blocklet.certError',
  certIssued: 'blocklet.certIssued',

  // did-space
  spaceConnected: 'blocklet.spaceConnected',

  // install by nft
  nftConsumed: 'blocklet.nftConsumed',

  // securityConfig
  securityConfigUpdated: 'blocklet.securityConfigUpdated',

  // gateway config
  gatewayConfigChanged: 'blocklet.gatewayConfigChanged',

  // appearance
  configTheme: 'blocklet.configTheme',

  // user session
  addUserSession: 'blocklet.addUserSession',
  updateUserSession: 'blocklet.updateUserSession',

  // blue-green start
  blueOrGreenStarted: 'blocklet.blueOrGreenStarted',
});

export const BlockletInternalEvents = Object.freeze({
  appConfigChanged: 'blocklet.appConfigChanged',
  appSettingChanged: 'blocklet.appSettingChanged',

  componentInstalled: 'blocklet._componentInstalled',
  componentUpgraded: 'blocklet._componentUpgraded',
  componentUpdated: 'blocklet._componentUpdated',
  componentStarted: 'blocklet._componentStarted',
  componentStopped: 'blocklet._componentStopped',
  componentRemoved: 'blocklet._componentRemoved',
  componentConfigChanged: 'blocklet._componentConfigChanged',

  componentsUpdated: 'blocklet.componentsUpdated', // deprecated, for backward compatibility
});

export const TeamEvents = Object.freeze({
  userAdded: 'user.added',
  userRemoved: 'user.removed',
  userUpdated: 'user.updated',
  userProfileUpdated: 'user.profile.updated',
  userPermissionUpdated: 'user.permission.updated',
});

export const BLOCKLET_PLATFORMS = ['aix', 'darwin', 'freebsd', 'linux', 'openbsd', 'sunos', 'win32'];
export const BLOCKLET_ARCHITECTURES = [
  'arm',
  'arm64',
  'ia32',
  'mips',
  'mipsel',
  'ppc',
  'ppc64',
  's390',
  's390x',
  'x32',
  'x64',
];

export const BLOCKLET_MODES = Object.freeze({
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
});

export const BLOCKLET_TENANT_MODES = Object.freeze({
  SINGLE: 'single',
  MULTIPLE: 'multiple',
});

export const BLOCKLET_FACTORY_SHARES = { developer: 0.7, store: 0.3 };

// Blocklet Interface

export const BLOCKLET_INTERFACE_TYPE_WEB = 'web';
export const BLOCKLET_INTERFACE_TYPE_SERVICE = 'service';
export const BLOCKLET_INTERFACE_TYPE_DOCKER = 'docker';

// Wellknown interface declares an sub-interface under web interface
// The path of the wellknown interface must starts with /.well-known, e.g. /.well-known/acme-challenge)
// The wellknown interface can be mounted to every endpoint of the abtnode and all blocklets on the abtnode
export const BLOCKLET_INTERFACE_TYPE_WELLKNOWN = 'wellknown';
export const BLOCKLET_INTERFACE_TYPES = [
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_INTERFACE_TYPE_SERVICE,
  BLOCKLET_INTERFACE_TYPE_WELLKNOWN,
  BLOCKLET_INTERFACE_TYPE_DOCKER,
];

export const BLOCKLET_INTERFACE_PUBLIC = 'publicUrl';
export const BLOCKLET_INTERFACE_WELLKNOWN = 'wellknownUrl'; // Deprecated
export const BLOCKLET_UI_INTERFACES = [BLOCKLET_INTERFACE_PUBLIC];
export const BLOCKLET_STANDARD_INTERFACES = [BLOCKLET_INTERFACE_PUBLIC, BLOCKLET_INTERFACE_WELLKNOWN];

export const BLOCKLET_INTERFACE_PROTOCOL_HTTP = 'http';
export const BLOCKLET_INTERFACE_PROTOCOL_TCP = 'tcp';
export const BLOCKLET_INTERFACE_PROTOCOL_UDP = 'udp';
export const BLOCKLET_INTERFACE_PROTOCOLS = [
  BLOCKLET_INTERFACE_PROTOCOL_TCP,
  BLOCKLET_INTERFACE_PROTOCOL_UDP,
  BLOCKLET_INTERFACE_PROTOCOL_HTTP,
];

export const BLOCKLET_DYNAMIC_PATH_PREFIX = '*';
export const BLOCKLET_DEFAULT_PORT_NAME = 'BLOCKLET_PORT';
export const BLOCKLET_DEFAULT_PATH_REWRITE = '/';

// bundle
export const BLOCKLET_RELEASE_FOLDER = '.blocklet/release';
export const BLOCKLET_RELEASE_FILE = 'blocklet.json';
export const BLOCKLET_BUNDLE_FOLDER = '.blocklet/bundle';
export const BLOCKLET_RELEASE_FOLDER_NAME = 'release';
export const BLOCKLET_BUNDLE_FOLDER_NAME = 'bundle';
export const BLOCKLET_BUNDLE_FILE = 'blocklet.zip';
export const BLOCKLET_ENTRY_FILE = 'blocklet.js';
export const BLOCKLET_META_FILE = 'blocklet.yml';
export const BLOCKLET_META_FILE_ALT = 'blocklet.yaml';
export const BLOCKLET_PREFERENCE_FILE = 'blocklet.prefs.json';
export const BLOCKLET_OPEN_API_FILE = 'blocklet.openapi.yaml';
export const BLOCKLET_OPEN_API_FILE_JSON = 'blocklet.openapi.json';
export const BLOCKLET_OPEN_COMPONENT_FILE = 'blocklet.opencomponent.yaml';
export const BLOCKLET_OPEN_COMPONENT_FILE_JSON = 'blocklet.opencomponent.json';
export const BLOCKLET_PREFERENCE_PREFIX = 'prefs.';
export const BLOCKLET_RESOURCE_DIR = 'resources';

export const RESOURCE_PATTERN =
  /\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|jsx|ts|tsx|mjs|woff|woff2|ttf|eot|otf|json|bmp|avif|wasm|xml|txt)$/i;

// project
export const PROJECT = {
  DIR: '.projects',
  RELEASE_DIR: 'releases',
  RESOURCE_DIR: 'resource',
  MAIN_DIR: 'main',
  ASSET_DIR: 'assets',
  TYPES: {
    resource: 'resource',
    pack: 'pack',
  },
  RELEASE_STATUS: {
    draft: 'draft',
    published: 'published',
  },
  MAX_NOTE_LENGTH: 1000,
  MAX_INTRO_LENGTH: 3000,
};

export const BLOCKLET_DEFAULT_VERSION = '1.0.0';

export const BLOCKLET_UPLOADS_DIR = '__uploads';

export const BLOCKLET_LATEST_SPEC_VERSION = '1.2.8';
export const BLOCKLET_LATEST_REQUIREMENT_SERVER = '>=1.7.0';
export const BLOCKLET_LATEST_REQUIREMENT_ABTNODE = '>=1.5.15'; // Deprecated

export const BLOCKLET_CONFIGURABLE_KEY = {
  // APP Config Key that start with BLOCKLET_ cannot set to child component
  BLOCKLET_CLUSTER_SIZE: 'BLOCKLET_CLUSTER_SIZE',
  BLOCKLET_APP_NAME: 'BLOCKLET_APP_NAME',
  BLOCKLET_APP_DESCRIPTION: 'BLOCKLET_APP_DESCRIPTION',
  BLOCKLET_APP_SK: 'BLOCKLET_APP_SK',
  BLOCKLET_APP_LOGO: 'BLOCKLET_APP_LOGO', // deprecated
  BLOCKLET_APP_LOGO_SQUARE: 'BLOCKLET_APP_LOGO_SQUARE',
  BLOCKLET_APP_LOGO_SQUARE_DARK: 'BLOCKLET_APP_LOGO_SQUARE_DARK',
  BLOCKLET_APP_LOGO_RECT: 'BLOCKLET_APP_LOGO_RECT',
  BLOCKLET_APP_LOGO_RECT_DARK: 'BLOCKLET_APP_LOGO_RECT_DARK',
  BLOCKLET_APP_LOGO_FAVICON: 'BLOCKLET_APP_LOGO_FAVICON',
  BLOCKLET_APP_SPLASH_PORTRAIT: 'BLOCKLET_APP_SPLASH_PORTRAIT',
  BLOCKLET_APP_SPLASH_LANDSCAPE: 'BLOCKLET_APP_SPLASH_LANDSCAPE',
  BLOCKLET_APP_OG_IMAGE: 'BLOCKLET_APP_OG_IMAGE', // background image for open graph
  BLOCKLET_APP_OG_COLOR: 'BLOCKLET_APP_OG_COLOR', // text color for open graph, dark | light
  BLOCKLET_APP_URL: 'BLOCKLET_APP_URL',
  BLOCKLET_APP_LANGUAGES: 'BLOCKLET_APP_LANGUAGES',
  BLOCKLET_PASSPORT_COLOR: 'BLOCKLET_PASSPORT_COLOR',
  BLOCKLET_WALLET_TYPE: 'BLOCKLET_WALLET_TYPE', // deprecated
  BLOCKLET_DELETABLE: 'BLOCKLET_DELETABLE',
  BLOCKLET_APP_TENANT_MODE: 'BLOCKLET_APP_TENANT_MODE',
  BLOCKLET_APP_COPYRIGHT_OWNER: 'BLOCKLET_APP_COPYRIGHT_OWNER',
  BLOCKLET_APP_COPYRIGHT_YEAR: 'BLOCKLET_APP_COPYRIGHT_YEAR',

  // Env vars used when the app stores files/NFTs in DID Spaces
  BLOCKLET_APP_SPACE_ENDPOINT: 'BLOCKLET_APP_SPACE_ENDPOINT',
  BLOCKLET_APP_SPACES_URL: 'BLOCKLET_APP_SPACES_URL',

  // Env var used when the app performs backups to DID Spaces
  BLOCKLET_APP_BACKUP_ENDPOINT: 'BLOCKLET_APP_BACKUP_ENDPOINT',

  BLOCKLET_APP_CHAIN_HOST: 'BLOCKLET_APP_CHAIN_HOST',
  BLOCKLET_APP_CHAIN_TYPE: 'BLOCKLET_APP_CHAIN_TYPE',
  BLOCKLET_APP_CHAIN_ID: 'BLOCKLET_APP_CHAIN_ID',

  // Component Key
  COMPONENT_ACCESS_WHO: 'COMPONENT_ACCESS_WHO',
};

export const DID_SPACES = {
  VC_TYPES: ['PersonalSpaceVerifiableCredential', 'EnterpriseSpaceVerifiableCredential', 'DIDSpaceAppAuthCredential'],
  NFT_TAG: 'did-space-purchase-nft',

  AUTHORIZE: {
    DEFAULT_SCOPE: 'list:object read:object write:object',
  },
};
export const BLOCKLET_APP_SPACE_REQUIREMENT = {
  // DID Space binding is required during app setup flow
  REQUIRED: 'required',
  REQUIRED_ON_SETUP: 'requiredOnSetup', // Alias for REQUIRED

  // DID Space binding is optional during setup
  OPTIONAL: 'optional',

  // All user data will be stored in each user's own DID Space
  REQUIRED_ON_CONNECT: 'requiredOnConnect',
};

export const CHAIN_INFO_CONFIG = {
  CHAIN_TYPE: ['type', 'arcblock'],
  CHAIN_ID: ['id', 'none'],
  CHAIN_HOST: ['host', 'none'],
};

export const RESTORE_PROGRESS_STATUS = {
  waiting: 0,
  start: 10,
  importData: 20,
  downloading: 30,
  importDataSuccess: 40,
  installing: 50,
  completed: 60,
  error: 70,
};

export const CHAIN_PROP_MAP = {
  BLOCKLET_APP_CHAIN_HOST: 'CHAIN_HOST',
  BLOCKLET_APP_CHAIN_ID: 'CHAIN_ID',
  BLOCKLET_APP_CHAIN_TYPE: 'CHAIN_TYPE',
};

export const CHAIN_PROP_MAP_REVERSE = Object.keys(CHAIN_PROP_MAP).reduce((acc, key) => {
  acc[CHAIN_PROP_MAP[key]] = key;
  return acc;
}, {});

export const DEVICE_HEADERS = {
  CLIENT_NAME: 'device-client-name',
  MESSAGE_TOKEN: 'device-message-token',
  DEVICE_ID: 'device-id',
  WALLET_MESSAGE_TOKEN: 'wallet-device-message-token',
  WALLET_DEVICE_ID: 'wallet-device-id',
};

export const APP_CONFIG_DIR = '/.config';
export const APP_CONFIG_PUBLIC_DIR = '/.config/public';
export const APP_CONFIG_FILE_PATH = '/.config/config.json';
export const COMPONENT_ENV_FILE_NAME = 'env';
export const COMPONENT_DOCKER_ENV_FILE_NAME = 'docker-env';
export const MAX_TITLE_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 80;
export const BLOCKLET_OPENEMBED_PREFIX = '/.well-known/blocklet/openembed';
export const BLOCKLET_AUTOMATIC_ENV_VALUE = '$BLOCKLET_AUTOMATIC_ENV_VALUE';
export const BLOCKLET_AUTOMATIC_ENV_VALUE_REGEX =
  /z[a-zA-Z0-9]{30,40}-(?:host|ports\.[A-Za-z0-9_-]+|env\.[A-Za-z0-9_-]+|port)/g;

export const SIG_VERSION = {
  V0: '0',
  V1: '1',
  DEFAULT: '1',
};

// NOTICE: keep sync with @abtnode/constant
export const USER_SESSION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  EXPIRED: 'expired',
};

// Navigation
export const NAV_GROUP_TEAM = '/team'; // Legacy dashboard built-in nav category; replaced by system + services + blocklets in the new version
export const NAV_GROUP_SYSTEM = '/system';
export const NAV_GROUP_SERVICES = '/services';
export const NAV_GROUP_BLOCKLETS = '/blocklets';

// Built-in static-server engine DID - blocklets using this engine can be served directly
// by blocklet-service without starting a separate static-server process
export const STATIC_SERVER_ENGINE_DID = 'z2qa2dGC9EmsjB2WJtUcmuRWx43zTwPUZQF7g';
