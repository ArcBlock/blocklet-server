/**
 * Get OAuth clients
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.paging - Paging options
 * @returns {Promise<Object>}
 */
async function getOAuthClients(api, { teamDid, paging }) {
  const { oauthClientState } = await api.teamManager.getOAuthState(teamDid);
  return oauthClientState.list(paging);
}

/**
 * Delete OAuth client
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.clientId - Client ID
 * @returns {Promise<Object>}
 */
async function deleteOAuthClient(api, { teamDid, clientId }) {
  const { oauthClientState } = await api.teamManager.getOAuthState(teamDid);
  return oauthClientState.remove({ clientId });
}

/**
 * Create OAuth client
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.input - OAuth client input
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createOAuthClient(api, { teamDid, input }, context) {
  const { oauthClientState } = await api.teamManager.getOAuthState(teamDid);
  return oauthClientState.create(input, context);
}

/**
 * Update OAuth client
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.input - OAuth client input
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateOAuthClient(api, { teamDid, input }, context) {
  const { oauthClientState } = await api.teamManager.getOAuthState(teamDid);
  return oauthClientState.update(input, context);
}

module.exports = {
  getOAuthClients,
  deleteOAuthClient,
  createOAuthClient,
  updateOAuthClient,
};
