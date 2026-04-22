const checkURLAccessibleInBrowser = require('./check-accessible-browser');

const isIpAddress = (hostname) => {
  return /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(hostname);
};

const isIpEcho = (hostname) => {
  return hostname.endsWith('.ip.abtnet.io');
};

const isDidDomain = (hostname) => {
  return hostname.endsWith('.did.abtnet.io');
};

const isSlpDomain = (hostname) => {
  return hostname.endsWith('.slp.abtnet.io');
};

const isCustomDomain = (domain) => {
  return !isIpEcho(domain) && !isDidDomain(domain) && !isSlpDomain(domain) && !isIpAddress(domain);
};

/**
 * @typedef {Object} EvaluateURLOptions
 * @property {boolean} [preferAccessible=false] - whether to prioritize accessibility
 * @property {number} [timeout=5000] - timeout in ms
 */

/**
 * Evaluate a URL's accessibility and priority score (considering both node and browser environments)
 * @param {string} url
 * @param {EvaluateURLOptions} options
 */
const evaluateURL = async (url, options = { preferAccessible: false }) => {
  const { timeout = 5000, checkAccessible = checkURLAccessibleInBrowser } = options;
  const { protocol, port, hostname } = new URL(url);
  // https adds 1000 points
  let score = protocol === 'https:' ? 1000 : 0;
  // custom domain — highest priority (even if inaccessible)
  if (isCustomDomain(hostname) && !options.preferAccessible) {
    score += 30000;
    // more subdomain levels reduces priority
    score -= hostname.split('.').length;
  } else {
    // slp address has higher priority than did address
    if (isSlpDomain(hostname)) {
      score += 22;
    }

    // did address has higher priority than ip echo address
    if (isDidDomain(hostname)) {
      score += 21;
    }

    // ip echo, +20
    if (isIpEcho(hostname)) {
      score += 20;
    }
    // plain IP address
    if (isIpAddress(hostname)) {
      score += 1;
    }
    // having an explicit port reduces priority
    if (port) {
      score -= 1;
    }
  }
  // inaccessible: subtract 20000 points (4xx–5xx responses are still considered accessible here)
  let accessible = false;
  if (checkAccessible) {
    accessible = await checkAccessible(url, timeout);
    if (!accessible) {
      score -= 20000;
    }
  }
  return { url, score, accessible };
};

/**
 * Evaluate a set of URLs by accessibility and priority, returning them sorted by score descending
 * @param {string[]} urls
 * @param {EvaluateURLOptions} options
 */
const evaluateURLs = async (urls, options = {}) => {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await evaluateURL(url, options);
      } catch (e) {
        console.error(e);
        return { url, score: Number.MIN_SAFE_INTEGER, accessible: false };
      }
    })
  );
  // in some cases sorting is not needed; pass sort: false to skip it
  if (options.sort === false) {
    return results;
  }
  return results.sort((a, b) => b.score - a.score);
};

const getOriginUrl = (url) => {
  if (!url) return '';

  try {
    const parsed = new URL(url);
    // strip query parameters
    return parsed.origin;
  } catch (error) {
    // if parsing fails, fall back to simple string handling
    return url;
  }
};

const isSlackWebhookUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'hooks.slack.com';
  } catch (e) {
    return false;
  }
};

const isDidDomainUrl = (hostname) => {
  return isIpEcho(hostname) || isDidDomain(hostname) || isSlpDomain(hostname);
};

module.exports = {
  isIpEcho,
  isDidDomain,
  isSlpDomain,
  evaluateURL,
  evaluateURLs,
  isCustomDomain,
  getOriginUrl,
  isSlackWebhookUrl,
  isDidDomainUrl,
};
