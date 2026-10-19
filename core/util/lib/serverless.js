const { NODE_MODES } = require('@abtnode/constant');

/**
 * Check if the node is in serverless mode
 * @param {object} param
 * @param {string} param.mode
 * @param {string} param.previousMode
 * @returns {boolean} whether the node is in serverless mode
 */
const isInServerlessMode = ({ mode, previousMode } = {}) =>
  mode === NODE_MODES.SERVERLESS ||
  previousMode === NODE_MODES.SERVERLESS ||
  process.env.ABT_NODE_DEBUG_AS_SERVERLESS === 'true';

/**
 * Check if launching new blocklets is disabled on this node, controlled by env ABT_NODE_DISABLE_LAUNCH
 * @returns {boolean} whether launching new blocklets is disabled
 */
const isLaunchDisabled = () => process.env.ABT_NODE_DISABLE_LAUNCH === 'true';

const getOrigin = (url) => {
  try {
    const { protocol, origin } = new URL(url);
    return ['http:', 'https:'].includes(protocol) ? origin : '';
  } catch {
    return '';
  }
};

/**
 * Check if a caller supplied launcher url points to the launcher this node is registered with.
 * The url is used for outbound requests (some signed with the node sk) before the launch is
 * authorized, so it must never be taken from the request as is.
 * @param {object} info node info
 * @param {string} launcherUrl
 * @returns {boolean}
 */
const isTrustedLauncherUrl = (info = {}, launcherUrl = '') => {
  const origin = getOrigin(launcherUrl);
  if (!origin) {
    return false;
  }
  // same exemption as the launcher nft issuer check: local launcher during development
  if (info.launcher?.mode === 'development') {
    return true;
  }
  return [info.launcher?.url, info.registerUrl].map(getOrigin).filter(Boolean).includes(origin);
};

module.exports = {
  isInServerlessMode,
  isLaunchDisabled,
  isTrustedLauncherUrl,
};
