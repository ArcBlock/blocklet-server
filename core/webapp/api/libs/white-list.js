const ensureUserLogin = user => !!user;

// Org scoped requests are authorized by org ownership in resolvers or `verify-org-scope` middleware
const ensureOrgScoped = (user, args) => !!user && typeof args?.input?.orgId === 'string' && !!args.input.orgId;

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
];

// These APIs skip RBAC only when called for an org, otherwise RBAC is enforced
const ensureOrgScopedApis = ['getRoles', 'getInvitations', 'createRole', 'updateRole'];

module.exports = {
  ensureUserLoginWhiteList: ensureUserLoginApis.reduce((acc, api) => {
    acc[api] = (info, user) => ensureUserLogin(user);
    return acc;
  }, {}),
  ensureOrgScopedWhiteList: ensureOrgScopedApis.reduce((acc, api) => {
    acc[api] = (info, user, args) => ensureOrgScoped(user, args);
    return acc;
  }, {}),
};
