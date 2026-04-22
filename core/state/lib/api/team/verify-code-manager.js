const cloneDeep = require('@abtnode/util/lib/deep-clone');
const { generateRandomString } = require('@abtnode/models/lib/util');
const { BlockletEvents, BlockletInternalEvents } = require('@blocklet/constant');

const { getBlocklet } = require('../../util/blocklet');

/**
 * Create verify code
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.subject - Subject
 * @param {string} params.scope - Scope
 * @param {string} params.purpose - Purpose
 * @returns {Promise<Object>}
 */
async function createVerifyCode(api, { teamDid, subject, scope = 'email', purpose = 'kyc' }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.create(subject, scope, purpose);
}

/**
 * Consume verify code
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.code - Verify code
 * @returns {Promise<Object>}
 */
async function consumeVerifyCode(api, { teamDid, code }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.verify(code);
}

/**
 * Issue verify code
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.code - Verify code
 * @returns {Promise<Object>}
 */
async function issueVerifyCode(api, { teamDid, code }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.issue(code);
}

/**
 * Send verify code
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.code - Verify code
 * @returns {Promise<Object>}
 */
async function sendVerifyCode(api, { teamDid, code }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.send(code);
}

/**
 * Check if subject is verified
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.subject - Subject
 * @returns {Promise<boolean>}
 */
async function isSubjectVerified(api, { teamDid, subject }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.isVerified(subject);
}

/**
 * Check if subject is issued
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {string} params.subject - Subject
 * @returns {Promise<boolean>}
 */
async function isSubjectIssued(api, { teamDid, userDid, subject }) {
  const state = await api.getUserState(teamDid);
  return state.isSubjectIssued(userDid, subject);
}

/**
 * Check if subject is sent
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.subject - Subject
 * @returns {Promise<boolean>}
 */
async function isSubjectSent(api, { teamDid, subject }) {
  const state = await api.getVerifyCodeState(teamDid);
  return state.isSent(subject);
}

/**
 * Get verify code
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.code - Verify code
 * @param {string} params.id - Verify code ID
 * @returns {Promise<Object>}
 */
async function getVerifyCode(api, { teamDid, code, id }) {
  const state = await api.getVerifyCodeState(teamDid);
  const where = {};
  if (code) where.code = code;
  if (id) where.id = id;
  return state.findOne(where);
}

/**
 * Rotate session key
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @returns {Promise<number>}
 */
async function rotateSessionKey(api, { teamDid }) {
  if (!teamDid) {
    throw new Error('teamDid is required');
  }

  const info = await api.node.read();
  if (info.did === teamDid) {
    await api.node.updateNodeInfo({ sessionSalt: generateRandomString(16) });
    return 0;
  }

  const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs, useCache: true });
  const sessionConfig = cloneDeep(blocklet.settings.session || {});
  sessionConfig.salt = generateRandomString(16);
  await api.states.blockletExtras.setSettings(blocklet.meta.did, { session: sessionConfig });
  api.emit(BlockletEvents.updated, { meta: { did: teamDid } });

  // NOTE: we need emit appConfigChanged event to update sessionSalt in blocklet-sdk
  api.emit(BlockletInternalEvents.appConfigChanged, {
    appDid: teamDid,
    configs: [{ key: 'BLOCKLET_APP_SALT', value: sessionConfig.salt }],
  });

  return 1;
}

module.exports = {
  createVerifyCode,
  consumeVerifyCode,
  issueVerifyCode,
  sendVerifyCode,
  isSubjectVerified,
  isSubjectIssued,
  isSubjectSent,
  getVerifyCode,
  rotateSessionKey,
};
