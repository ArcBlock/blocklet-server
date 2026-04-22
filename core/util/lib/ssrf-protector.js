/**
 * SSRF Protector
 */
const isPrivateIP = require('private-ip');
const isIP = require('is-ip');
const dns = require('dns');
const { isDidDomainUrl } = require('./url-evaluation');

// private-ip does not cover multicast ranges (CVE: GHSA-jm66-6qc7-hx83)
// IPv4 multicast: 224.0.0.0/4 (224-239.x.x.x)
// IPv6 multicast: ff00::/8
function isMulticastIP(ip) {
  if (!ip) return false;
  const ipv4Match = ip.match(/^(\d{1,3})\./);
  if (ipv4Match) {
    const first = parseInt(ipv4Match[1], 10);
    return first >= 224 && first <= 239;
  }
  return /^[Ff][Ff]/i.test(ip);
}

function isBlockedIP(ip) {
  return isPrivateIP(ip) || isMulticastIP(ip);
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
    dns.lookup(domain, { all: false }, (error, address) => {
      if (!error) {
        resolve(address);
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
    // resolve hostname using lookup
    const address = await resolveDomain(hostname);

    // check whether it is a private or multicast IP and return the inverse
    return !isBlockedIP(address);
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
    if (isIP(hostname)) {
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
  resolveAndValidateHostname,
};
