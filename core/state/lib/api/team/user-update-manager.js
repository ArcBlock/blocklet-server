const pick = require('lodash/pick');
const isUrl = require('is-url');
const logger = require('@abtnode/logger')('@abtnode/core:api:team:user-update');
const { ROLES, USER_AVATAR_URL_PREFIX } = require('@abtnode/constant');
const { TeamEvents } = require('@blocklet/constant');
const { hasActiveOwnerPassport } = require('@abtnode/util/lib/passport');
const { getAvatarByUrl, extractUserAvatar } = require('@abtnode/util/lib/user');
const { syncFederated } = require('@abtnode/auth/lib/util/federated');

const { getBlocklet } = require('../../util/blocklet');
const { profileSchema } = require('../../validators/user');

/**
 * Update user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @returns {Promise<Object>}
 */
async function updateUser(api, { teamDid, user }) {
  const state = await api.getUserState(teamDid);
  const exist = await state.getUserByDid(user.did);
  const updated = await state.updateUser(user.did, user);
  logger.info('user updated successfully', { teamDid, userDid: user.did });

  api.emit(TeamEvents.userUpdated, { teamDid, user: updated });
  const kycChanged =
    (typeof user.emailVerified === 'boolean' && user.emailVerified !== exist.emailVerified) ||
    (typeof user.phoneVerified === 'boolean' && user.phoneVerified !== exist.phoneVerified);
  if (kycChanged) {
    logger.info('user updated with kycChanged', { teamDid, userDid: user.did });
    api.emit(TeamEvents.userPermissionUpdated, { teamDid, user: updated });
  }

  return updated;
}

/**
 * Update user address
 * @param {Object} api - TeamAPI instance
 * @param {Object} args
 * @returns {Promise<Object>}
 */
function updateUserAddress(api, args) {
  if (!args.address) {
    throw new Error('address should not be empty');
  }

  return updateUser(api, { teamDid: args.teamDid, user: pick(args, ['did', 'address']) });
}

/**
 * Update user tags
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.did - User DID
 * @param {Array} params.tags - Tags
 * @returns {Promise<Object>}
 */
async function updateUserTags(api, { teamDid, did, tags }) {
  const state = await api.getUserState(teamDid);
  const doc = await state.updateTags(did, tags);
  logger.info('user tags updated successfully', { teamDid, userDid: did, tags });
  api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  return doc;
}

/**
 * Remove user
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @returns {Promise<Object>}
 */
async function removeUser(api, { teamDid, user }) {
  const { did } = user;

  if (!did) {
    throw new Error('did does not exist');
  }

  if (user.role === ROLES.OWNER) {
    throw new Error('Cannot delete owner');
  }

  const state = await api.getUserState(teamDid);
  await state.remove({ did });
  logger.info('user removed successfully', { teamDid, userDid: did });
  api.emit(TeamEvents.userRemoved, { teamDid, user: { did } });

  return { did };
}

/**
 * Update user approval
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {Object} params.user - User
 * @param {Object} params.options - Options
 * @returns {Promise<Object>}
 */
async function updateUserApproval(api, { teamDid, user, options: { includeFederated = true } = {} }) {
  const state = await api.getUserState(teamDid);
  const userDoc = await state.getUser(user.did);

  if (!userDoc) {
    throw new Error('User does not exist');
  }

  const nodeInfo = await api.node.read();

  let blocklet;
  if (nodeInfo.did !== teamDid) {
    blocklet = await getBlocklet({
      did: teamDid,
      states: api.states,
      dataDirs: api.dataDirs,
      useCache: true,
    });
  }

  if (hasActiveOwnerPassport(userDoc, { blocklet, nodeInfo })) {
    throw new Error('Cannot update owner\'s approval'); // prettier-ignore
  }

  const changeData = pick(user, ['did', 'approved']);

  const result = await state.updateApproved(changeData);

  logger.info('user approval updated successfully', { teamDid, userDid: user.did, approved: user.approved });

  if (changeData?.approved === false) {
    // 需要注销指定 userDid 在当前 member 和 master 中的所有 userSession
    await api.logoutUser({ teamDid, userDid: user.did });

    // 需要禁用用户的所有 passport
    await state.revokePassportByUserDid({ did: user.did });
  }
  if (includeFederated) {
    // 只有 blocklet 需要执行这个操作
    if (nodeInfo.did !== teamDid) {
      syncFederated({
        nodeInfo,
        blocklet,
        data: {
          users: [
            {
              action: user.approved ? 'unban' : 'ban',
              did: user.did,
              sourceAppPid: userDoc.sourceAppPid,
            },
          ],
        },
      });
    }
  }
  api.emit(TeamEvents.userUpdated, { teamDid, user: result });
  api.emit(TeamEvents.userPermissionUpdated, { teamDid, user: result });

  return result;
}

/**
 * Switch profile
 * @param {Object} api - TeamAPI instance
 * @param {Object} params
 * @param {string} params.teamDid - Team DID
 * @param {string} params.userDid - User DID
 * @param {Object} params.profile - Profile
 * @returns {Promise<Object>}
 */
async function switchProfile(api, { teamDid, userDid, profile }) {
  const state = await api.getUserState(teamDid);
  // NOTICE: 这个 schema 没有对数据做任何 default 操作，所以没必要用 validate 之后的值
  const { error } = profileSchema.validate({ ...profile, did: userDid });
  if (error) {
    throw new Error(error);
  }
  const oldUser = await state.getUser(userDid);
  if (!oldUser) {
    throw new Error('User is not exist', { userDid, teamDid });
  }

  const mergeData = { ...profile };

  if (mergeData.avatar) {
    if (mergeData.avatar.startsWith(USER_AVATAR_URL_PREFIX)) {
      // pass
    } else if (isUrl(mergeData.avatar)) {
      try {
        mergeData.avatar = await getAvatarByUrl(mergeData.avatar);
        const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
        mergeData.avatar = await extractUserAvatar(mergeData.avatar, { dataDir: blocklet.env.dataDir });
      } catch {
        logger.error('Failed to convert external avatar', { teamDid, userDid, avatar: mergeData.avatar });
        throw new Error('Failed to convert external avatar');
      }
    } else {
      // 仅当 avatar 是 base64 时，对 avatar 进行处理
      const regex = /^data:image\/(\w+);base64,/;
      const match = regex.exec(mergeData.avatar);
      if (match) {
        const blocklet = await getBlocklet({ did: teamDid, states: api.states, dataDirs: api.dataDirs });
        mergeData.avatar = await extractUserAvatar(mergeData.avatar, { dataDir: blocklet.env.dataDir });
      } else {
        logger.error('Profile avatar is invalid', { teamDid, userDid, profile });
        throw new Error('Profile avatar is invalid');
      }
    }
  }
  const doc = await state.updateUser(userDid, mergeData);
  logger.info('User switch-profile successfully', { teamDid, userDid });
  api.emit(TeamEvents.userUpdated, { teamDid, user: doc });
  api.emit(TeamEvents.userProfileUpdated, { teamDid, user: doc });
  return doc;
}

module.exports = {
  updateUser,
  updateUserAddress,
  updateUserTags,
  removeUser,
  updateUserApproval,
  switchProfile,
};
