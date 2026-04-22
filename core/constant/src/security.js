// security rule relates
export const SECURITY_RULE_DEFAULT_ID = 'default';
export const ACCESS_POLICY_PUBLIC = 'public';
export const ACCESS_POLICY_INVITED_ONLY = 'invited-only';
export const ACCESS_POLICY_OWNER_ONLY = 'owner-only';
export const ACCESS_POLICY_ADMIN_ONLY = 'admin-only';
export const RESPONSE_HEADER_POLICY_SIMPLE_CORS = 'simple-cors';
export const RESPONSE_HEADER_POLICY_SECURITY_HEADER = 'security-header';
export const RESPONSE_HEADER_POLICY_SIMPLE_CORS_AND_SECURITY_HEADER = 'simple-cors-and-security-header';

export const ASSET_CDN_HOST = 'https://cdn.blocklet.io';
export const CSP_OFFICIAL_SOURCES = [
  'https://*.arcblock.io',
  'https://*.didnames.io',
  'https://*.didwallet.io',
  'https://*.abtnetwork.io',
  'https://*.didspaces.com',
  'https://*.blocklet.dev',
  'https://domain.didlabs.org',
  'https://cdn.blocklet.io',
];
export const CSP_SYSTEM_SOURCES = [
  'https://*.did.abtnet.io',
  'https://*.ip.abtnet.io',
  'https://*.slp.abtnet.io',
  'https://*.did.life',
  'https://*.did.rocks',
];
export const CSP_THIRD_PARTY_SOURCES = [
  'https://cdnjs.cloudflare.com',
  'https://js.stripe.com',
  'https://ipapi.co',
  'https://unpkg.com',
  'https://esm.run',
  'https://cdn.jsdelivr.net',
];
export const CSP_ICONIFY_SOURCES = ['https://*.simplesvg.com', 'https://*.iconify.design', 'https://*.unisvg.com'];
