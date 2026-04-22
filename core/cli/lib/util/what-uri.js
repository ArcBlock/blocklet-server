const isUrl = require('is-url');
const isURI = require('validate.io-uri');

/**
 *
 *
 * @param {string} uri
 * @return {boolean}
 */
function isAnchor(uri) {
  return uri && uri.startsWith('#');
}

/**
 *
 *
 * @param {string} uri
 * @return {boolean}
 */
function isNoHeaderUri(uri) {
  return uri && (uri.startsWith('://') || uri.startsWith('//'));
}

/**
 *
 *
 * @param {string} uri
 * @return {boolean}
 */
function isLocalUri(uri) {
  if (!uri) {
    return false;
  }

  return !(isURI(uri) || isAnchor(uri) || isNoHeaderUri(uri) || isUrl(uri));
}

module.exports = {
  isLocalUri,
};
