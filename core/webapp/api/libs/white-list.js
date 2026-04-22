const ensureUserLogin = user => !!user;

const ensureUserLoginApis = [
  // Org
  'getOrgs',
  'getOrg',
  'createOrg',
  'deleteOrg',
  'updateOrg',
  'getOrgMembers',
  'inviteMembersToOrg',
  'removeOrgMember',
  'getOrgInvitableUsers',
  // notifications
  'getNotifications',
  'makeAllNotificationsAsRead',
  'readNotifications',
  'unreadNotifications',
  'getNotificationComponents',
  // user follow
  'getUserFollowStats',
  'getUserFollowers',
  'getUserFollowing',
  // invite
  'getUserInvites',
  // Access key
  'getAccessKeys',
  'createAccessKey',
  'updateAccessKey',
  'deleteAccessKey',
  // getUsers
  //
  'getRoles',
  'getRole',
  'getInvitations',
  'createRole',
  'updateRole',
  'deleteRole',
];

module.exports = {
  ensureUserLoginWhiteList: ensureUserLoginApis.reduce((acc, api) => {
    acc[api] = (info, user) => ensureUserLogin(user);
    return acc;
  }, {}),
};
