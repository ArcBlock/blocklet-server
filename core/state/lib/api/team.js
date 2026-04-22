const { EventEmitter } = require('events');
const throttle = require('lodash/throttle');
const { Op } = require('sequelize');
const dayjs = require('@abtnode/util/lib/dayjs');
const logger = require('@abtnode/logger')('@abtnode/core:api:team');
const pAll = require('p-all');
const { PASSPORT_STATUS, USER_AVATAR_URL_PREFIX } = require('@abtnode/constant');
const isUrl = require('is-url');
const { extractUserAvatar, getAvatarByUrl } = require('@abtnode/util/lib/user');
const { TeamEvents } = require('@blocklet/constant');
const { BlockletRuntimeMonitor } = require('../monitor/blocklet-runtime-monitor');
const { getBlocklet } = require('../util/blocklet');
const { profileSchema } = require('../validators/user');

// Import split modules
const tagManager = require('./team/tag-manager');
const notificationManager = require('./team/notification-manager');
const rbacManager = require('./team/rbac-manager');
const accessKeyManager = require('./team/access-key-manager');
const oauthManager = require('./team/oauth-manager');
const verifyCodeManager = require('./team/verify-code-manager');
const storeManager = require('./team/store-manager');
const sessionManager = require('./team/session-manager');
const userManager = require('./team/user-manager');
const invitationManager = require('./team/invitation-manager');
const passportManager = require('./team/passport-manager');
const orgManager = require('./team/org-manager');

// Re-export helper functions
const { validatePassportDisplay, sendPassportVcNotification } = passportManager;

class TeamAPI extends EventEmitter {
  /**
   * @param {object} states abtnode core StateDB
   */
  constructor({ teamManager, states, dataDirs, nodeAPI, passportAPI, passportIssueQueue }) {
    super();

    this.notification = states.notification;
    this.node = states.node;
    this.states = states;
    this.memberInviteExpireTime = 1000 * 3600 * 24 * 30; // 30 days
    this.transferOwnerExpireTime = 1000 * 3600; // 1 hour
    this.teamManager = teamManager;
    this.dataDirs = dataDirs;
    this.nodeAPI = nodeAPI;
    this.passportAPI = passportAPI;
    this.throttleMap = new Map();
    this.passportIssueQueue = passportIssueQueue;
    // 创建一个通用的节流发送函数
    this.throttledEmit = throttle(
      (eventName, payload) => {
        this.emit(eventName, payload);
        logger.debug('Emitting throttled notification update');
      },
      1000 * 10, // 30s 节流
      { leading: true, trailing: true }
    );

    this.runtimeMonitor = new BlockletRuntimeMonitor({ states });
  }

  async onJob(job) {
    if (job.entity === 'blocklet' && job.action === 'issueOrgOwnerPassport') {
      await this.issueOrgOwnerPassport(job.params);
    }
  }

  getThrottledEmit(teamDid) {
    if (!this.throttleMap.has(teamDid)) {
      this.throttleMap.set(teamDid, this.throttledEmit);
      return this.throttledEmit;
    }
    return this.throttleMap.get(teamDid);
  }

  async getBlockletBaseInfo({ teamDid }) {
    const userState = await this.getUserState(teamDid);
    const [users, approvedUsers] = await Promise.all([userState.count(), userState.count({ approved: true })]);

    const passportState = await this.teamManager.getPassportState(teamDid);
    const [passports, activePassports] = await Promise.all([
      passportState.count(),
      passportState.count({ status: PASSPORT_STATUS.VALID }),
    ]);

    const backups = await this.states.backup.find({
      where: { appPid: teamDid },
      order: [['createdAt', 'DESC']],
      limit: 1,
    });
    const backup = Array.isArray(backups) && backups.length > 0 ? backups[0] : null;
    const appRuntimeInfo = await this.runtimeMonitor.getBlockletRuntimeInfo(teamDid);

    const [traffic, integrations, studio] = await pAll([
      // 查询最近 30 天的 traffic insights 聚合数据
      async () => {
        const endDate = dayjs().format('YYYY-MM-DD');
        const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
        const [totalRequests, failedRequests] = await Promise.all([
          this.states.trafficInsight.sum('totalRequests', {
            did: teamDid,
            date: { [Op.gte]: startDate, [Op.lte]: endDate },
          }),
          this.states.trafficInsight.sum('failedRequests', {
            did: teamDid,
            date: { [Op.gte]: startDate, [Op.lte]: endDate },
          }),
        ]);
        return {
          totalRequests: Number(totalRequests || 0),
          failedRequests: Number(failedRequests || 0),
        };
      },
      // 查询集成资源的数量
      async () => {
        const [webhookCount, accessKeyCount, oauthAppCount] = await pAll([
          async () => {
            const { webhookEndpointState } = await this.teamManager.getWebhookState(teamDid);
            return webhookEndpointState.count({});
          },
          async () => {
            const accessKeyState = await this.getAccessKeyState(teamDid);
            return accessKeyState.count({});
          },
          async () => {
            const { oauthClientState } = await this.teamManager.getOAuthState(teamDid);
            return oauthClientState.count({});
          },
        ]);

        return {
          webhooks: webhookCount,
          accessKeys: accessKeyCount,
          oauthApps: oauthAppCount,
        };
      },
      // 查询 Studio 创建的 Blocklet 数量
      async () => {
        try {
          const { projectState, releaseState } = await this.teamManager.getProjectState(teamDid);
          const projects = await projectState.getProjects({});
          const projectIds = projects.map((p) => p.id);
          const releasesCount =
            projectIds.length > 0 ? await releaseState.count({ projectId: { [Op.in]: projectIds } }) : 0;
          return {
            blocklets: projects.length,
            releases: releasesCount,
          };
        } catch (error) {
          // 如果项目状态不存在或出错，忽略错误，使用默认值
          logger.debug('Failed to get studio stats', { error, teamDid });
          return { blocklets: 0, releases: 0 };
        }
      },
    ]);

    return {
      user: {
        users,
        approvedUsers,
      },
      passport: {
        passports,
        activePassports,
      },
      backup,
      appRuntimeInfo,
      traffic,
      integrations,
      studio,
    };
  }

  // ============ Tag Manager ============
  createTagging({ teamDid, tagging }) {
    return tagManager.createTagging(this, { teamDid, tagging });
  }

  deleteTagging({ teamDid, tagging }) {
    return tagManager.deleteTagging(this, { teamDid, tagging });
  }

  getTag({ teamDid, tag }) {
    return tagManager.getTag(this, { teamDid, tag });
  }

  createTag({ teamDid, tag }, context = {}) {
    return tagManager.createTag(this, { teamDid, tag }, context);
  }

  updateTag({ teamDid, tag }, context = {}) {
    return tagManager.updateTag(this, { teamDid, tag }, context);
  }

  deleteTag({ teamDid, tag, moveTo }) {
    return tagManager.deleteTag(this, { teamDid, tag, moveTo });
  }

  getTags({ teamDid, paging }) {
    return tagManager.getTags(this, { teamDid, paging });
  }

  // ============ Notification Manager ============
  getNotification(params, context) {
    return notificationManager.getNotification(this, params, context);
  }

  getNotificationById(params) {
    return notificationManager.getNotificationById(this, params);
  }

  getNotificationsUnreadCount(params, context) {
    return notificationManager.getNotificationsUnreadCount(this, params, context);
  }

  createNotificationReceiver(params, context) {
    return notificationManager.createNotificationReceiver(this, params, context);
  }

  markAllNotificationsAsRead(params, context) {
    return notificationManager.markAllNotificationsAsRead(this, params, context);
  }

  updateNotificationStatus(params, context) {
    return notificationManager.updateNotificationStatus(this, params, context);
  }

  readNotifications(params, context) {
    return notificationManager.readNotifications(this, params, context);
  }

  unreadNotifications(params, context) {
    return notificationManager.unreadNotifications(this, params, context);
  }

  getNotificationSendLog(params, context) {
    return notificationManager.getNotificationSendLog(this, params, context);
  }

  getNotificationComponents(params, context) {
    return notificationManager.getNotificationComponents(this, params, context);
  }

  getReceivers(params, context) {
    return notificationManager.getReceivers(this, params, context);
  }

  createNotification(payload) {
    return this.teamManager.createNotification(payload);
  }

  // ============ RBAC Manager ============
  getRole({ teamDid, role }) {
    return rbacManager.getRole(this, { teamDid, role });
  }

  createRole({ teamDid, name, description, title, childName, permissions = [], extra, orgId }) {
    return rbacManager.createRole(this, { teamDid, name, description, title, childName, permissions, extra, orgId });
  }

  updateRole({ teamDid, role, orgId }) {
    return rbacManager.updateRole(this, { teamDid, role, orgId });
  }

  getPermissions({ teamDid }) {
    return rbacManager.getPermissions(this, { teamDid });
  }

  createPermission({ teamDid, name, description, extra }) {
    return rbacManager.createPermission(this, { teamDid, name, description, extra });
  }

  updatePermission({ teamDid, permission }) {
    return rbacManager.updatePermission(this, { teamDid, permission });
  }

  grant({ teamDid, roleName, grantName }) {
    return rbacManager.grant(this, { teamDid, roleName, grantName });
  }

  revoke({ teamDid, roleName, grantName }) {
    return rbacManager.revoke(this, { teamDid, roleName, grantName });
  }

  updateGrants({ teamDid, roleName, grantNames }) {
    return rbacManager.updateGrants(this, { teamDid, roleName, grantNames });
  }

  deleteRole({ teamDid, name }) {
    return rbacManager.deleteRole(this, { teamDid, name });
  }

  deletePermission({ teamDid, name }) {
    return rbacManager.deletePermission(this, { teamDid, name });
  }

  getPermissionsByRole({ teamDid, role }) {
    return rbacManager.getPermissionsByRole(this, { teamDid, role });
  }

  hasPermission({ teamDid, role, permission }) {
    return rbacManager.hasPermission(this, { teamDid, role, permission });
  }

  refreshBlockletInterfacePermissions(blockletMeta) {
    return rbacManager.refreshBlockletInterfacePermissions(this, blockletMeta);
  }

  // ============ Access Key Manager ============
  getAccessKeys({ teamDid, ...data }, context) {
    return accessKeyManager.getAccessKeys(this, { teamDid, ...data }, context);
  }

  getAccessKey({ teamDid, accessKeyId }, context) {
    return accessKeyManager.getAccessKey(this, { teamDid, accessKeyId }, context);
  }

  createAccessKey({ teamDid, ...data }, context) {
    return accessKeyManager.createAccessKey(this, { teamDid, ...data }, context);
  }

  updateAccessKey({ teamDid, ...data }, context) {
    return accessKeyManager.updateAccessKey(this, { teamDid, ...data }, context);
  }

  deleteAccessKey({ teamDid, accessKeyId }, context) {
    return accessKeyManager.deleteAccessKey(this, { teamDid, accessKeyId }, context);
  }

  refreshLastUsed({ teamDid, accessKeyId }, context) {
    return accessKeyManager.refreshLastUsed(this, { teamDid, accessKeyId }, context);
  }

  verifyAccessKey({ teamDid, ...data }, context) {
    return accessKeyManager.verifyAccessKey(this, { teamDid, ...data }, context);
  }

  // ============ OAuth Manager ============
  getOAuthClients({ teamDid, paging }) {
    return oauthManager.getOAuthClients(this, { teamDid, paging });
  }

  deleteOAuthClient({ teamDid, clientId }) {
    return oauthManager.deleteOAuthClient(this, { teamDid, clientId });
  }

  createOAuthClient({ teamDid, input }, context) {
    return oauthManager.createOAuthClient(this, { teamDid, input }, context);
  }

  updateOAuthClient({ teamDid, input }, context) {
    return oauthManager.updateOAuthClient(this, { teamDid, input }, context);
  }

  // ============ Verify Code Manager ============
  createVerifyCode({ teamDid, subject, scope, purpose }) {
    return verifyCodeManager.createVerifyCode(this, { teamDid, subject, scope, purpose });
  }

  consumeVerifyCode({ teamDid, code }) {
    return verifyCodeManager.consumeVerifyCode(this, { teamDid, code });
  }

  issueVerifyCode({ teamDid, code }) {
    return verifyCodeManager.issueVerifyCode(this, { teamDid, code });
  }

  sendVerifyCode({ teamDid, code }) {
    return verifyCodeManager.sendVerifyCode(this, { teamDid, code });
  }

  isSubjectVerified({ teamDid, subject }) {
    return verifyCodeManager.isSubjectVerified(this, { teamDid, subject });
  }

  isSubjectIssued({ teamDid, userDid, subject }) {
    return verifyCodeManager.isSubjectIssued(this, { teamDid, userDid, subject });
  }

  isSubjectSent({ teamDid, subject }) {
    return verifyCodeManager.isSubjectSent(this, { teamDid, subject });
  }

  getVerifyCode({ teamDid, code, id }) {
    return verifyCodeManager.getVerifyCode(this, { teamDid, code, id });
  }

  rotateSessionKey({ teamDid }) {
    return verifyCodeManager.rotateSessionKey(this, { teamDid });
  }

  // ============ Store Manager ============
  addStore({ teamDid, url, scope }, context) {
    return storeManager.addStore(this, { teamDid, url, scope }, context);
  }

  addEndpoint({ teamDid, url }, context) {
    return storeManager.addEndpoint(this, { teamDid, url }, context);
  }

  deleteEndpoint({ teamDid, did, projectId }, context) {
    return storeManager.deleteEndpoint(this, { teamDid, did, projectId }, context);
  }

  existsStore({ teamDid, url, scope }, context) {
    return storeManager.existsStore(this, { teamDid, url, scope }, context);
  }

  deleteStore({ teamDid, url, projectId, scope }, context) {
    return storeManager.deleteStore(this, { teamDid, url, projectId, scope }, context);
  }

  // ============ Session Manager ============
  getUserSession(params) {
    return sessionManager.getUserSession(this, params);
  }

  getUserSessions(params) {
    return sessionManager.getUserSessions(this, params);
  }

  getUserSessionsCount(params) {
    return sessionManager.getUserSessionsCount(this, params);
  }

  getPassportById(params) {
    return sessionManager.getPassportById(this, params);
  }

  getPassportFromFederated(params) {
    return sessionManager.getPassportFromFederated(this, params);
  }

  upsertUserSession(params) {
    return sessionManager.upsertUserSession(this, params);
  }

  syncUserSession(params) {
    return sessionManager.syncUserSession(this, params);
  }

  logoutUser(params) {
    return sessionManager.logoutUser(this, params);
  }

  // ============ User Manager ============
  loginUser(params, context) {
    return userManager.loginUser(this, params, context);
  }

  disconnectUserAccount(params, context) {
    return userManager.disconnectUserAccount(this, params, context);
  }

  addUser(params, context) {
    return userManager.addUser(this, params, context);
  }

  getUsers(params, context) {
    return userManager.getUsers(this, params, context);
  }

  getUsersCount(params) {
    return userManager.getUsersCount(this, params);
  }

  getUsersCountPerRole(params) {
    return userManager.getUsersCountPerRole(this, params);
  }

  getUser(params, context) {
    return userManager.getUser(this, params, context);
  }

  getConnectedAccount(params, context) {
    return userManager.getConnectedAccount(this, params, context);
  }

  isEmailUsed(params) {
    return userManager.isEmailUsed(this, params);
  }

  isPhoneUsed(params) {
    return userManager.isPhoneUsed(this, params);
  }

  getUserByDid(params) {
    return userManager.getUserByDid(this, params);
  }

  isUserValid(params) {
    return userManager.isUserValid(this, params);
  }

  isPassportValid(params) {
    return userManager.isPassportValid(this, params);
  }

  isConnectedAccount(params) {
    return userManager.isConnectedAccount(this, params);
  }

  getOwner(params) {
    return userManager.getOwner(this, params);
  }

  userFollowAction(params, context) {
    return userManager.userFollowAction(this, params, context);
  }

  getUserFollows(params, context) {
    return userManager.getUserFollows(this, params, context);
  }

  getUserFollowStats(params, context) {
    return userManager.getUserFollowStats(this, params, context);
  }

  checkFollowing(params) {
    return userManager.checkFollowing(this, params);
  }

  getUserInvites(params, context) {
    return userManager.getUserInvites(this, params, context);
  }

  updateUser(params, context) {
    return userManager.updateUser(this, params, context);
  }

  updateUserAddress(params, context) {
    return userManager.updateUserAddress(this, params, context);
  }

  updateUserTags(params, context) {
    return userManager.updateUserTags(this, params, context);
  }

  removeUser(params, context) {
    return userManager.removeUser(this, params, context);
  }

  updateUserApproval(params, context) {
    return userManager.updateUserApproval(this, params, context);
  }

  updateWebHookState(params) {
    return userManager.updateWebHookState(this, params);
  }

  createWebhookDisabledNotification(params) {
    return userManager.createWebhookDisabledNotification(this, params);
  }

  async switchProfile({ teamDid, userDid, profile }) {
    const state = await this.getUserState(teamDid);
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
          const blocklet = await getBlocklet({ did: teamDid, states: this.states, dataDirs: this.dataDirs });
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
          const blocklet = await getBlocklet({ did: teamDid, states: this.states, dataDirs: this.dataDirs });
          mergeData.avatar = await extractUserAvatar(mergeData.avatar, { dataDir: blocklet.env.dataDir });
        } else {
          logger.error('Profile avatar is invalid', { teamDid, userDid, profile });
          throw new Error('Profile avatar is invalid');
        }
      }
    }
    const doc = await state.updateUser(userDid, mergeData);
    logger.info('User switch-profile successfully', { teamDid, userDid });
    this.emit(TeamEvents.userUpdated, { teamDid, user: doc });
    this.emit(TeamEvents.userProfileUpdated, { teamDid, user: doc });
    return doc;
  }

  // ============ Invitation Manager ============
  createMemberInvitation(params, context) {
    return invitationManager.createMemberInvitation(this, params, context, { validatePassportDisplay });
  }

  getInvitation({ teamDid, inviteId }) {
    return invitationManager.getInvitation(this, { teamDid, inviteId });
  }

  getInvitations({ teamDid, filter, orgId }, context) {
    return invitationManager.getInvitations(this, { teamDid, filter, orgId }, context);
  }

  deleteInvitation({ teamDid, inviteId }) {
    return invitationManager.deleteInvitation(this, { teamDid, inviteId });
  }

  checkInvitation({ teamDid, inviteId }) {
    return invitationManager.checkInvitation(this, { teamDid, inviteId });
  }

  closeInvitation(params) {
    return invitationManager.closeInvitation(this, params);
  }

  createTransferInvitation({ teamDid, remark }, context = {}) {
    return invitationManager.createTransferInvitation(this, { teamDid, remark }, context, { validatePassportDisplay });
  }

  createTransferAppOwnerSession({ appDid, remark }) {
    return invitationManager.createTransferAppOwnerSession(this, { appDid, remark });
  }

  getTransferAppOwnerSession({ appDid, transferId }) {
    return invitationManager.getTransferAppOwnerSession(this, { appDid, transferId });
  }

  checkTransferAppOwnerSession({ appDid, transferId }) {
    return invitationManager.checkTransferAppOwnerSession(this, { appDid, transferId });
  }

  closeTransferAppOwnerSession(params) {
    return invitationManager.closeTransferAppOwnerSession(this, params);
  }

  // ============ Passport Manager ============
  issuePassportToUser(params, context) {
    return passportManager.issuePassportToUser(this, params, context);
  }

  revokeUserPassport(params, context) {
    return passportManager.revokeUserPassport(this, params, context);
  }

  enableUserPassport(params, context) {
    return passportManager.enableUserPassport(this, params, context);
  }

  removeUserPassport(params) {
    return passportManager.removeUserPassport(this, params);
  }

  createPassportIssuance(params, context) {
    return passportManager.createPassportIssuance(this, params, context);
  }

  getPassportIssuances({ teamDid, ownerDid }) {
    return passportManager.getPassportIssuances(this, { teamDid, ownerDid });
  }

  getPassportIssuance({ teamDid, sessionId }) {
    return passportManager.getPassportIssuance(this, { teamDid, sessionId });
  }

  processPassportIssuance({ teamDid, sessionId }) {
    return passportManager.processPassportIssuance(this, { teamDid, sessionId });
  }

  deletePassportIssuance({ teamDid, sessionId }) {
    return passportManager.deletePassportIssuance(this, { teamDid, sessionId });
  }

  configTrustedPassports({ teamDid, trustedPassports }) {
    return passportManager.configTrustedPassports(this, { teamDid, trustedPassports });
  }

  configTrustedFactories({ teamDid, trustedFactories }) {
    return passportManager.configTrustedFactories(this, { teamDid, trustedFactories });
  }

  configPassportIssuance({ teamDid, enable }) {
    return passportManager.configPassportIssuance(this, { teamDid, enable });
  }

  // ============ Org Manager ============
  getOrgs(params, context) {
    return orgManager.getOrgs(this, params, context);
  }

  getOrg({ teamDid, id }, context) {
    return orgManager.getOrg(this, { teamDid, id }, context);
  }

  createDefaultOrgForUser({ teamDid, user }) {
    return orgManager.createDefaultOrgForUser(this, { teamDid, user });
  }

  issueOrgOwnerPassport({ teamDid, org }) {
    return orgManager.issueOrgOwnerPassport(this, { teamDid, org });
  }

  createOrg(params, context) {
    return orgManager.createOrg(this, params, context);
  }

  updateOrg({ teamDid, org }, context) {
    return orgManager.updateOrg(this, { teamDid, org }, context);
  }

  deleteOrg({ teamDid, id }, context) {
    return orgManager.deleteOrg(this, { teamDid, id }, context);
  }

  addOrgMember({ teamDid, orgId, userDid }, context) {
    return orgManager.addOrgMember(this, { teamDid, orgId, userDid }, context);
  }

  updateOrgMember({ teamDid, orgId, userDid, status }, context) {
    return orgManager.updateOrgMember(this, { teamDid, orgId, userDid, status }, context);
  }

  sendInvitationNotification(params) {
    return orgManager.sendInvitationNotification(this, params);
  }

  getFederatedMasterBlockletInfo({ blocklet }) {
    return orgManager.getFederatedMasterBlockletInfo({ blocklet });
  }

  inviteMembersToOrg(params, context) {
    return orgManager.inviteMembersToOrg(this, params, context);
  }

  removeOrgMember({ teamDid, orgId, userDid }, context) {
    return orgManager.removeOrgMember(this, { teamDid, orgId, userDid }, context);
  }

  getOrgMembers({ teamDid, orgId, paging }, context) {
    return orgManager.getOrgMembers(this, { teamDid, orgId, paging }, context);
  }

  getOrgInvitableUsers({ teamDid, id, query, paging }, context) {
    return orgManager.getOrgInvitableUsers(this, { teamDid, id, query, paging }, context);
  }

  getOrgResource({ teamDid, orgId, resourceId }, context) {
    return orgManager.getOrgResource(this, { teamDid, orgId, resourceId }, context);
  }

  addOrgResource({ teamDid, orgId, resourceIds, type, metadata }, context) {
    return orgManager.addOrgResource(this, { teamDid, orgId, resourceIds, type, metadata }, context);
  }

  removeOrgResource({ teamDid, orgId, resourceIds }, context) {
    return orgManager.removeOrgResource(this, { teamDid, orgId, resourceIds }, context);
  }

  migrateOrgResource({ teamDid, from, to, resourceIds }, context) {
    return orgManager.migrateOrgResource(this, { teamDid, from, to, resourceIds }, context);
  }

  getNotificationStats({ teamDid, since }) {
    return orgManager.getNotificationStats(this, { teamDid, since });
  }

  // ============ Delegated Methods (from teamManager) ============
  getRoles({ teamDid, orgId }) {
    return this.teamManager.getRoles(teamDid, orgId);
  }

  getRBAC(teamDid) {
    return this.teamManager.getRBAC(teamDid);
  }

  // State getters (delegated to teamManager)
  getUserState(teamDid) {
    return this.teamManager.getUserState(teamDid);
  }

  getSessionState(teamDid) {
    return this.teamManager.getSessionState(teamDid);
  }

  getNotificationState(teamDid) {
    return this.teamManager.getNotificationState(teamDid);
  }

  getTagState(teamDid) {
    return this.teamManager.getTagState(teamDid);
  }

  getTaggingState(teamDid) {
    return this.teamManager.getTaggingState(teamDid);
  }

  getVerifyCodeState(teamDid) {
    return this.teamManager.getVerifyCodeState(teamDid);
  }

  getAccessKeyState(teamDid) {
    return this.teamManager.getAccessKeyState(teamDid);
  }

  getOrgState(teamDid) {
    return this.teamManager.getOrgState(teamDid);
  }

  getUserSessionState(teamDid) {
    return this.teamManager.getUserSessionState(teamDid);
  }

  // ============ Just for test ============
  setInviteExpireTime(ms) {
    this.memberInviteExpireTime = ms;
  }
}

module.exports = TeamAPI;
module.exports.validatePassportDisplay = validatePassportDisplay;
module.exports.sendPassportVcNotification = sendPassportVcNotification;
