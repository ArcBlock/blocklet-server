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

module.exports = {
  isInServerlessMode,
};
