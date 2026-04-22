const toLower = require('lodash/toLower');

const WILDCARD = '*';

/**
 * check two domains match or not. e.g. *.arcblock.io matches www.arcblock.io
 * @param {String} domainX
 * @param {String} domainY
 */
const checkDomainMatch = (domainX, domainY) => {
  const domain1 = toLower(domainX);
  const domain2 = toLower(domainY);

  if (!domain1 || !domain2) return false;
  if (typeof domain1 !== 'string' || typeof domain2 !== 'string') return false;
  if (domain1 === domain2) return true;
  if (domain1[0] !== WILDCARD && domain2[0] !== WILDCARD) return false;
  const arr1 = domain1.split('.');
  const arr2 = domain2.split('.');

  if (arr1.length !== arr2.length) {
    const diffLength = Math.abs(arr1.length - arr2.length);
    if (diffLength !== 1) {
      return false;
    }

    if (arr1[0] === WILDCARD) {
      return arr2.join('.') === arr1.slice(1).join('.');
    }

    if (arr2[0] === WILDCARD) {
      return arr1.join('.') === arr2.slice(1).join('.');
    }

    return false;
  }

  for (let i = arr1.length - 1; i >= 0; i--) {
    if (i > 0 && arr1[i] !== arr2[i]) return false;
    if (i === 0) {
      return arr1[i] === WILDCARD || arr2[i] === WILDCARD;
    }
  }
  return false;
};

module.exports = checkDomainMatch;
