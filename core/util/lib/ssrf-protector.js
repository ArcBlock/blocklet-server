/**
 * SSRF Protector
 */
const dns = require('dns');
const ipaddr = require('ipaddr.js');
const { isDidDomainUrl } = require('./url-evaluation');

const BLOCKED_IP_RANGES = new Set([
  'broadcast',
  'carrierGradeNat',
  'linkLocal',
  'loopback',
  'multicast',
  'private',
  'reserved',
  'uniqueLocal',
  'unspecified',
]);

function parseIP(ip) {
  if (!ip || typeof ip !== 'string') {
    return null;
  }

  const normalized = ip.startsWith('[') && ip.endsWith(']') ? ip.slice(1, -1) : ip;
  if (!ipaddr.isValid(normalized)) {
    return null;
  }

  const address = ipaddr.parse(normalized);
  return address.kind() === 'ipv6' && address.isIPv4MappedAddress() ? address.toIPv4Address() : address;
}

function isBlockedIP(ip) {
  const address = parseIP(ip);
  if (!address) {
    return true;
  }
  return BLOCKED_IP_RANGES.has(address.range());
}

// allowed protocols; only https is allowed
function isAllowedProtocol(protocol) {
  if (!protocol) {
    return false;
  }

  const _protocol = protocol.toLowerCase().replace(':', '');

  return ['https'].includes(_protocol);
}

// allowed host; must be the current site
function isAllowedReferer(referer, host) {
  if (!referer || !host) {
    return false;
  }

  try {
    const refererUrl = new URL(referer);

    // check whether referer comes from the current site
    return refererUrl.hostname === host || refererUrl.hostname === host.split(':')[0]; // handle host with port
  } catch {
    return false;
  }
}

const resolveDomain = (domain) => {
  return new Promise((resolve, reject) => {
    dns.lookup(domain, { all: true, verbatim: true }, (error, addresses) => {
      if (!error) {
        resolve(addresses.map((x) => x.address));
      } else {
        reject(error);
      }
    });
  });
};

/**
 * Resolve hostname and verify it is not a private IP
 * @param {string} hostname - hostname to resolve
 * @returns {Promise<boolean>} - true if resolved IP is not private, false otherwise
 */
async function resolveAndValidateHostname(hostname) {
  if (!hostname) {
    return false;
  }

  try {
    const addresses = await resolveDomain(hostname);

    return addresses.length > 0 && addresses.every((address) => !isBlockedIP(address));
  } catch (error) {
    // reject access when DNS resolution fails
    return false;
  }
}

/**
 * Resolve URL to IP address and verify it is not private
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} - true if IP is not private, false otherwise
 */
async function isAllowedURL(url) {
  if (!url) {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(url);

    if (!isAllowedProtocol(protocol)) {
      return false;
    }

    // if this is an IP address, validate directly
    if (parseIP(hostname)) {
      return !isBlockedIP(hostname);
    }

    // if hostname is in the skip list, return true directly
    if (isDidDomainUrl(hostname)) {
      return true;
    }

    // skip DNS validation in test and development environments
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return true;
    }

    // if this is a hostname, perform DNS resolution
    const result = await resolveAndValidateHostname(hostname);

    return result;
  } catch (error) {
    // URL parsing failed
    return false;
  }
}

module.exports = {
  isAllowedProtocol,
  isAllowedReferer,
  isAllowedURL,
  isBlockedIP,
  parseIP,
  resolveAndValidateHostname,
};
