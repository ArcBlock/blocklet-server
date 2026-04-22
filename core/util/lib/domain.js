const toLower = require('lodash/toLower');
const trim = require('lodash/trim');
/**
 * Check if the domain is a top level domain
 * @param {string} domain - The domain to check (e.g. example.com)
 * @returns {boolean} - Returns true if it's a top level domain, false otherwise
 */
function isTopLevelDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  return domain.split('.').length === 2;
}

/**
 * Format the domain to a did domain
 * @param {string} domain - The domain to format (e.g. example.com)
 * @returns {string} - Returns the formatted domain (e.g. www.example.com)
 */
const formatTopLevelDidDomain = (domain) => {
  const tmpDomain = toLower(trim(domain));
  if (!tmpDomain) {
    return tmpDomain;
  }

  if (isTopLevelDomain(tmpDomain)) {
    return `www.${tmpDomain}`;
  }

  return tmpDomain;
};

module.exports = {
  isTopLevelDomain,
  formatTopLevelDidDomain,
};
