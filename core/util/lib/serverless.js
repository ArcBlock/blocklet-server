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

module.exports = {
  isInServerlessMode,
  isLaunchDisabled,
};
