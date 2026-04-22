/**
 * User Manager - Orchestrates user management operations
 *
 * This module re-exports functionality from specialized sub-modules:
 * - user-auth-manager.js: User authentication and login operations
 * - user-query-manager.js: User query and search operations
 * - user-social-manager.js: User follow, invite, and webhook operations
 * - user-update-manager.js: User update and modification operations
 */

const { sendNewMemberNotification, loginUser, disconnectUserAccount, addUser } = require('./user-auth-manager');
const {
  getUsers,
  getUsersCount,
  getUsersCountPerRole,
  getUser,
  getConnectedAccount,
  isEmailUsed,
  isPhoneUsed,
  getUserByDid,
  isUserValid,
  isPassportValid,
  isConnectedAccount,
  getOwner,
} = require('./user-query-manager');
const {
  USER_RELATION_ACTIONS,
  USER_RELATION_QUERIES,
  userFollowAction,
  getUserFollows,
  getUserFollowStats,
  checkFollowing,
  getUserInvites,
  createWebhookDisabledNotification,
  updateWebHookState,
} = require('./user-social-manager');
const {
  updateUser,
  updateUserAddress,
  updateUserTags,
  removeUser,
  updateUserApproval,
  switchProfile,
} = require('./user-update-manager');

module.exports = {
  USER_RELATION_ACTIONS,
  USER_RELATION_QUERIES,
  sendNewMemberNotification,
  loginUser,
  disconnectUserAccount,
  addUser,
  getUsers,
  getUsersCount,
  getUsersCountPerRole,
  getUser,
  getConnectedAccount,
  isEmailUsed,
  isPhoneUsed,
  getUserByDid,
  isUserValid,
  isPassportValid,
  isConnectedAccount,
  getOwner,
  userFollowAction,
  getUserFollows,
  getUserFollowStats,
  checkFollowing,
  getUserInvites,
  createWebhookDisabledNotification,
  updateWebHookState,
  updateUser,
  updateUserAddress,
  updateUserTags,
  removeUser,
  updateUserApproval,
  switchProfile,
};
