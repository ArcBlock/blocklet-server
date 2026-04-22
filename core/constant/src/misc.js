export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const StatusCode = /* #__PURE__ */ Object.freeze({
  ok: 0,

  blocklet_not_found: 1,
  blocklet_not_purchased: 2,

  forbidden: 403,
  internal: 500,
  timeout: 504,
});

export const MAIN_CHAIN_ENDPOINT = 'https://main.abtnetwork.io/api/';

export const SERVER_CACHE_TTL = 300 * 1000; // 5 minutes
export const RBAC_CACHE_TTL = 300 * 1000; // 5 minutes
export const BLOCKLET_CACHE_TTL = 300 * 1000; // 5 minutes
export const SESSION_CACHE_TTL = 3600; // 1h: unit seconds
export const SESSION_TTL = 7 * 86400; // 7d: unit seconds

export const COPYRIGHT_OWNER = 'ArcBlock';

// default maximum page size
export const MAX_PAGE_SIZE = 100;
