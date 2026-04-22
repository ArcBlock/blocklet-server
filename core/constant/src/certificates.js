import { DAY_IN_MS } from './misc.js';

export const DEFAULT_DID_REGISTRY = 'https://registry.abtnet.io';
export const DEFAULT_SLP_DOMAIN = 'slp.abtnet.io';
export const DEFAULT_DID_DOMAIN = 'did.abtnet.io';
export const DEFAULT_IP_DOMAIN = '*.ip.abtnet.io';
export const DEFAULT_IP_DOMAIN_SUFFIX = 'ip.abtnet.io';
export const DEFAULT_WILDCARD_CERT_HOST = 'https://releases.arcblock.io/';
export const DEFAULT_NFT_DOMAIN_URL = 'https://domain.didlabs.org/';

export const DEFAULT_CERTIFICATE_EMAIL = 'certs@arcblock.io';

export const CERTIFICATE_EXPIRES_OFFSET = 10 * DAY_IN_MS;

export const CONFIG_FILENAME = 'config.yml';
export const CONFIG_FILENAME_OLD = 'abtnode.yml';
export const CONFIG_FOLDER_NAME = '.blocklet-server';
export const CONFIG_FOLDER_NAME_OLD = '.abtnode';
export const EXPORTED_FOLDER_NAME = 'exported_blocklet_server';

export const DEFAULT_WELLKNOWN_PORT = 8088;

// Service Gateway
// eslint-disable-next-line prefer-regex-literals
export const IP = new RegExp(
  '-(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\-(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}'
);
export const DOMAIN_FOR_IP_SITE = '';
export const DOMAIN_FOR_IP_SITE_REGEXP = `~^\\d+.\\d+.\\d+.\\d+$`; // eslint-disable-line
export const DOMAIN_FOR_DEFAULT_SITE = '*';
export const DOMAIN_FOR_INTERNAL_SITE = '127.0.0.1';
export const NAME_FOR_WELLKNOWN_SITE = 'wellknown';
export const WELLKNOWN_PATH_PREFIX = '/.well-known';
export const WELLKNOWN_ACME_CHALLENGE_PREFIX = '/.well-known/acme-challenge';
export const WELLKNOWN_DID_RESOLVER_PREFIX = '/.well-known/did.json'; // server wellknown endpoint
export const WELLKNOWN_OAUTH_SERVER = '/.well-known/oauth-authorization-server';
export const WELLKNOWN_OPENID_SERVER = '/.well-known/openid-configuration';
export const WELLKNOWN_BLACKLIST_PREFIX = '/.well-known/blacklist';
export const WELLKNOWN_PING_PREFIX = '/.well-known/ping';
export const WELLKNOWN_ANALYTICS_PREFIX = '/.well-known/analytics';
export const WELLKNOWN_SERVICE_PATH_PREFIX = '/.well-known/service';
export const WELLKNOWN_BLOCKLET_ADMIN_PATH = '/.well-known/service/admin';
export const WELLKNOWN_BLOCKLET_USER_PATH = '/.well-known/service/user';
export const WELLKNOWN_BLOCKLET_HEALTH_PATH = '/.well-known/service/health';
export const WELLKNOWN_BLOCKLET_LOGO_PATH = '/.well-known/service/blocklet/logo';
export const SLOT_FOR_IP_DNS_SITE = '888-888-888-888';

export const DEFAULT_ADMIN_PATH = '/admin';
export const WELLKNOWN_SERVER_ADMIN_PATH = '/.well-known/server/admin';
