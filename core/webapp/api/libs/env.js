const isE2E = process.env.NODE_ENV === 'e2e' || ['1', 'true'].includes(process.env.IS_E2E);

if (!process.env.ABT_NODE_SESSION_SECRET && !isE2E) {
  throw new Error('ABT_NODE_SESSION_SECRET must be set to start the node');
}

module.exports = {
  baseUrl: process.env.ABT_NODE_BASE_URL,
  secret: process.env.ABT_NODE_SESSION_SECRET,
  cacheTtl: Number(process.env.ABT_NODE_SESSION_CACHE_TTL) ? Number(process.env.ABT_NODE_SESSION_CACHE_TTL) : '1h',
  ttl: Number(process.env.ABT_NODE_SESSION_TTL) ? Number(process.env.ABT_NODE_SESSION_TTL) : '7d',
  isE2E,
};
