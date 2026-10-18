const dns = require('dns');
const net = require('net');

const { isBlockedIP, parseIP } = require('./ssrf-protector');

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * IPv6 ranges that embed or tunnel an IPv4 address, they may reach an internal IPv4 host
 * through NAT64 / 6to4 / teredo gateways, so they are never allowed
 */
const BLOCKED_IPV6_TUNNEL_RANGES = new Set(['rfc6052', 'rfc6145', '6to4', 'teredo']);

/**
 * Check whether an IP address belongs to a range that must never be reached by a
 * server side request: loopback, link-local (includes the cloud metadata service),
 * private ranges, CGNAT and other reserved blocks.
 *
 * NOTICE: WHATWG URL serializes `[::ffff:127.0.0.1]` as `[::ffff:7f00:1]`, so IPv4-mapped
 * addresses must be parsed by ipaddr.js instead of matching the dotted form with regex
 * @param {string} ip
 * @returns {boolean}
 */
const isBlockedAddress = (ip) => {
  if (isBlockedIP(ip)) {
    return true;
  }

  const address = parseIP(ip);
  if (address.kind() !== 'ipv6') {
    return false;
  }
  // IPv4-compatible addresses (::a.b.c.d, deprecated)
  if (address.parts.slice(0, 6).every((x) => x === 0)) {
    return true;
  }
  return BLOCKED_IPV6_TUNNEL_RANGES.has(address.range());
};

/**
 * Validate a user supplied URL before the server fetches it, to avoid SSRF.
 * Rejects non http(s) protocols and hosts that resolve to internal addresses.
 * @param {string} raw
 * @param {object} [options]
 * @param {boolean} [options.resolve] resolve the hostname via DNS, defaults to true
 * @returns {Promise<URL>} the parsed url when it is safe to fetch
 * @throws {Error} when the url must not be fetched
 */
const assertSafeUrl = async (raw, { resolve = true } = {}) => {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid url');
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    throw new Error(`Unsupported protocol: ${url.protocol}`);
  }
  if (url.username || url.password) {
    throw new Error('Credentials are not allowed in url');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  if (!hostname) {
    throw new Error('Invalid url host');
  }

  // a literal ip can be checked without touching dns
  if (net.isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new Error(`Host is not allowed: ${hostname}`);
    }
    return url;
  }

  if (!resolve) {
    return url;
  }

  let addresses = [];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error(`Cannot resolve host: ${hostname}`);
  }

  if (!addresses.length || addresses.some((x) => isBlockedAddress(x.address))) {
    throw new Error(`Host is not allowed: ${hostname}`);
  }

  return url;
};

module.exports = { assertSafeUrl, isBlockedAddress };
