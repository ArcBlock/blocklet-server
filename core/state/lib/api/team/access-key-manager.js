/**
 * Get access keys
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getAccessKeys(api, { teamDid, ...data }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.findPaginated(data, context);
}

/**
 * Get access key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.accessKeyId - Access key ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function getAccessKey(api, { teamDid, accessKeyId }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.detail({ accessKeyId }, context);
}

/**
 * Create access key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function createAccessKey(api, { teamDid, ...data }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.create(Object.assign({ componentDid: teamDid }, data), context);
}

/**
 * Update access key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function updateAccessKey(api, { teamDid, ...data }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.update(data, context);
}

/**
 * Delete access key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.accessKeyId - Access key ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function deleteAccessKey(api, { teamDid, accessKeyId }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.remove({ accessKeyId }, context);
}

/**
 * Refresh last used
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.accessKeyId - Access key ID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function refreshLastUsed(api, { teamDid, accessKeyId }, context) {
  const state = await api.getAccessKeyState(teamDid);
  return state.refreshLastUsed(accessKeyId, context);
}

/**
 * Verify access key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} context
 * @returns {Promise<Object>}
 */
async function verifyAccessKey(api, { teamDid, ...data }, context) {
  const state = await api.getAccessKeyState(teamDid);
  const accessKey = await state.verify(data, context);
  return accessKey;
}

module.exports = {
  getAccessKeys,
  getAccessKey,
  createAccessKey,
  updateAccessKey,
  deleteAccessKey,
  refreshLastUsed,
  verifyAccessKey,
};
