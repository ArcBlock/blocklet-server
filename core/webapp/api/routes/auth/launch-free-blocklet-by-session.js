const {
  createLaunchBlockletHandler,
  getLaunchBlockletClaims,
  getBlockletPermissionChecker,
} = require('@abtnode/auth/lib/server');

module.exports = function createRoutes(node) {
  return {
    action: 'launch-free-blocklet-by-session',
    claims: getLaunchBlockletClaims(node, 'session'),
    onConnect: getBlockletPermissionChecker(node),
    onAuth: createLaunchBlockletHandler(node, 'session'),
  };
};
