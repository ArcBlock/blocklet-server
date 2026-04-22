const {
  createLaunchBlockletHandler,
  createServerlessInstallGuard,
  getLaunchBlockletClaims,
} = require('@abtnode/auth/lib/server');

module.exports = function createRoutes(node) {
  return {
    action: 'launch-free-blocklet-by-launcher',
    onStart: createServerlessInstallGuard(node),
    claims: getLaunchBlockletClaims(node, 'launcher'),
    onAuth: createLaunchBlockletHandler(node, 'launcher'),
  };
};
