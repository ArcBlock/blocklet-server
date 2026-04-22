const fs = require('fs-extra');
const path = require('path');
const get = require('lodash/get');
const uniq = require('lodash/uniq');
const md5 = require('@abtnode/util/lib/md5');
const formatContext = require('@abtnode/util/lib/format-context');
const Cron = require('@abtnode/cron');

const logger = require('@abtnode/logger')('@abtnode/core');
const { fromBlockletStatus, toBlockletStatus, fromBlockletSource, toBlockletSource } = require('@blocklet/constant');
const { listProviders } = require('@abtnode/router-provider');
const { DEFAULT_CERTIFICATE_EMAIL, EVENTS } = require('@abtnode/constant');
const { CustomError } = require('@blocklet/error');

const { isWorkerInstance } = require('@abtnode/util/lib/pm2/is-instance-worker');
const BlockletManager = require('./blocklet/manager/disk');
const RouterManager = require('./router/manager');
const getRouterHelpers = require('./router/helper');
const TeamManager = require('./team/manager');
const NodeAPI = require('./api/node');
const TeamAPI = require('./api/team');
const {
  getLauncherSession,
  isLauncherSessionConsumed,
  setupAppOwner,
  launchBlockletByLauncher,
  launchBlockletWithoutWallet,
} = require('./util/launcher');
const WebHook = require('./webhook');
const states = require('./states');
const Cert = require('./cert');

const IP = require('./util/ip');
const DomainStatus = require('./util/domain-status');
const Maintain = require('./util/maintain');
const resetNode = require('./util/reset-node');
const DiskMonitor = require('./crons/monitor-disk-usage');
const LogRotator = require('./crons/rotate-pm2-logs');
const VersionChecker = require('./crons/check-new-version');
const StoreUtil = require('./util/store');
const createQueue = require('./util/queue');
const createEvents = require('./event');
const pm2Events = require('./blocklet/manager/pm2-events');
const { createStateReadyQueue, createStateReadyHandler } = require('./util/ready');
const { createDataArchive } = require('./util/blocklet');
const { toStatus, fromStatus, ensureDataDirs, getQueueConcurrencyByMem, getStateCrons } = require('./util');
const { clearCache } = require('./util/cache');
const getMetaFromUrl = require('./util/get-meta-from-url');
const getDynamicComponents = require('./util/get-dynamic-components');
const SecurityAPI = require('./blocklet/security');
const WebhookAPI = require('./blocklet/webhook');
const PassportAPI = require('./blocklet/passport');
const dockerRestartAllContainers = require('./util/docker/docker-restart-all-containers');
const RouterBlocker = require('./router/security/blocker');
const BlockletVault = require('./blocklet/security/vault');

const { getScope } = require('./util/audit-log');
const { migrateAuditLog } = require('./util/post-start-tasks/migrate-audit-log');

/**
 * @typedef {{} & import('./api/team')}} TNode
 */

/**
 * @param {object} options
 *   nodeSk, nodePk, nodeDid, nodeOwner: {pk, did}
 *   name, description
 *   dataDir
 *   port
 *   blockletPort
 *   routing: {}
 *   docker
 *   mode
 *   version
 *   runtimeConfig: {}
 *   autoUpgrade
 *   registerUrl
 *   webWalletUrl
 * @returns {ABTNode}
 */
function ABTNode(options) {
  if (!options.dataDir) {
    throw new Error('Can not initialize ABTNode without dataDir');
  }

  const ekFile = path.join(options.dataDir, '.sock');
  if (fs.existsSync(ekFile)) {
    options.dek = fs.readFileSync(ekFile);
  }

  if (typeof options.daemon === 'undefined') {
    options.daemon = false;
  }

  // 0. ensure data dirs
  const dataDirs = ensureDataDirs(options.dataDir);

  // 1. initialize storage
  states.init(dataDirs, options);

  // 2. initialize queues
  const concurrency = getQueueConcurrencyByMem();
  logger.info('startup and installation queue currency', { concurrency });

  // 2.1 initialize the start queue
  const startQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'jobs',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
      concurrency,
    },
  });

  // 2.2 initialize the install queue
  const installQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'install_queue',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      maxRetries: 3,
      retryDelay: 5000, // retry after 5 seconds
      maxTimeout: 60 * 1000 * 15, // throw timeout error after 15 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  const backupQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'backup_queue',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      // 备份自带重试机制
      maxRetries: 0,
      retryDelay: 10000, // retry after 10 seconds
      maxTimeout: 60 * 1000 * 60, // throw timeout error after 60 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
      enableScheduledJob: true,
    },
  });

  const restoreQueue = createQueue({
    daemon: options.daemon,
    name: 'restore_queue',
    model: states.job,
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      // 自带重试机制
      maxRetries: 0,
      retryDelay: 10000, // retry after 10 seconds
      maxTimeout: 60 * 1000 * 60, // throw timeout error after 60 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  const checkUpdateQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'check_update_queue',
    onJob: async (job) => {
      // eslint-disable-next-line no-use-before-define
      if (typeof blockletManager.onJob === 'function') {
        // eslint-disable-next-line no-use-before-define
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      maxRetries: 0,
      retryDelay: 10000, // retry after 10 seconds
      maxTimeout: 60 * 1000 * 60, // throw timeout error after 60 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
      enableScheduledJob: true,
    },
  });

  const reportComponentUsageQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'report_component_usage_queue',
    onJob: async (job) => {
      /* eslint-disable no-use-before-define */

      if (typeof blockletManager.onJob === 'function') {
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      maxRetries: 30,
      retryDelay: 60 * 1000, // retry after 1 minute
      maxTimeout: 60 * 1000 * 30, // throw timeout error after 15 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  const passportIssueQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'passport_issue_queue',
    onJob: async (job) => {
      if (typeof teamAPI.onJob === 'function') {
        await teamAPI.onJob(job);
      }
    },
    options: {
      concurrency,
      maxRetries: 30,
      retryDelay: 60 * 1000, // retry after 1 minute
      maxTimeout: 60 * 1000 * 30, // throw timeout error after 30 minutes
    },
  });

  // 3. init team manager
  const teamManager = new TeamManager({ nodeDid: options.nodeDid, dataDirs, states });

  /**
   * 重发消息队列
   */
  const resendNotificationQueue = createQueue({
    daemon: options.daemon,
    model: states.job,
    name: 'resend_notification_queue',
    onJob: async (job) => {
      if (typeof blockletManager.onJob === 'function') {
        await blockletManager.onJob(job);
      }
    },
    options: {
      concurrency,
      maxRetries: 30,
      retryDelay: 60 * 1000, // retry after 1 minute
      maxTimeout: 60 * 1000 * 30, // throw timeout error after 15 minutes
      id: (job) => (job ? md5(`${job.entity}-${job.action}-${job.id}`) : ''),
    },
  });

  const certManager = new Cert({
    maintainerEmail: DEFAULT_CERTIFICATE_EMAIL,
    dataDir: dataDirs.certManagerModule,
    states,
    teamManager,
  });

  // 4. init routing manager
  const routerManager = new RouterManager({ certManager, dataDirs });

  const nodeAPI = new NodeAPI(states, options.nodeDid);
  const passportAPI = new PassportAPI({ states, teamManager, nodeAPI, teamDid: options.nodeDid });
  const teamAPI = new TeamAPI({ states, teamManager, dataDirs, nodeAPI, passportAPI, passportIssueQueue });

  // 5. init blocklet manager
  const blockletManager = new BlockletManager({
    dataDirs,
    startQueue,
    installQueue,
    backupQueue,
    restoreQueue,
    checkUpdateQueue,
    reportComponentUsageQueue,
    resendNotificationQueue,
    daemon: options.daemon,
    teamManager,
    nodeAPI,
    teamAPI,
    certManager,
    routerManager,
  });
  blockletManager.setMaxListeners(0);
  const securityAPI = new SecurityAPI({ teamManager, blockletManager });
  const webhookAPI = new WebhookAPI({ states, teamManager, teamAPI });

  const {
    handleBlockletWafChange,
    handleBlockletRouting,
    handleSystemRouting,
    handleAllRouting,
    resetSiteByDid,
    getRoutingSites,
    ensureDashboardRouting,
    ensureBlockletRouting,
    ensureBlockletRoutingForUpgrade,
    removeBlockletRouting,
    getCertificates,
    getSitesFromState,
    getRoutingCrons,
    ensureWildcardCerts,
    ensureServerlessCerts,
    getRouterProvider,
    addRoutingSite,
    deleteRoutingSite,
    updateRoutingSite,
    addRoutingRule,
    addRoutingRuleToDefaultSite,
    updateRoutingRule,
    deleteRoutingRule,
    addDomainAlias,
    deleteDomainAlias,
    getGatewayBlacklist,
  } = getRouterHelpers({
    dataDirs,
    routerManager,
    blockletManager,
    certManager,
    teamManager,
    daemon: options.daemon,
  });

  blockletManager.resetSiteByDid = resetSiteByDid;

  // Generate an on node ready callback
  const onStatesReady = createStateReadyQueue({ states: states.allStates, options, dataDirs });
  onStatesReady(createStateReadyHandler());
  const domainStatus = new DomainStatus({ routerManager, states });

  const isInitialized = async () => {
    const state = await states.node.read();
    return states.node.isInitialized(state);
  };

  const checkNodeVersion = () => VersionChecker.checkNewVersion(teamManager);

  const instance = {
    logger,
    dataDirs,
    toBlockletStatus,
    fromBlockletStatus,
    toBlockletSource,
    fromBlockletSource,

    toStatus,
    fromStatus,

    states,
    getUserState: teamManager.getUserState.bind(teamManager),
    getOAuthState: teamManager.getOAuthState.bind(teamManager),
    destroyTeamStates: teamManager.deleteTeam.bind(teamManager),
    createTeamStates: teamManager.initTeam.bind(teamManager),

    onReady: onStatesReady,

    getSessionSecret: nodeAPI.getSessionSecret.bind(nodeAPI),

    // Blocklet manager
    installBlocklet: blockletManager.install.bind(blockletManager),
    installComponent: blockletManager.installComponent.bind(blockletManager),
    startBlocklet: blockletManager.start.bind(blockletManager),
    stopBlocklet: blockletManager.stop.bind(blockletManager),
    reloadBlocklet: blockletManager.reload.bind(blockletManager),
    restartBlocklet: blockletManager.restart.bind(blockletManager),
    deleteBlocklet: blockletManager.delete.bind(blockletManager),
    deleteComponent: blockletManager.deleteComponent.bind(blockletManager),
    cancelDownloadBlocklet: blockletManager.cancelDownload.bind(blockletManager),
    configBlocklet: blockletManager.config.bind(blockletManager),
    devBlocklet: blockletManager.dev.bind(blockletManager),
    checkComponentsForUpdates: blockletManager.checkComponentsForUpdates.bind(blockletManager),
    upgradeComponents: blockletManager.upgradeComponents.bind(blockletManager),
    getBlockletDomainAliases: blockletManager.getDomainAliases.bind(blockletManager),
    resetBlocklet: blockletManager.reset.bind(blockletManager),
    deleteBlockletProcess: blockletManager.deleteProcess.bind(blockletManager),
    configNavigations: blockletManager.configNavigations.bind(blockletManager),
    configTheme: blockletManager.configTheme.bind(blockletManager),
    configAuthentication: blockletManager.configAuthentication.bind(blockletManager),
    migrateBlockletAuthentication: blockletManager.migrateBlockletAuthentication.bind(blockletManager),
    configDidConnect: blockletManager.configDidConnect.bind(blockletManager),
    configDidConnectActions: blockletManager.configDidConnectActions.bind(blockletManager),
    joinFederatedLogin: blockletManager.joinFederatedLogin.bind(blockletManager),
    quitFederatedLogin: blockletManager.quitFederatedLogin.bind(blockletManager),
    disbandFederatedLogin: blockletManager.disbandFederatedLogin.bind(blockletManager),
    auditFederatedLogin: blockletManager.auditFederatedLogin.bind(blockletManager),
    setFederated: blockletManager.setFederated.bind(blockletManager),
    syncFederated: blockletManager.syncFederated.bind(blockletManager),
    loginFederated: blockletManager.loginFederated.bind(blockletManager),
    syncMasterAuthorization: blockletManager.syncMasterAuthorization.bind(blockletManager),
    syncFederatedConfig: blockletManager.syncFederatedConfig.bind(blockletManager),
    configNotification: blockletManager.configNotification.bind(blockletManager),
    sendEmail: blockletManager.sendEmail.bind(blockletManager),
    sendPush: blockletManager.sendPush.bind(blockletManager),
    updateAppSessionConfig: blockletManager.updateAppSessionConfig.bind(blockletManager),
    updateComponentTitle: blockletManager.updateComponentTitle.bind(blockletManager),
    updateComponentMountPoint: blockletManager.updateComponentMountPoint.bind(blockletManager),
    backupBlocklet: blockletManager.backupBlocklet.bind(blockletManager),
    abortBlockletBackup: blockletManager.abortBlockletBackup.bind(blockletManager),
    restoreBlocklet: blockletManager.restoreBlocklet.bind(blockletManager),
    importBlocklet: blockletManager.importBlocklet.bind(blockletManager),
    migrateApplicationToStructV2: blockletManager.migrateApplicationToStructV2.bind(blockletManager),
    syncAppConfig: blockletManager.syncAppConfig.bind(blockletManager),
    setBlockletBlurhash: blockletManager.setBlockletBlurhash.bind(blockletManager),
    getBlockletBlurhash: blockletManager.getBlockletBlurhash.bind(blockletManager),

    // blocklet project
    createProject: blockletManager.createProject.bind(blockletManager),
    deleteProject: blockletManager.deleteProject.bind(blockletManager),
    getProjects: blockletManager.getProjects.bind(blockletManager),
    getProject: blockletManager.getProject.bind(blockletManager),
    updateProject: blockletManager.updateProject.bind(blockletManager),
    createRelease: blockletManager.createRelease.bind(blockletManager),
    connectToStore: blockletManager.connectToStore.bind(blockletManager),
    disconnectFromStore: blockletManager.disconnectFromStore.bind(blockletManager),
    connectByStudio: blockletManager.connectByStudio.bind(blockletManager),
    publishToStore: blockletManager.publishToStore.bind(blockletManager),
    getReleases: blockletManager.getReleases.bind(blockletManager),
    getRelease: blockletManager.getRelease.bind(blockletManager),
    deleteRelease: blockletManager.deleteRelease.bind(blockletManager),
    getSelectedResources: blockletManager.getSelectedResources.bind(blockletManager),
    updateSelectedResources: blockletManager.updateSelectedResources.bind(blockletManager),

    // For diagnose purpose
    syncBlockletStatus: blockletManager.status.bind(blockletManager),
    ensureBlockletIntegrity: blockletManager.ensureBlocklet.bind(blockletManager),

    getBlocklets: blockletManager.list.bind(blockletManager),
    getBlockletsFromBackup: blockletManager.listBackups.bind(blockletManager),
    getBlocklet: blockletManager.detail.bind(blockletManager),
    getBlockletDiff: blockletManager.diff.bind(blockletManager),
    hasBlocklet: blockletManager.hasBlocklet.bind(blockletManager),
    getBlockletEnvironments: blockletManager.getBlockletEnvironments.bind(blockletManager),
    updateAllBlockletEnvironment: blockletManager.updateAllBlockletEnvironment.bind(blockletManager),
    setBlockletInitialized: blockletManager.setInitialized.bind(blockletManager),
    setBlockletOwner: blockletManager.updateOwner.bind(blockletManager),
    setBlockletStatus: blockletManager.setBlockletStatus.bind(blockletManager),
    updateBlockletOwner: blockletManager.updateOwner.bind(blockletManager),
    updateBlockletVault: blockletManager.updateVault.bind(blockletManager),
    getBlockletRuntimeHistory: blockletManager.getRuntimeHistory.bind(blockletManager),

    // blocklet spaces gateways
    addBlockletSpaceGateway: blockletManager.addBlockletSpaceGateway.bind(blockletManager),
    deleteBlockletSpaceGateway: blockletManager.deleteBlockletSpaceGateway.bind(blockletManager),
    updateBlockletSpaceGateway: blockletManager.updateBlockletSpaceGateway.bind(blockletManager),
    getBlockletSpaceGateways: blockletManager.getBlockletSpaceGateways.bind(blockletManager),

    updateUserSpaceHosts: blockletManager.updateUserSpaceHosts.bind(blockletManager),
    getUserSpaceHosts: blockletManager.getUserSpaceHosts.bind(blockletManager),

    // auto backup related
    updateAutoBackup: blockletManager.updateAutoBackup.bind(blockletManager),
    getBlockletBackups: blockletManager.getBlockletBackups.bind(blockletManager),
    getBlockletBackupSummary: blockletManager.getBlockletBackupSummary.bind(blockletManager),

    // check update
    updateAutoCheckUpdate: blockletManager.updateAutoCheckUpdate.bind(blockletManager),

    // Store
    getBlockletMeta: StoreUtil.getBlockletMeta,
    getStoreMeta: StoreUtil.getStoreMeta,

    // Node State
    getNodeInfo: nodeAPI.getInfo.bind(nodeAPI),
    getNodeEnv: nodeAPI.getEnv.bind(nodeAPI),
    getServerProviders: nodeAPI.getServerProviders.bind(nodeAPI),
    updateNodeInfo: nodeAPI.updateNodeInfo.bind(nodeAPI),
    getDelegationState: nodeAPI.getDelegationState.bind(nodeAPI),
    cleanupDirtyMaintainState: states.node.cleanupDirtyMaintainState.bind(states.node),
    updateNodeOwner: states.node.updateNodeOwner.bind(states.node),
    updateNftHolder: states.node.updateNftHolder.bind(states.node),
    isInitialized,
    resetNode: (params, context) =>
      resetNode({ params, context, blockletManager, routerManager, handleAllRouting, teamManager, certManager }),
    updateNodeStatus: states.node.updateStatus.bind(states.node),
    resetNodeStatus: states.node.resetStatus.bind(states.node),

    // Gateway
    updateGateway: nodeAPI.updateGateway.bind(nodeAPI),
    clearCache: (params) => clearCache(params, instance, blockletManager),

    // Team && Access control

    // Invitation
    createMemberInvitation: teamAPI.createMemberInvitation.bind(teamAPI),
    getInvitation: teamAPI.getInvitation.bind(teamAPI),
    getInvitations: teamAPI.getInvitations.bind(teamAPI),
    checkInvitation: teamAPI.checkInvitation.bind(teamAPI),
    deleteInvitation: teamAPI.deleteInvitation.bind(teamAPI),
    closeInvitation: teamAPI.closeInvitation.bind(teamAPI),

    // transfer
    createTransferAppOwnerSession: teamAPI.createTransferAppOwnerSession.bind(teamAPI),
    getTransferAppOwnerSession: teamAPI.getTransferAppOwnerSession.bind(teamAPI),
    checkTransferAppOwnerSession: teamAPI.checkTransferAppOwnerSession.bind(teamAPI),
    closeTransferAppOwnerSession: teamAPI.closeTransferAppOwnerSession.bind(teamAPI),
    createTransferInvitation: teamAPI.createTransferInvitation.bind(teamAPI),

    // Account
    getUsers: teamAPI.getUsers.bind(teamAPI),
    getUsersCount: teamAPI.getUsersCount.bind(teamAPI),
    getUserSessions: teamAPI.getUserSessions.bind(teamAPI),
    getUserSessionsCount: teamAPI.getUserSessionsCount.bind(teamAPI),
    getUsersCountPerRole: teamAPI.getUsersCountPerRole.bind(teamAPI),
    getUser: teamAPI.getUser.bind(teamAPI),
    getConnectedAccount: teamAPI.getConnectedAccount.bind(teamAPI),
    getOwner: teamAPI.getOwner.bind(teamAPI),
    getNodeUsers: () => teamAPI.getUsers({ teamDid: options.nodeDid }),
    getNodeUser: (user, _options) => teamAPI.getUser({ teamDid: options.nodeDid, user, options: _options }),
    addUser: teamAPI.addUser.bind(teamAPI),
    loginUser: teamAPI.loginUser.bind(teamAPI),
    disconnectUserAccount: teamAPI.disconnectUserAccount.bind(teamAPI),
    removeUser: teamAPI.removeUser.bind(teamAPI),
    updateUser: teamAPI.updateUser.bind(teamAPI),
    updateUserInfoAndSync: blockletManager.updateUserInfoAndSync.bind(blockletManager),
    updateUserTags: teamAPI.updateUserTags.bind(teamAPI),
    updateUserExtra: blockletManager.updateUserExtra.bind(blockletManager),
    updateUserApproval: teamAPI.updateUserApproval.bind(teamAPI),
    getUserByDid: teamAPI.getUserByDid.bind(teamAPI),
    isPassportValid: teamAPI.isPassportValid.bind(teamAPI),
    isConnectedAccount: teamAPI.isConnectedAccount.bind(teamAPI),
    isEmailUsed: teamAPI.isEmailUsed.bind(teamAPI),
    isPhoneUsed: teamAPI.isPhoneUsed.bind(teamAPI),
    switchProfile: teamAPI.switchProfile.bind(teamAPI),
    rotateSessionKey: teamAPI.rotateSessionKey.bind(teamAPI),
    sendPassportVcNotification: TeamAPI.sendPassportVcNotification,
    updateUserAddress: blockletManager.updateUserInfoAndSync.bind(blockletManager),

    // user-session
    getUserSession: teamAPI.getUserSession.bind(teamAPI),
    upsertUserSession: teamAPI.upsertUserSession.bind(teamAPI),
    syncUserSession: teamAPI.syncUserSession.bind(teamAPI),
    logoutUser: teamAPI.logoutUser.bind(teamAPI),
    getPassportById: teamAPI.getPassportById.bind(teamAPI),
    getPassportFromFederated: teamAPI.getPassportFromFederated.bind(teamAPI),

    // user follow
    followUser: (params, context) => teamAPI.userFollowAction({ ...params, action: 'follow' }, context),
    unfollowUser: (params, context) => teamAPI.userFollowAction({ ...params, action: 'unfollow' }, context),

    getUserFollowers: (params, context) => teamAPI.getUserFollows({ ...params, type: 'followers' }, context),
    getUserFollowing: (params, context) => teamAPI.getUserFollows({ ...params, type: 'following' }, context),
    getUserFollowStats: teamAPI.getUserFollowStats.bind(teamAPI),
    checkFollowing: teamAPI.checkFollowing.bind(teamAPI),

    // invite
    getUserInvites: teamAPI.getUserInvites.bind(teamAPI),

    // Tagging
    getTag: teamAPI.getTag.bind(teamAPI),
    createTag: teamAPI.createTag.bind(teamAPI),
    updateTag: teamAPI.updateTag.bind(teamAPI),
    deleteTag: teamAPI.deleteTag.bind(teamAPI),
    getTags: teamAPI.getTags.bind(teamAPI),

    createTagging: teamAPI.createTagging.bind(teamAPI),
    deleteTagging: teamAPI.deleteTagging.bind(teamAPI),
    // Org
    createOrg: teamAPI.createOrg.bind(teamAPI),
    updateOrg: teamAPI.updateOrg.bind(teamAPI),
    deleteOrg: teamAPI.deleteOrg.bind(teamAPI),
    getOrgs: teamAPI.getOrgs.bind(teamAPI),
    getOrg: teamAPI.getOrg.bind(teamAPI),
    // Org Member
    getOrgMembers: teamAPI.getOrgMembers.bind(teamAPI),
    addOrgMember: teamAPI.addOrgMember.bind(teamAPI), // 加入的方式是通过邀请，因此不能批量添加
    updateOrgMember: teamAPI.updateOrgMember.bind(teamAPI), // 加入的方式是通过邀请，因此不能批量添加
    removeOrgMember: teamAPI.removeOrgMember.bind(teamAPI),
    getOrgInvitableUsers: teamAPI.getOrgInvitableUsers.bind(teamAPI),
    inviteMembersToOrg: teamAPI.inviteMembersToOrg.bind(teamAPI), // TODO: 批量邀请用户到组织 与 addOrgMember 可能重复

    // org resource
    getOrgResource: teamAPI.getOrgResource.bind(teamAPI),
    addOrgResource: teamAPI.addOrgResource.bind(teamAPI),
    migrateOrgResource: teamAPI.migrateOrgResource.bind(teamAPI),

    // Access Control
    getRBAC: (did = options.nodeDid) => teamManager.getRBAC(did),

    getRoles: teamAPI.getRoles.bind(teamAPI),
    getRole: teamAPI.getRole.bind(teamAPI),
    createRole: teamAPI.createRole.bind(teamAPI),
    updateRole: teamAPI.updateRole.bind(teamAPI),
    deleteRole: teamAPI.deleteRole.bind(teamAPI),

    getPermissions: teamAPI.getPermissions.bind(teamAPI),
    createPermission: teamAPI.createPermission.bind(teamAPI),
    updatePermission: teamAPI.updatePermission.bind(teamAPI),
    deletePermission: teamAPI.deletePermission.bind(teamAPI),

    grantPermissionForRole: teamAPI.grant.bind(teamAPI),
    revokePermissionFromRole: teamAPI.revoke.bind(teamAPI),
    updatePermissionsForRole: teamAPI.updateGrants.bind(teamAPI),
    getPermissionsByRole: teamAPI.getPermissionsByRole.bind(teamAPI),
    hasPermission: teamAPI.hasPermission.bind(teamAPI),

    // Passport
    revokeUserPassport: teamAPI.revokeUserPassport.bind(teamAPI),
    enableUserPassport: teamAPI.enableUserPassport.bind(teamAPI),
    removeUserPassport: teamAPI.removeUserPassport.bind(teamAPI),
    issuePassportToUser: teamAPI.issuePassportToUser.bind(teamAPI),

    createPassportIssuance: teamAPI.createPassportIssuance.bind(teamAPI),
    getPassportIssuances: teamAPI.getPassportIssuances.bind(teamAPI),
    getPassportIssuance: teamAPI.getPassportIssuance.bind(teamAPI),
    deletePassportIssuance: teamAPI.deletePassportIssuance.bind(teamAPI),
    processPassportIssuance: teamAPI.processPassportIssuance.bind(teamAPI),
    configTrustedPassports: teamAPI.configTrustedPassports.bind(teamAPI),
    configTrustedFactories: teamAPI.configTrustedFactories.bind(teamAPI),
    configPassportIssuance: teamAPI.configPassportIssuance.bind(teamAPI),

    // KYC
    createVerifyCode: teamAPI.createVerifyCode.bind(teamAPI),
    sendVerifyCode: teamAPI.sendVerifyCode.bind(teamAPI),
    consumeVerifyCode: teamAPI.consumeVerifyCode.bind(teamAPI),
    issueVerifyCode: teamAPI.issueVerifyCode.bind(teamAPI),
    getVerifyCode: teamAPI.getVerifyCode.bind(teamAPI),
    isSubjectSent: teamAPI.isSubjectSent.bind(teamAPI),
    isSubjectVerified: teamAPI.isSubjectVerified.bind(teamAPI),
    isSubjectIssued: teamAPI.isSubjectIssued.bind(teamAPI),

    // Team Settings
    addBlockletStore: teamAPI.addStore.bind(teamAPI),
    deleteBlockletStore: teamAPI.deleteStore.bind(teamAPI),

    addUploadEndpoint: teamAPI.addEndpoint.bind(teamAPI),
    deleteUploadEndpoint: teamAPI.deleteEndpoint.bind(teamAPI),
    connectToEndpoint: blockletManager.connectToEndpoint.bind(blockletManager),
    connectToAigne: blockletManager.connectToAigne.bind(blockletManager),
    disconnectToAigne: blockletManager.disconnectToAigne.bind(blockletManager),
    verifyAigneConnection: blockletManager.verifyAigneConnection.bind(blockletManager),
    disconnectFromEndpoint: blockletManager.disconnectFromEndpoint.bind(blockletManager),
    publishToEndpoint: blockletManager.publishToEndpoint.bind(blockletManager),

    // ServerBlocklet Notifications
    createNotification: teamAPI.createNotification.bind(teamAPI),
    getNotifications: teamAPI.getNotification.bind(teamAPI),
    readNotifications: teamAPI.readNotifications.bind(teamAPI),
    unreadNotifications: teamAPI.unreadNotifications.bind(teamAPI),
    getNotificationById: teamAPI.getNotificationById.bind(teamAPI),
    getNotificationsUnreadCount: teamAPI.getNotificationsUnreadCount.bind(teamAPI),
    createNotificationReceiver: teamAPI.createNotificationReceiver.bind(teamAPI),
    makeAllNotificationsAsRead: teamAPI.markAllNotificationsAsRead.bind(teamAPI),
    updateNotificationStatus: teamAPI.updateNotificationStatus.bind(teamAPI),
    getNotificationSendLog: teamAPI.getNotificationSendLog.bind(teamAPI),
    getNotificationComponents: teamAPI.getNotificationComponents.bind(teamAPI),
    resendNotification: blockletManager.resendNotification.bind(blockletManager),
    getReceivers: teamAPI.getReceivers.bind(teamAPI),
    getNotificationStats: teamAPI.getNotificationStats.bind(teamAPI),

    // AuditLog
    createAuditLog: async (params) => {
      if (!params || !params.args) {
        throw new CustomError(400, 'Invalid audit log parameters');
      }
      const teamDid = getScope(params.args) || options.nodeDid;
      if (!teamDid) {
        throw new CustomError(400, 'teamDid is required for audit log creation.');
      }
      // 特殊情况处理：deleteBlocklet/installBlocklet 或 server 自身操作
      if (['deleteBlocklet', 'installBlocklet'].includes(params.action) || teamDid === options.nodeDid) {
        const result = await states.auditLog.create(params, instance);
        // 如果是 installBlocklet, 不需要提前返回， 要将 log 记录在 service 中
        // 如果是 deleteBlocklet, 需要提前返回，因为 deleteBlocklet 会触发 blocklet 的删除，不需要再往 service 的auditLog 表中插入记录了
        if (params.action !== 'installBlocklet') {
          return result;
        }
      }
      const state = await teamManager.getAuditLogState(teamDid);
      return state.create(params, instance);
    },
    getAuditLogs: async (params) => {
      const auditLogState = await teamManager.getAuditLogState(params.scope || options.nodeDid);
      if (params.scope) {
        const blocklet = await states.blocklet.getBlocklet(params.scope);
        if (blocklet) {
          params.scope = uniq(
            [
              params.scope,
              blocklet.appDid,
              blocklet.appPid,
              blocklet.structV1Did,
              ...blocklet.migratedFrom.map((x) => x.appDid),
            ].filter(Boolean)
          );
        }
      }

      return auditLogState.findPaginated.call(auditLogState, params);
    },

    // Insights
    getTrafficInsights: states.trafficInsight.findPaginated.bind(states.trafficInsight),

    // Routing
    routerManager,
    addRoutingSite,
    deleteRoutingSite,
    updateRoutingSite,
    addRoutingRule,
    addRoutingRuleToDefaultSite,
    updateRoutingRule,
    deleteRoutingRule,
    getRoutingRuleById: states.site.getRuleById.bind(states.site),
    getRoutingSites: (params, context) => getRoutingSites(params, context, { withDefaultCors: false }),
    getSitesFromState,
    ensureDashboardRouting,
    ensureWildcardCerts,
    ensureServerlessCerts,

    addDomainAlias,
    deleteDomainAlias,
    isDidDomain: routerManager.isDidDomain.bind(routerManager),
    getGatewayBlacklist,

    getRoutingProviders: () => listProviders(dataDirs.router),
    checkDomains: domainStatus.checkDomainsStatus.bind(domainStatus),

    handleSystemRouting,
    handleBlockletRouting,
    handleAllRouting,

    certManager,
    updateCertificate: certManager.update.bind(certManager),
    getCertificates,
    addCertificate: certManager.add.bind(certManager),
    deleteCertificate: certManager.remove.bind(certManager),
    findCertificateByDomain: certManager.getByDomain.bind(certManager),
    issueLetsEncryptCert: certManager.issue.bind(certManager),

    // Access Key
    getAccessKeys: teamAPI.getAccessKeys.bind(teamAPI),
    getAccessKey: teamAPI.getAccessKey.bind(teamAPI),
    createAccessKey: teamAPI.createAccessKey.bind(teamAPI),
    updateAccessKey: teamAPI.updateAccessKey.bind(teamAPI),
    deleteAccessKey: teamAPI.deleteAccessKey.bind(teamAPI),
    refreshLastUsed: teamAPI.refreshLastUsed.bind(teamAPI),
    verifyAccessKey: teamAPI.verifyAccessKey.bind(teamAPI),

    // migration
    isMigrationExecuted: states.migration.isExecuted.bind(states.migration),
    markMigrationExecuted: states.migration.markExecuted.bind(states.migration),

    // Upgrading
    checkNodeVersion,
    upgradeNodeVersion: () => Maintain.triggerMaintain({ action: 'upgrade', next: Maintain.resumeMaintain }),
    restartServer: () => Maintain.triggerMaintain({ action: 'restart', next: Maintain.resumeMaintain }),
    restartAllContainers: dockerRestartAllContainers,
    isBeingMaintained: Maintain.isBeingMaintained,
    resumeMaintain: Maintain.resumeMaintain,

    // Session
    getSession: (params, context) => states.session.read(params.id, context),
    startSession: (params, context) =>
      states.session.start(typeof params.data === 'string' ? JSON.parse(params.data) : params.data, context),
    updateSession: (params, context) =>
      states.session.update(
        params.id,
        typeof params.data === 'string' ? JSON.parse(params.data) : params.data,
        context
      ),
    endSession: (params, context) => states.session.end(params.id, context),

    getNodeRuntimeHistory: nodeAPI.getHistory.bind(nodeAPI),
    getNodeRuntimeInfo: nodeAPI.getRealtimeData.bind(nodeAPI),

    getRouterProvider,

    // for exporting blocklet data dir
    createBlockletDataArchive: createDataArchive,

    // public utils used in launch workflow
    getBlockletMetaFromUrl: getMetaFromUrl,
    getDynamicComponents,
    getLauncherSession,
    isLauncherSessionConsumed,
    setupAppOwner,
    launchBlockletByLauncher: (params, context) => launchBlockletByLauncher(instance, params, context),
    launchBlockletWithoutWallet: (params, context) => launchBlockletWithoutWallet(instance, params, context),

    // init security default data
    initializeSecurityDefaultData: securityAPI.initializeDefaultData.bind(securityAPI),
    // blocklet security
    getBlockletSecurityRule: securityAPI.getBlockletSecurityRule.bind(securityAPI),
    getBlockletSecurityRules: securityAPI.getBlockletSecurityRules.bind(securityAPI),
    addBlockletSecurityRule: securityAPI.addBlockletSecurityRule.bind(securityAPI),
    updateBlockletSecurityRule: securityAPI.updateBlockletSecurityRule.bind(securityAPI),
    deleteBlockletSecurityRule: securityAPI.deleteBlockletSecurityRule.bind(securityAPI),
    // blocklet security response header policy
    getBlockletResponseHeaderPolicy: securityAPI.getBlockletResponseHeaderPolicy.bind(securityAPI),
    getBlockletResponseHeaderPolicies: securityAPI.getBlockletResponseHeaderPolicies.bind(securityAPI),
    addBlockletResponseHeaderPolicy: securityAPI.addBlockletResponseHeaderPolicy.bind(securityAPI),
    updateBlockletResponseHeaderPolicy: securityAPI.updateBlockletResponseHeaderPolicy.bind(securityAPI),
    deleteBlockletResponseHeaderPolicy: securityAPI.deleteBlockletResponseHeaderPolicy.bind(securityAPI),
    // blocklet security access policy
    getBlockletAccessPolicy: securityAPI.getBlockletAccessPolicy.bind(securityAPI),
    getBlockletAccessPolicies: securityAPI.getBlockletAccessPolicies.bind(securityAPI),
    addBlockletAccessPolicy: securityAPI.addBlockletAccessPolicy.bind(securityAPI),
    updateBlockletAccessPolicy: securityAPI.updateBlockletAccessPolicy.bind(securityAPI),
    deleteBlockletAccessPolicy: securityAPI.deleteBlockletAccessPolicy.bind(securityAPI),

    // blocklet vault
    configVault: (params, context) => BlockletVault.configVault(instance, params, context),
    commitVault: (params) => BlockletVault.commitVault(instance, params),
    approveVault: (params) => BlockletVault.approveVault(instance, params),

    // webhook endpoint
    createWebhookEndpoint: webhookAPI.createWebhookEndpoint.bind(webhookAPI),
    updateWebhookEndpoint: webhookAPI.updateWebhookEndpoint.bind(webhookAPI),
    deleteWebhookEndpoint: webhookAPI.deleteWebhookEndpoint.bind(webhookAPI),
    getWebhookEndpoints: webhookAPI.getWebhookEndpoints.bind(webhookAPI),
    getWebhookEndpoint: webhookAPI.getWebhookEndpoint.bind(webhookAPI),
    getWebhookAttempts: webhookAPI.getWebhookAttempts.bind(webhookAPI),
    retryWebhookAttempt: webhookAPI.retryWebhookAttempt.bind(webhookAPI),
    regenerateWebhookEndpointSecret: webhookAPI.regenerateWebhookEndpointSecret.bind(webhookAPI),

    // passport
    createPassportLog: passportAPI.createPassportLog.bind(passportAPI),
    getPassportRoleCounts: passportAPI.getPassportRoleCounts.bind(passportAPI),
    getPassportsByRole: passportAPI.getPassportsByRole.bind(passportAPI),
    getPassportLogs: passportAPI.getPassportLogs.bind(passportAPI),
    getRelatedPassports: passportAPI.getRelatedPassports.bind(passportAPI),

    // blocklet base info
    getBlockletBaseInfo: teamAPI.getBlockletBaseInfo.bind(teamAPI),

    getDomainDNS: blockletManager.getDomainDNS.bind(blockletManager),

    // router security
    getRouterBlacklist: RouterBlocker.getActiveBlacklist,
    clearExpiredRouterBlacklist: RouterBlocker.cleanupExpiredBlacklist,
    clearAllRouterBlacklist: RouterBlocker.clearAllBlacklist,

    getOAuthClients: teamAPI.getOAuthClients.bind(teamAPI),
    deleteOAuthClient: teamAPI.deleteOAuthClient.bind(teamAPI),
    createOAuthClient: teamAPI.createOAuthClient.bind(teamAPI),
    updateOAuthClient: teamAPI.updateOAuthClient.bind(teamAPI),

    updateBlockletSettings: blockletManager.updateBlockletSettings.bind(blockletManager),
    createWebhookDisabledNotification: teamAPI.createWebhookDisabledNotification.bind(teamAPI),

    // migrate audit log
    migrateAuditLog: (dataDir) => {
      migrateAuditLog(dataDir, states, options.nodeDid, teamManager.getAuditLogState.bind(teamManager));
    },
  };

  blockletManager.createAuditLog = (params) => instance.createAuditLog(params);

  const events = createEvents({
    blockletManager,
    ensureBlockletRouting,
    ensureBlockletRoutingForUpgrade,
    removeBlockletRouting,
    handleBlockletRouting,
    handleSystemRouting,
    domainStatus,
    teamAPI,
    nodeAPI,
    securityAPI,
    teamManager,
    certManager,
    routerManager,
    node: instance,
    nodeRuntimeMonitor: nodeAPI.runtimeMonitor,
    daemon: options.daemon,
    handleBlockletWafChange,
    webhookManager: webhookAPI,
  });

  const webhook = WebHook({ events, dataDirs, instance });

  const initCron = async () => {
    if (isWorkerInstance()) {
      return;
    }
    Cron.init({
      context: { states, events, webhook, teamManager },
      jobs: [
        IP.cron,
        VersionChecker.getCron(teamManager),
        ...getRoutingCrons(),
        ...(await blockletManager.getCrons()),
        DiskMonitor.getCron(teamManager),
        LogRotator.getCron(),
        ...getStateCrons(states, teamManager),
        ...nodeAPI.getCrons(),
        ...RouterBlocker.getSecurityCrons(),
        passportAPI.getCron(options.nodeDid),
      ].filter((x) => options.daemon || (options.service && get(x, 'options.runInService'))),
      onError: (error, name) => {
        teamManager.emit({
          title: 'Run job failed',
          description: `Run job ${name} failed with error: ${error.message}`,
          entityType: 'job',
          entityId: name,
          severity: 'error',
        });
      },
    });
  };

  const createCLILog = (action) => {
    instance
      .createAuditLog({
        action,
        args: {},
        context: formatContext({
          user: { fullName: 'CLI', role: 'admin', did: options.nodeDid },
          headers: { 'user-agent': 'CLI' },
        }),
        result: null,
      })
      .catch(console.error);
  };

  onStatesReady(() => {
    if (options.daemon) {
      // start cert manager
      certManager
        .start()
        .then(() => logger.info('Certificate manager service start successfully'))
        .catch((error) => logger.error('Certificate manager service start failed', { error }));

      // start jobs
      setTimeout(async () => {
        if (process.env.NODE_ENV === 'development') {
          await initCron();
        } else {
          pm2Events.resume();
          await initCron();
          createCLILog('startServer');
          logger.info('Cron jobs start successfully on daemon start');
        }
      }, 1000);

      blockletManager
        .initialize()
        .then(() => {
          logger.info('blockletManager initialized');
        })
        .catch((error) => {
          logger.error('blockletManager initialize failed', { error });
        });
    } else if (options.service) {
      setTimeout(async () => {
        logger.info('Cron jobs start successfully on service start');
        await initCron();
      }, 1000);
    }
  });

  events.on(EVENTS.NODE_STOPPED, () => {
    pm2Events.pause();
    createCLILog('stopServer');
  });

  return Object.assign(events, {
    ...instance,

    // webhook
    getWebHooks: states.webhook.list.bind(states.webhook),
    createWebHook: webhook.create.bind(webhook),
    deleteWebHook: webhook.delete.bind(webhook),
    updateWebHookState: (params) => {
      const { isService, webhook: webhookParams, ...rest } = params;
      if (isService) {
        return teamAPI.updateWebHookState.call(teamAPI, { webhook: webhookParams, ...rest });
      }
      return webhook.updateWebHookState.call(webhook, { id: webhookParams?.id, url: webhookParams?.url, ...rest });
    },
    getWebhookSenders: webhook.listSenders.bind(webhook),
    getMessageSender: webhook.getMessageSender.bind(webhook),
    sendTestMessage: webhook.sendTestMessage.bind(webhook),
  });
}

module.exports = ABTNode;
