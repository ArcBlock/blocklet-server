const dns = require('dns');
const net = require('net');

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Check whether an IP address belongs to a range that must never be reached by a
 * server side request: loopback, link-local (includes the cloud metadata service),
 * private ranges, CGNAT and other reserved blocks.
 * @param {string} ip
 * @returns {boolean}
 */
const isBlockedAddress = (ip) => {
  const type = net.isIP(ip);
  if (!type) {
    return true;
  }

  if (type === 6) {
    const lower = ip.toLowerCase();
    // IPv4-mapped (::ffff:169.254.169.254) must be checked as IPv4
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) {
      return isBlockedAddress(mapped[1]);
    }
    // unspecified, loopback, unique-local (fc00::/7), link-local (fe80::/10)
    return lower === '::' || lower === '::1' || /^f[cd][0-9a-f]{2}:/.test(lower) || /^fe[89ab][0-9a-f]:/.test(lower);
  }

  const [a, b] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  return a >= 224; // multicast + reserved
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
