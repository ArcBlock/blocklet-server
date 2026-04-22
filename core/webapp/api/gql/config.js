/* eslint-disable no-await-in-loop */
const verifyTeam = require('./middlewares/verify-team');
const verifyUser = require('./middlewares/verify-user');
const verifyNotificationReceiver = require('./middlewares/verify-notification-receiver');
const verifyBlocklet = require('./middlewares/verify-blocklet');
const verifyAdminRole = require('./middlewares/verify-admin-role');
const verifyOrgEnabled = require('./middlewares/verify-org-enabled');
const createAuditLog = require('./middlewares/create-audit-log');
const mutateBlocklet = require('./middlewares/mutate-blocklet');
const createReleaseBlocklet = require('./middlewares/create-release-blocklet');
const getBlockletList = require('./middlewares/get-blocklet-list');
const addBlockletStore = require('./middlewares/add-blocklet-store');
const deleteBlockletStore = require('./middlewares/delete-blocklet-store');
const notAllowCall = require('./middlewares/not-allow-call');
const verifyDestroySession = require('./middlewares/verify-destroy-session');
const sdkVerifyUser = require('./middlewares/sdk-verify-user');
const verifyPrivate = require('./middlewares/verify-private');

const wrap = ([permissions, dataKeys, handler, preHooks = [], postHooks = [], action, node]) => {
  return {
    permissions,
    dataKeys,
    handler: new Proxy(handler, {
      async apply(target, ctx, args) {
        const [input = {}, context = {}] = args;
        // run pre hooks: should abort the request when any hook throws
        for (let i = 0; i < preHooks.length; i++) {
          await Reflect.apply(preHooks[i], ctx, [input, context, node, action]);
        }

        const result = await Reflect.apply(target, ctx, args);

        // run post hooks: should not effect the request when any hook throws
        for (let i = 0; i < postHooks.length; i++) {
          Reflect.apply(postHooks[i], ctx, [input, context, node, action, result]);
        }

        return result;
      },
    }),
  };
};

/**
 * { <gql_api>: [permissions, gql_api_return_key, gql_api_handler] }
 */
const genConfig = node => {
  const configs = {
    // Blocklet registry
    getBlockletMeta: [['query_blocklets'], 'meta', node.getBlockletMeta],

    // Blocklet manager
    getBlocklet: [['query_blocklets', 'query_blocklet'], 'blocklet', node.getBlocklet, [verifyBlocklet]],
    getBlocklets: [['query_blocklets'], ['blocklets', 'paging'], node.getBlocklets, [getBlockletList]],
    getBlockletsFromBackup: [['query_blocklets'], 'backups', node.getBlockletsFromBackup],
    getBlockletDiff: [['query_blocklets', 'query_blocklet'], 'blockletDiff', node.getBlockletDiff, [verifyBlocklet]],
    getBlockletRuntimeHistory: [
      ['query_blocklets', 'query_blocklet'],
      'historyList',
      node.getBlockletRuntimeHistory,
      [verifyBlocklet],
    ],

    getBlockletMetaFromUrl: [[], ['meta', 'isFree', 'inStore', 'registryUrl'], node.getBlockletMetaFromUrl],
    launchBlockletByLauncher: [[], 'data', node.launchBlockletByLauncher],
    launchBlockletWithoutWallet: [[], 'data', node.launchBlockletWithoutWallet],
    getDynamicComponents: [[], 'components', node.getDynamicComponents],
    installBlocklet: [['mutate_blocklets'], 'blocklet', node.installBlocklet, [mutateBlocklet]],
    installComponent: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.installComponent,
      [verifyBlocklet, mutateBlocklet],
    ],
    startBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.startBlocklet,
      [verifyBlocklet],
      [createAuditLog],
    ],
    stopBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.stopBlocklet,
      [verifyBlocklet],
      [createAuditLog],
    ],
    reloadBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.reloadBlocklet,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    restartBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.restartBlocklet,
      [verifyBlocklet],
      [createAuditLog],
    ],
    deleteBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.deleteBlocklet,
      [verifyDestroySession, verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    deleteComponent: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.deleteComponent,
      [verifyDestroySession, verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    cancelDownloadBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.cancelDownloadBlocklet,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    configBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configBlocklet,
      [verifyBlocklet],
      [createAuditLog],
    ],
    configVault: [
      ['mutate_blocklet'],
      'sessionId',
      node.configVault,
      [verifyDestroySession, verifyBlocklet, mutateBlocklet],
      [],
    ],
    checkComponentsForUpdates: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'preUpdateInfo',
      node.checkComponentsForUpdates,
      [verifyBlocklet],
    ],
    upgradeComponents: [['mutate_blocklets', 'mutate_blocklet'], 'blocklet', node.upgradeComponents, [verifyBlocklet]],
    configNavigations: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configNavigations,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    configAuthentication: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configAuthentication,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    configDidConnect: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configDidConnect,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    configDidConnectActions: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configDidConnectActions,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    joinFederatedLogin: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.joinFederatedLogin,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    quitFederatedLogin: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.quitFederatedLogin,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    disbandFederatedLogin: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.disbandFederatedLogin,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    auditFederatedLogin: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.auditFederatedLogin,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    syncMasterAuthorization: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.syncMasterAuthorization,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    syncFederatedConfig: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.syncFederatedConfig,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    configNotification: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.configNotification,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    sendEmail: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.sendEmail,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    sendPush: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.sendPush,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    updateAppSessionConfig: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.updateAppSessionConfig,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    updateComponentTitle: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.updateComponentTitle,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    updateComponentMountPoint: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.updateComponentMountPoint,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    backupBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.backupBlocklet,
      [mutateBlocklet],
      [createAuditLog],
    ],
    abortBlockletBackup: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.abortBlockletBackup,
      [mutateBlocklet],
      [createAuditLog],
    ],
    // FIXME: this can not be called from dashboard anymore
    restoreBlocklet: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.restoreBlocklet,
      [mutateBlocklet],
      [createAuditLog],
    ],
    migrateApplicationToStructV2: [
      ['mutate_blocklet'],
      'blocklet',
      node.migrateApplicationToStructV2,
      [mutateBlocklet],
    ],

    addBlockletSpaceGateway: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.addBlockletSpaceGateway,
      [mutateBlocklet],
    ],
    deleteBlockletSpaceGateway: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.deleteBlockletSpaceGateway,
      [mutateBlocklet],
    ],
    updateBlockletSpaceGateway: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.updateBlockletSpaceGateway,
      [mutateBlocklet],
    ],
    getBlockletSpaceGateways: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'spaceGateways',
      node.getBlockletSpaceGateways,
      [],
    ],

    // update settings
    updateAutoBackup: [['mutate_blocklets', 'mutate_blocklet'], 'blocklet', node.updateAutoBackup, []],
    updateAutoCheckUpdate: [['mutate_blocklets', 'mutate_blocklet'], 'blocklet', node.updateAutoCheckUpdate, []],
    updateBlockletSettings: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'blocklet',
      node.updateBlockletSettings,
      [verifyBlocklet],
      [createAuditLog],
    ],

    // blocklet backup record
    getBlockletBackups: [['query_blocklet', 'query_blocklets'], 'backups', node.getBlockletBackups, []],
    getBlockletBackupSummary: [['query_blocklet', 'query_blocklets'], 'summary', node.getBlockletBackupSummary, []],

    // Team Access Control
    getRoles: [['query_team'], 'roles', node.getRoles, [verifyTeam]],
    getRole: [['query_team'], 'role', node.getRole, [verifyTeam]],
    createRole: [['mutate_team'], 'role', node.createRole, [verifyTeam], [createAuditLog]],
    updateRole: [['mutate_team'], 'role', node.updateRole, [verifyTeam], [createAuditLog]],
    deleteRole: [['mutate_team'], 'success', node.deleteRole, [verifyTeam], [createAuditLog]],

    getPermissions: [['query_team'], 'permissions', node.getPermissions, [verifyTeam]],
    createPermission: [['mutate_team'], 'permission', node.createPermission, [verifyTeam], [createAuditLog]],
    updatePermission: [['mutate_team'], 'role', node.updatePermission, [verifyTeam], [createAuditLog]],
    deletePermission: [['mutate_team'], 'success', node.deletePermission, [verifyTeam], [createAuditLog]],

    grantPermissionForRole: [['mutate_team'], 'success', node.grantPermissionForRole, [verifyTeam], [createAuditLog]],
    revokePermissionFromRole: [
      ['mutate_team'],
      'success',
      node.revokePermissionFromRole,
      [verifyTeam],
      [createAuditLog],
    ],
    updatePermissionsForRole: [['mutate_team'], 'role', node.updatePermissionsForRole, [verifyTeam], [createAuditLog]],
    getPermissionsByRole: [['query_team'], 'permissions', node.getPermissionsByRole, [verifyTeam]],
    hasPermission: [['query_team'], 'result', node.hasPermission, [verifyTeam]],

    // Orgs
    getOrgs: [['query_team'], ['orgs', 'paging'], node.getOrgs, [verifyTeam, verifyOrgEnabled]],
    getOrg: [['query_team'], 'org', node.getOrg, [verifyTeam, verifyOrgEnabled]],
    createOrg: [['mutate_team'], 'org', node.createOrg, [verifyTeam, verifyOrgEnabled], [createAuditLog]],
    deleteOrg: [['mutate_team'], 'org', node.deleteOrg, [verifyTeam, verifyOrgEnabled], [createAuditLog]],
    updateOrg: [['mutate_team'], 'org', node.updateOrg, [verifyTeam, verifyOrgEnabled], [createAuditLog]],

    getOrgMembers: [['query_team'], ['users', 'paging'], node.getOrgMembers, [verifyTeam, verifyOrgEnabled]],
    getOrgInvitableUsers: [
      ['query_team'],
      ['users', 'paging'],
      node.getOrgInvitableUsers,
      [verifyTeam, verifyOrgEnabled],
    ],
    inviteMembersToOrg: [
      ['mutate_team'],
      'data',
      node.inviteMembersToOrg,
      [verifyTeam, verifyOrgEnabled],
      [createAuditLog],
    ],
    removeOrgMember: [['mutate_team'], 'user', node.removeOrgMember, [verifyTeam, verifyOrgEnabled], [createAuditLog]],

    getOrgResource: [['query_team'], 'data', node.getOrgResource, [verifyTeam, verifyOrgEnabled]],
    addOrgResource: [['mutate_team'], 'data', node.addOrgResource, [verifyTeam, verifyOrgEnabled], [createAuditLog]],
    migrateOrgResource: [
      ['mutate_team'],
      'data',
      node.migrateOrgResource,
      [verifyTeam, verifyOrgEnabled],
      [createAuditLog],
    ],

    // Team User
    getUsers: [['query_team'], ['users', 'paging'], node.getUsers, [verifyTeam]],
    getUserInvites: [['query_team'], ['users', 'paging'], node.getUserInvites, [verifyTeam, verifyPrivate]],

    getUserFollowers: [['query_team'], ['data', 'paging'], node.getUserFollowers, [verifyTeam, verifyPrivate]],
    getUserFollowing: [['query_team'], ['data', 'paging'], node.getUserFollowing, [verifyTeam, verifyPrivate]],
    getUserFollowStats: [['query_team'], 'data', node.getUserFollowStats, [verifyTeam]], // 由于是批量查询, verifyPrivate 在 state 中处理，避免一个用户失败导致返回错误
    checkFollowing: [['query_team'], 'data', node.checkFollowing, [verifyTeam]],
    followUser: [['mutate_team'], 'user', node.followUser, [verifyTeam], [createAuditLog]],
    unfollowUser: [['mutate_team'], 'user', node.unfollowUser, [verifyTeam], [createAuditLog]],
    getUser: [['query_team'], 'user', node.getUser, [verifyTeam]],
    getUsersCount: [['query_team'], 'count', node.getUsersCount, [verifyTeam]],
    getUsersCountPerRole: [['query_team'], 'counts', node.getUsersCountPerRole, [verifyTeam]],
    getOwner: [['query_team'], 'user', node.getOwner, [verifyTeam]],
    removeUser: [['mutate_team'], 'user', node.removeUser, [verifyDestroySession, verifyTeam], [createAuditLog]],
    destroySelf: [['mutate_team'], 'user', node.removeUser, [verifyDestroySession, verifyTeam], [createAuditLog]],
    updateUserApproval: [['mutate_team'], 'user', node.updateUserApproval, [verifyTeam], [createAuditLog]],
    updateUserTags: [['mutate_team'], 'user', node.updateUserTags, [verifyTeam], [createAuditLog]],
    updateUserInfo: [
      ['mutate_team'],
      'user',
      node.updateUserInfoAndSync,
      [verifyTeam, sdkVerifyUser],
      [createAuditLog],
    ],
    updateUserExtra: [['mutate_team'], 'user', node.updateUserExtra, [verifyTeam], [createAuditLog]],
    updateUserAddress: [['mutate_team'], 'user', node.updateUserAddress, [verifyTeam, sdkVerifyUser], [createAuditLog]],
    getInvitations: [['query_team'], 'invitations', node.getInvitations, [verifyTeam]],
    createMemberInvitation: [
      ['mutate_team'],
      'inviteInfo',
      node.createMemberInvitation,
      [verifyTeam],
      [createAuditLog],
    ],
    createTransferInvitation: [
      ['mutate_team'],
      'inviteInfo',
      node.createTransferInvitation,
      [verifyTeam],
      [createAuditLog],
    ],
    deleteInvitation: [['mutate_team'], 'invitation', node.deleteInvitation, [verifyTeam], [createAuditLog]],
    switchProfile: [['mutate_team'], 'user', node.switchProfile, [verifyTeam], [createAuditLog]],
    logoutUser: [['mutate_team'], 'user', node.logoutUser, [verifyTeam], [createAuditLog]],
    getUserSessions: [['query_team'], ['list', 'paging'], node.getUserSessions, [verifyTeam]],
    getUserSessionsCount: [['query_team'], 'count', node.getUserSessionsCount, [verifyTeam]],

    // Tagging
    getTags: [['query_team'], ['tags', 'paging'], node.getTags, [verifyTeam]],
    getTag: [['query_team'], 'tag', node.getTag, [verifyTeam]],
    createTag: [['mutate_team'], 'tag', node.createTag, [verifyTeam], [createAuditLog]],
    updateTag: [['mutate_team'], 'tag', node.updateTag, [verifyTeam], [createAuditLog]],
    deleteTag: [['mutate_team'], ['tag', 'moveTo'], node.deleteTag, [verifyTeam], [createAuditLog]],

    // Tagging
    createTagging: [['mutate_team'], 'tagging', node.createTagging, [verifyTeam], [createAuditLog]],
    deleteTagging: [['mutate_team'], 'tagging', node.deleteTagging, [verifyTeam], [createAuditLog]],

    // Team Passport
    getPassportIssuances: [['query_team'], 'list', node.getPassportIssuances, [verifyTeam]],
    createPassportIssuance: [['mutate_team'], 'info', node.createPassportIssuance, [verifyTeam], [createAuditLog]],
    deletePassportIssuance: [
      ['mutate_team'],
      'invitation',
      node.deletePassportIssuance,
      [verifyTeam],
      [createAuditLog],
    ],
    issuePassportToUser: [['mutate_team'], 'user', node.issuePassportToUser, [verifyTeam], [createAuditLog]],
    revokeUserPassport: [['mutate_team'], 'user', node.revokeUserPassport, [verifyTeam], [createAuditLog]],
    enableUserPassport: [['mutate_team'], 'user', node.enableUserPassport, [verifyTeam], [createAuditLog]],
    removeUserPassport: [['mutate_team'], 'user', node.removeUserPassport, [verifyTeam], [createAuditLog]],
    configTrustedPassports: [['mutate_team'], 'info', node.configTrustedPassports, [verifyTeam], [createAuditLog]],
    configTrustedFactories: [['mutate_team'], 'info', node.configTrustedFactories, [verifyTeam], [createAuditLog]],
    configPassportIssuance: [['mutate_team'], 'info', node.configPassportIssuance, [verifyTeam], [createAuditLog]],

    // Team Settings
    addBlockletStore: [
      ['mutate_team'],
      'info',
      node.addBlockletStore,
      [verifyTeam, addBlockletStore],
      [createAuditLog],
    ],
    deleteBlockletStore: [
      ['mutate_team'],
      'info',
      node.deleteBlockletStore,
      [verifyTeam, deleteBlockletStore('scope')],
      [createAuditLog],
    ],

    // Access Keys
    getAccessKeys: [['query_accessKey'], ['list', 'paging'], node.getAccessKeys, [verifyTeam, verifyUser]],
    getAccessKey: [['query_accessKey'], 'data', node.getAccessKey, [verifyTeam]],
    createAccessKey: [['mutate_accessKey'], 'data', node.createAccessKey, [verifyTeam], [createAuditLog]],
    deleteAccessKey: [['mutate_accessKey'], 'data', node.deleteAccessKey, [verifyTeam], [createAuditLog]],
    updateAccessKey: [['mutate_accessKey'], 'data', node.updateAccessKey, [verifyTeam], [createAuditLog]],
    verifyAccessKey: [['query_accessKey'], 'data', node.verifyAccessKey, [verifyTeam]],

    // Router
    getRoutingSites: [['query_router'], 'sites', node.getRoutingSites],
    getRoutingProviders: [['query_router'], 'providers', node.getRoutingProviders],
    isDidDomain: [['query_router', 'query_blocklet'], 'value', node.isDidDomain, []],

    addRoutingSite: [['mutate_router'], 'site', node.addRoutingSite, [], [createAuditLog]],
    deleteRoutingSite: [['mutate_router'], 'site', node.deleteRoutingSite, [], [createAuditLog]],
    updateRoutingSite: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.updateRoutingSite,
      [verifyBlocklet],
      [createAuditLog],
    ],

    addRoutingRule: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.addRoutingRule,
      [verifyBlocklet],
      [createAuditLog],
    ],
    updateRoutingRule: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.updateRoutingRule,
      [verifyBlocklet],
      [createAuditLog],
    ],
    deleteRoutingRule: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.deleteRoutingRule,
      [verifyBlocklet],
      [createAuditLog],
    ],

    addDomainAlias: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.addDomainAlias,
      [verifyBlocklet],
      [createAuditLog],
    ],
    deleteDomainAlias: [
      ['mutate_router', 'mutate_blocklet'],
      'site',
      node.deleteDomainAlias,
      [verifyBlocklet],
      [createAuditLog],
    ],

    checkDomains: [['query_router', 'query_blocklet'], 'result', node.checkDomains, [verifyBlocklet]],
    findCertificateByDomain: [
      ['query_router', 'query_blocklet'],
      'cert',
      node.findCertificateByDomain,
      [verifyBlocklet],
    ],

    // Router Certificates
    getCertificates: [['query_router', 'query_certificate'], 'certificates', node.getCertificates],
    addCertificate: [['mutate_router', 'mutate_certificate'], 'certificate', node.addCertificate, [], [createAuditLog]],
    updateCertificate: [
      ['mutate_router', 'mutate_certificate'],
      'certificate',
      node.updateCertificate,
      [],
      [createAuditLog],
    ],
    deleteCertificate: [
      ['mutate_router', 'mutate_certificate'],
      'certificate',
      node.deleteCertificate,
      [],
      [createAuditLog],
    ],
    issueLetsEncryptCert: [
      ['mutate_certificate', 'mutate_blocklet'],
      'certificate',
      node.issueLetsEncryptCert,
      [verifyBlocklet],
      [createAuditLog],
    ],

    // Gateway
    updateGateway: [['mutate_node'], 'gateway', node.updateGateway, [], [createAuditLog]],
    clearCache: [['mutate_team', 'mutate_node'], 'removed', node.clearCache, [verifyTeam], [createAuditLog]],
    rotateSessionKey: [
      ['mutate_team', 'mutate_node'],
      'removed',
      node.rotateSessionKey,
      [verifyDestroySession],
      [createAuditLog],
    ],

    // Node
    getNodeInfo: [[], 'info', node.getNodeInfo],
    getNodeEnv: [['query_node'], 'info', node.getNodeEnv],
    updateNodeInfo: [['mutate_node'], 'info', node.updateNodeInfo, [], [createAuditLog]],
    upgradeNodeVersion: [
      ['mutate_node'],
      'sessionId',
      node.upgradeNodeVersion,
      [verifyDestroySession],
      [createAuditLog],
    ],
    restartServer: [['mutate_node'], 'sessionId', node.restartServer, [], [createAuditLog]],
    restartAllContainers: [['mutate_node'], 'sessionId', node.restartAllContainers, [], [createAuditLog]],
    checkNodeVersion: [['query_node'], 'version', node.checkNodeVersion],
    resetNode: [['mutate_node'], 'info', node.resetNode],
    getDelegationState: [[], 'state', node.getDelegationState],
    // why use query_node: any member in server can reset node status to running
    resetNodeStatus: [['query_node'], 'info', node.resetNodeStatus],
    getNodeRuntimeHistory: [['query_node'], 'history', node.getNodeRuntimeHistory],

    // Node Session
    getSession: [['query_session'], 'session', node.getSession],
    startSession: [['mutate_session'], 'session', node.startSession],
    updateSession: [['mutate_session'], 'session', node.updateSession],
    endSession: [['mutate_session'], 'session', node.endSession],

    // Notifications
    getNotifications: [
      ['query_notification'],
      ['list', 'paging', 'unreadCount'],
      node.getNotifications,
      [verifyBlocklet, verifyNotificationReceiver],
    ],
    makeAllNotificationsAsRead: [
      ['mutate_notification'],
      'data',
      node.makeAllNotificationsAsRead,
      [verifyBlocklet, verifyNotificationReceiver],
    ],
    readNotifications: [
      ['mutate_notification'],
      'numAffected',
      node.readNotifications,
      [verifyBlocklet, verifyNotificationReceiver],
    ],
    unreadNotifications: [
      ['mutate_notification'],
      'numAffected',
      node.unreadNotifications,
      [verifyBlocklet, verifyNotificationReceiver],
    ],

    getNotificationSendLog: [
      ['query_notification'],
      ['list', 'paging'],
      node.getNotificationSendLog,
      [verifyBlocklet, verifyAdminRole],
    ],
    getReceivers: [['query_notification'], ['list', 'paging'], node.getReceivers, [verifyBlocklet, verifyAdminRole]],

    getNotificationComponents: [
      ['query_notification'],
      'componentDids',
      node.getNotificationComponents,
      [verifyBlocklet, verifyNotificationReceiver],
    ],

    resendNotification: [['mutate_notification'], 'data', node.resendNotification, [verifyBlocklet, verifyAdminRole]],

    // Webhook
    getWebHooks: [['query_webhook'], 'webhooks', node.getWebHooks],
    createWebHook: [['mutate_webhook'], 'webhook', node.createWebHook, [], [createAuditLog]],
    deleteWebHook: [['mutate_webhook'], 'data', node.deleteWebHook, [], [createAuditLog]],
    updateWebHookState: [['mutate_webhook'], 'data', node.updateWebHookState, [], [createAuditLog]],
    getWebhookSenders: [['query_webhook'], 'senders', node.getWebhookSenders],
    sendTestMessage: [['mutate_webhook'], 'data', node.sendTestMessage],

    // Audit logs
    getAuditLogs: [['query_node', 'query_blocklet'], ['list', 'paging'], node.getAuditLogs, [verifyBlocklet]],

    // Insights
    getTrafficInsights: [
      ['query_node', 'query_blocklet'],
      ['list', 'paging'],
      node.getTrafficInsights,
      [verifyBlocklet],
    ],

    // Projects
    getProjects: [['query_blocklet'], ['projects'], node.getProjects, [verifyBlocklet]],
    createProject: [
      ['mutate_blocklet'],
      'project',
      node.createProject,
      [verifyBlocklet, mutateBlocklet],
      [createAuditLog],
    ],
    getProject: [['query_blocklet'], 'project', node.getProject, [verifyBlocklet]],
    updateProject: [['mutate_blocklet'], 'project', node.updateProject, [verifyBlocklet]],
    deleteProject: [['mutate_blocklet'], 'project', node.deleteProject, [verifyBlocklet, notAllowCall]],
    getReleases: [['query_blocklet'], ['releases'], node.getReleases, [verifyBlocklet]],
    getRelease: [['query_blocklet'], 'release', node.getRelease, [verifyBlocklet]],
    createRelease: [
      ['mutate_blocklets', 'mutate_blocklet'],
      'release',
      node.createRelease,
      [verifyBlocklet, createReleaseBlocklet],
      [createAuditLog],
    ],
    deleteRelease: [['mutate_blocklet'], 'release', node.deleteRelease, [verifyBlocklet]],
    publishToStore: [['mutate_blocklet'], 'url', node.publishToStore, [verifyBlocklet]],
    connectToStore: [['mutate_blocklet'], 'url', node.connectToStore, [verifyBlocklet]],
    disconnectFromStore: [
      ['mutate_blocklet'],
      'url',
      node.disconnectFromStore,
      [verifyBlocklet, deleteBlockletStore('storeScope')],
    ],
    connectByStudio: [['mutate_blocklet'], 'url', node.connectByStudio, [verifyBlocklet]],
    getSelectedResources: [['query_blocklet'], 'resources', node.getSelectedResources, [verifyBlocklet]],
    updateSelectedResources: [['mutate_blocklet'], 'resources', node.updateSelectedResources, [verifyBlocklet]],

    getLauncherSession: [[], ['launcherSession', 'error'], node.getLauncherSession],

    // blocklet security rule
    getBlockletSecurityRule: [
      // FIXME: 这里的权限配置不是很清晰，server.admin 需要带 s 结尾的才有对应权限 (query_blocklets, mutate_blocklets)
      ['query_blocklet', 'query_blocklets'],
      'securityRule',
      node.getBlockletSecurityRule,
      [verifyBlocklet],
    ],
    getBlockletSecurityRules: [
      ['query_blocklet', 'query_blocklets'],
      ['securityRules', 'paging'],
      node.getBlockletSecurityRules,
      [verifyBlocklet],
    ],
    addBlockletSecurityRule: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'securityRule',
      node.addBlockletSecurityRule,
      [mutateBlocklet],
      [createAuditLog],
    ],
    updateBlockletSecurityRule: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'securityRule',
      node.updateBlockletSecurityRule,
      [mutateBlocklet],
      [createAuditLog],
    ],
    deleteBlockletSecurityRule: [
      ['mutate_blocklet', 'mutate_blocklets'],
      [],
      node.deleteBlockletSecurityRule,
      [mutateBlocklet],
      [createAuditLog],
    ],
    // blocklet security response header policy
    getBlockletResponseHeaderPolicy: [
      ['query_blocklet', 'query_blocklets'],
      'responseHeaderPolicy',
      node.getBlockletResponseHeaderPolicy,
      [verifyBlocklet],
    ],
    getBlockletResponseHeaderPolicies: [
      ['query_blocklet', 'query_blocklets'],
      ['responseHeaderPolicies', 'paging'],
      node.getBlockletResponseHeaderPolicies,
      [verifyBlocklet],
    ],
    addBlockletResponseHeaderPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'responseHeaderPolicy',
      node.addBlockletResponseHeaderPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],
    updateBlockletResponseHeaderPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'responseHeaderPolicy',
      node.updateBlockletResponseHeaderPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],
    deleteBlockletResponseHeaderPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      [],
      node.deleteBlockletResponseHeaderPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],
    // blocklet security access policy
    getBlockletAccessPolicy: [
      ['query_blocklet', 'query_blocklets'],
      'accessPolicy',
      node.getBlockletAccessPolicy,
      [verifyBlocklet],
    ],
    getBlockletAccessPolicies: [
      ['query_blocklet', 'query_blocklets'],
      ['accessPolicies', 'paging'],
      node.getBlockletAccessPolicies,
      [verifyBlocklet],
    ],
    addBlockletAccessPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'accessPolicy',
      node.addBlockletAccessPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],
    updateBlockletAccessPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'accessPolicy',
      node.updateBlockletAccessPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],
    deleteBlockletAccessPolicy: [
      ['mutate_blocklet', 'mutate_blocklets'],
      [],
      node.deleteBlockletAccessPolicy,
      [mutateBlocklet],
      [createAuditLog],
    ],

    getWebhookEndpoints: [
      ['query_blocklet', 'query_blocklets'],
      ['list', 'paging'],
      node.getWebhookEndpoints,
      [verifyBlocklet],
    ],
    getWebhookEndpoint: [['query_blocklet', 'query_blocklets'], ['data'], node.getWebhookEndpoint, [verifyBlocklet]],
    createWebhookEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.createWebhookEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    updateWebhookEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.updateWebhookEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    deleteWebhookEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.deleteWebhookEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    getWebhookAttempts: [
      ['query_blocklet', 'query_blocklets'],
      ['list', 'paging'],
      node.getWebhookAttempts,
      [verifyBlocklet],
    ],
    retryWebhookAttempt: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.retryWebhookAttempt,
      [mutateBlocklet],
      [createAuditLog],
    ],
    regenerateWebhookEndpointSecret: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'secret',
      node.regenerateWebhookEndpointSecret,
      [mutateBlocklet],
      [createAuditLog],
    ],

    // passport
    getPassportRoleCounts: [
      ['query_blocklet', 'query_blocklets'],
      'counts',
      node.getPassportRoleCounts,
      [verifyBlocklet],
    ],

    getPassportsByRole: [
      ['query_blocklet', 'query_blocklets'],
      ['passports', 'paging'],
      node.getPassportsByRole,
      [verifyBlocklet],
    ],

    getPassportLogs: [
      ['query_blocklet', 'query_blocklets'],
      ['passportLogs', 'paging'],
      node.getPassportLogs,
      [verifyBlocklet],
    ],
    getRelatedPassports: [
      ['query_blocklet', 'query_blocklets'],
      ['passports', 'paging'],
      node.getRelatedPassports,
      [verifyBlocklet],
    ],

    getBlockletBaseInfo: [
      ['query_blocklet', 'query_blocklets'],
      ['user', 'passport', 'backup', 'appRuntimeInfo', 'traffic', 'integrations', 'studio'],
      node.getBlockletBaseInfo,
      [verifyBlocklet],
    ],

    addUploadEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.addUploadEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    deleteUploadEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.deleteUploadEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    connectToEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'url',
      node.connectToEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    connectToAigne: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'url',
      node.connectToAigne,
      [mutateBlocklet],
      [createAuditLog],
    ],
    disconnectToAigne: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.disconnectToAigne,
      [mutateBlocklet],
      [createAuditLog],
    ],
    verifyAigneConnection: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.verifyAigneConnection,
      [mutateBlocklet],
    ],
    disconnectFromEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'data',
      node.disconnectFromEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    publishToEndpoint: [
      ['mutate_blocklet', 'mutate_blocklets'],
      'url',
      node.publishToEndpoint,
      [mutateBlocklet],
      [createAuditLog],
    ],
    getDomainDNS: [
      ['query_blocklet', 'query_blocklets'],
      ['isDnsResolved', 'hasCname', 'isCnameMatch', 'error'],
      node.getDomainDNS,
      [verifyBlocklet],
    ],
    getOAuthClients: [['query_team'], ['list', 'paging'], node.getOAuthClients, [verifyBlocklet]],
    deleteOAuthClient: [['mutate_team'], 'data', node.deleteOAuthClient, [verifyBlocklet]],
    createOAuthClient: [['mutate_team'], 'data', node.createOAuthClient, [verifyBlocklet]],
    updateOAuthClient: [['mutate_team'], 'data', node.updateOAuthClient, [verifyBlocklet]],
  };

  return Object.freeze(
    Object.keys(configs).reduce((acc, k) => {
      const [permissions, dataKeys, handler, preHooks = [], postHooks = []] = configs[k];
      acc[k] = wrap([permissions, dataKeys, handler, preHooks, postHooks, k, node]);
      return acc;
    }, {})
  );
};

module.exports = genConfig;
