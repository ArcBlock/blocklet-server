export const ROUTING_RESPONSE_TYPES = [
  {
    text: 'Plain Text',
    value: 'text/plain',
  },
  {
    text: 'JSON',
    value: 'application/json',
  },
  {
    text: 'XML',
    value: 'application/xml',
  },
  {
    text: 'HTML Document',
    value: 'text/html',
  },
  {
    text: 'YAML',
    value: 'application/x-yaml',
  },
  {
    text: 'TOML',
    value: 'application/toml',
  },
  {
    text: 'CSS',
    value: 'text/css',
  },
  {
    text: 'JavaScript',
    value: 'application/javascript',
  },
  {
    text: 'CSV',
    value: 'text/csv',
  },
  {
    text: 'Markdown',
    value: 'text/markdown',
  },
  {
    text: 'SVG',
    value: 'image/svg+xml',
  },
];

export const ROUTING_RULE_TYPES = /* #__PURE__ */ Object.freeze({
  NONE: 'none',
  DAEMON: 'daemon',
  SERVICE: 'service',
  BLOCKLET: 'blocklet',
  REDIRECT: 'redirect',
  GENERAL_REWRITE: 'rewrite',
  GENERAL_PROXY: 'general_proxy',
  DIRECT_RESPONSE: 'direct_response',
  COMPONENT: 'component',
  SUB_SERVICE: 'sub_service',
});

export const GATEWAY_RATE_LIMIT = { min: 5, max: 500 };
export const GATEWAY_RATE_LIMIT_BURST_FACTOR = { min: 1, max: 10 };
export const GATEWAY_RATE_LIMIT_GLOBAL = { min: 100, max: 5000 };
export const GATEWAY_RATE_LIMIT_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'];

export const DEFAULT_HTTP_PORT = 80;
export const DEFAULT_HTTPS_PORT = 443;
export const MAX_UPLOAD_FILE_SIZE = 100; // unit: MB
export const DEFAULT_DAEMON_PORT = 8089;
export const MAX_NGINX_WORKER_CONNECTIONS = 10240;

// @link https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/
// @link https://www.sheshbabu.com/posts/nginx-caching-proxy/
// @link https://www.nginx.com/blog/nginx-caching-guide/
export const ROUTER_CACHE_GROUPS = {
  blockletProxy: {
    minSize: '10m',
    maxSize: '10g',
    period: '30d',
  },
  // TODO: disabled because we can not bust nginx cache effectively for now
  // blockletJs: {
  //   minSize: '1m',
  //   maxSize: '64m',
  //   period: '5m',
  // },
};

export const BLACKLIST_SCOPE = {
  ROUTER: 'router',
};
