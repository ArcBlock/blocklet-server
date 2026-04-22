type PartialDeep<T> = {
  [K in keyof T]?: T[K] extends object ? PartialDeep<T[K]> : T[K];
};

export as namespace ABTNodeClient;

/*~ This declaration specifies that the class constructor function
 *~ is the exported object from the file
 */
export = ABTNodeClient;

/*~ Write your module's methods and properties in this class */
declare class ABTNodeClient {
  config: any;
  schema: void;
  constructor(httpEndpoint: string, userAgent: string = '');

  getQueries(): string[];
  getSubscriptions(): string[];
  getMutations(): string[];

  public setAuthToken(token: string): void;
  public setAuthAccessKey({
    accessKeyId,
    accessKeySecret,
    type,
  }: {
    accessKeyId: string;
    accessKeySecret: string;
    type: any;
  }): void;

  protected _getAuthHeaders(): Promise<Record<string, string> | undefined>;

  /**
   * Send raw query to ocap and return results
   *
   * @param {*} query
   * @memberof BaseClient
   * @return Promise
   */
  doRawQuery(query: any, requestOptions?: any): Promise<any>;
  doRawSubscription(query: any): Promise<any>;

  doBatchQuery(queries: object, requestOptions?: any): Promise<object>;

  generateQueryFns(): void;
  generateSubscriptionFns(): void;
  generateMutationFns(): void;

  getBlocklet(params: PartialDeep<ABTNodeClient.GetBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  getBlockletMetaFromUrl(
    params: PartialDeep<ABTNodeClient.GetBlockletMetaFromUrlParams>
  ): Promise<ABTNodeClient.ResponseBlockletMetaFromUrl>;
  getBlockletDiff(
    params: PartialDeep<ABTNodeClient.GetBlockletDiffParams>
  ): Promise<ABTNodeClient.ResponseBlockletDiff>;
  getBlocklets(params: PartialDeep<ABTNodeClient.GetBlockletsParams>): Promise<ABTNodeClient.ResponseGetBlocklets>;
  getBlockletRuntimeHistory(
    params: PartialDeep<ABTNodeClient.GetBlockletRuntimeHistoryParams>
  ): Promise<ABTNodeClient.ResponseBlockletRuntimeHistory>;
  getBlockletsFromBackup(): Promise<ABTNodeClient.ResponseBlockletsFromBackup>;
  getDynamicComponents(
    params: PartialDeep<ABTNodeClient.GetDynamicComponentsParams>
  ): Promise<ABTNodeClient.ResponseGetDynamicComponents>;
  getNodeInfo(): Promise<ABTNodeClient.ResponseGetNodeInfo>;
  resetNodeStatus(): Promise<ABTNodeClient.ResponseGetNodeInfo>;
  getNodeEnv(): Promise<ABTNodeClient.ResponseGetNodeEnv>;
  checkNodeVersion(): Promise<ABTNodeClient.ResponseCheckNodeVersion>;
  getDelegationState(): Promise<ABTNodeClient.ResponseDelegationState>;
  getNodeRuntimeHistory(
    params: PartialDeep<ABTNodeClient.GetNodeRuntimeHistoryParams>
  ): Promise<ABTNodeClient.ResponseNodeRuntimeHistory>;
  getBlockletMeta(
    params: PartialDeep<ABTNodeClient.GetBlockletMetaParams>
  ): Promise<ABTNodeClient.ResponseBlockletMeta>;
  getNotifications(
    params: PartialDeep<ABTNodeClient.GetNotificationsParams>
  ): Promise<ABTNodeClient.ResponseGetNotifications>;
  makeAllNotificationsAsRead(
    params: PartialDeep<ABTNodeClient.MakeAllNotificationsAsReadParams>
  ): Promise<ABTNodeClient.ResponseMakeAllNotificationsAsRead>;
  getNotificationSendLog(
    params: PartialDeep<ABTNodeClient.GetNotificationSendLogParams>
  ): Promise<ABTNodeClient.ResponseNotificationSendLog>;
  getReceivers(params: PartialDeep<ABTNodeClient.GetReceiversParams>): Promise<ABTNodeClient.ResponseReceivers>;
  getNotificationComponents(
    params: PartialDeep<ABTNodeClient.GetNotificationComponentsParams>
  ): Promise<ABTNodeClient.ResponseNotificationComponents>;
  resendNotification(
    params: PartialDeep<ABTNodeClient.ResendNotificationParams>
  ): Promise<ABTNodeClient.ResponseResendNotification>;
  getRoutingSites(
    params: PartialDeep<ABTNodeClient.GetRoutingSitesParams>
  ): Promise<ABTNodeClient.ResponseGetRoutingSites>;
  getRoutingProviders(): Promise<ABTNodeClient.ResponseGetRoutingProviders>;
  isDidDomain(params: PartialDeep<ABTNodeClient.IsDidDomainParams>): Promise<ABTNodeClient.ResponseIsDidDomain>;
  getCertificates(): Promise<ABTNodeClient.ResponseGetCertificates>;
  checkDomains(params: PartialDeep<ABTNodeClient.CheckDomainsParams>): Promise<ABTNodeClient.ResponseCheckDomains>;
  findCertificateByDomain(
    params: PartialDeep<ABTNodeClient.FindCertificateByDomainParams>
  ): Promise<ABTNodeClient.ResponseFindCertificateByDomain>;
  getAccessKeys(params: PartialDeep<ABTNodeClient.GetAccessKeysParams>): Promise<ABTNodeClient.ResponseAccessKeys>;
  getAccessKey(params: PartialDeep<ABTNodeClient.GetAccessKeyParams>): Promise<ABTNodeClient.ResponseAccessKey>;
  getWebHooks(): Promise<ABTNodeClient.ResponseWebHooks>;
  getWebhookSenders(): Promise<ABTNodeClient.ResponseSenderList>;
  sendTestMessage(params: PartialDeep<ABTNodeClient.SendTestMessageParams>): Promise<ABTNodeClient.ResponseSendMsg>;
  getSession(params: PartialDeep<ABTNodeClient.GetSessionParams>): Promise<ABTNodeClient.ResponseGetSession>;
  getRoles(params: PartialDeep<ABTNodeClient.GetRolesParams>): Promise<ABTNodeClient.ResponseRoles>;
  getRole(params: PartialDeep<ABTNodeClient.GetRoleParams>): Promise<ABTNodeClient.ResponseRole>;
  getPermissions(params: PartialDeep<ABTNodeClient.GetPermissionsParams>): Promise<ABTNodeClient.ResponsePermissions>;
  getInvitations(
    params: PartialDeep<ABTNodeClient.GetInvitationsParams>
  ): Promise<ABTNodeClient.ResponseGetInvitations>;
  getUsers(params: PartialDeep<ABTNodeClient.GetUsersParams>): Promise<ABTNodeClient.ResponseUsers>;
  getUser(params: PartialDeep<ABTNodeClient.GetUserParams>): Promise<ABTNodeClient.ResponseUser>;
  getUserSessions(
    params: PartialDeep<ABTNodeClient.GetUserSessionsParams>
  ): Promise<ABTNodeClient.ResponseUserSessions>;
  getUserSessionsCount(
    params: PartialDeep<ABTNodeClient.GetUserSessionsCountParams>
  ): Promise<ABTNodeClient.ResponseUserSessionsCount>;
  getUsersCount(params: PartialDeep<ABTNodeClient.GetUsersCountParams>): Promise<ABTNodeClient.ResponseGetUsersCount>;
  getUsersCountPerRole(
    params: PartialDeep<ABTNodeClient.GetUsersCountPerRoleParams>
  ): Promise<ABTNodeClient.ResponseGetUsersCountPerRole>;
  getOwner(params: PartialDeep<ABTNodeClient.GetOwnerParams>): Promise<ABTNodeClient.ResponseUser>;
  getPermissionsByRole(
    params: PartialDeep<ABTNodeClient.GetPermissionsByRoleParams>
  ): Promise<ABTNodeClient.ResponsePermissions>;
  getPassportIssuances(
    params: PartialDeep<ABTNodeClient.GetPassportIssuancesParams>
  ): Promise<ABTNodeClient.ResponseGetPassportIssuances>;
  logoutUser(params: PartialDeep<ABTNodeClient.LogoutUserParams>): Promise<ABTNodeClient.GeneralResponse>;
  destroySelf(params: PartialDeep<ABTNodeClient.DestroySelfParams>): Promise<ABTNodeClient.ResponseUser>;
  getUserFollowers(
    params: PartialDeep<ABTNodeClient.GetUserFollowersParams>
  ): Promise<ABTNodeClient.ResponseUserFollows>;
  getUserFollowing(
    params: PartialDeep<ABTNodeClient.GetUserFollowingParams>
  ): Promise<ABTNodeClient.ResponseUserFollows>;
  getUserFollowStats(
    params: PartialDeep<ABTNodeClient.GetUserFollowStatsParams>
  ): Promise<ABTNodeClient.ResponseUserRelationCount>;
  checkFollowing(
    params: PartialDeep<ABTNodeClient.CheckFollowingParams>
  ): Promise<ABTNodeClient.ResponseCheckFollowing>;
  followUser(params: PartialDeep<ABTNodeClient.FollowUserParams>): Promise<ABTNodeClient.GeneralResponse>;
  unfollowUser(params: PartialDeep<ABTNodeClient.UnfollowUserParams>): Promise<ABTNodeClient.GeneralResponse>;
  getUserInvites(params: PartialDeep<ABTNodeClient.GetUserInvitesParams>): Promise<ABTNodeClient.ResponseUsers>;
  getTags(params: PartialDeep<ABTNodeClient.GetTagsParams>): Promise<ABTNodeClient.ResponseTags>;
  getAuditLogs(params: PartialDeep<ABTNodeClient.GetAuditLogsParams>): Promise<ABTNodeClient.ResponseGetAuditLogs>;
  getLauncherSession(
    params: PartialDeep<ABTNodeClient.GetLauncherSessionParams>
  ): Promise<ABTNodeClient.ResponseGetLauncherSession>;
  getBlockletBackups(
    params: PartialDeep<ABTNodeClient.GetBlockletBackupsParams>
  ): Promise<ABTNodeClient.ResponseGetBlockletBackups>;
  getBlockletBackupSummary(
    params: PartialDeep<ABTNodeClient.GetBlockletBackupSummaryParams>
  ): Promise<ABTNodeClient.ResponseGetBlockletBackupSummary>;
  getBlockletSpaceGateways(
    params: PartialDeep<ABTNodeClient.GetBlockletSpaceGatewaysParams>
  ): Promise<ABTNodeClient.ResponseGetBlockletSpaceGateways>;
  getTrafficInsights(
    params: PartialDeep<ABTNodeClient.GetTrafficInsightsParams>
  ): Promise<ABTNodeClient.ResponseGetTrafficInsights>;
  getProjects(params: PartialDeep<ABTNodeClient.GetProjectsParams>): Promise<ABTNodeClient.ResponseGetProjects>;
  getProject(params: PartialDeep<ABTNodeClient.GetProjectParams>): Promise<ABTNodeClient.ResponseGetProject>;
  getReleases(params: PartialDeep<ABTNodeClient.GetReleasesParams>): Promise<ABTNodeClient.ResponseGetReleases>;
  getRelease(params: PartialDeep<ABTNodeClient.GetReleaseParams>): Promise<ABTNodeClient.ResponseGetRelease>;
  getSelectedResources(
    params: PartialDeep<ABTNodeClient.GetSelectedResourcesParams>
  ): Promise<ABTNodeClient.ResponseGetSelectedResources>;
  getBlockletSecurityRule(
    params: PartialDeep<ABTNodeClient.GetBlockletSecurityRuleParams>
  ): Promise<ABTNodeClient.ResponseBlockletSecurityRule>;
  getBlockletSecurityRules(
    params: PartialDeep<ABTNodeClient.GetBlockletSecurityRulesParams>
  ): Promise<ABTNodeClient.ResponseBlockletSecurityRules>;
  getBlockletResponseHeaderPolicy(
    params: PartialDeep<ABTNodeClient.GetBlockletResponseHeaderPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletAccessPolicy>;
  getBlockletResponseHeaderPolicies(
    params: PartialDeep<ABTNodeClient.GetBlockletResponseHeaderPoliciesParams>
  ): Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicies>;
  getBlockletAccessPolicy(
    params: PartialDeep<ABTNodeClient.GetBlockletAccessPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletAccessPolicy>;
  getBlockletAccessPolicies(
    params: PartialDeep<ABTNodeClient.GetBlockletAccessPoliciesParams>
  ): Promise<ABTNodeClient.ResponseBlockletAccessPolicies>;
  getWebhookEndpoints(
    params: PartialDeep<ABTNodeClient.GetWebhookEndpointsParams>
  ): Promise<ABTNodeClient.ResponseGetWebhookEndpoints>;
  getWebhookEndpoint(
    params: PartialDeep<ABTNodeClient.GetWebhookEndpointParams>
  ): Promise<ABTNodeClient.ResponseGetWebhookEndpoint>;
  getWebhookAttempts(
    params: PartialDeep<ABTNodeClient.GetWebhookAttemptsParams>
  ): Promise<ABTNodeClient.ResponseGetWebhookAttempts>;
  getPassportRoleCounts(
    params: PartialDeep<ABTNodeClient.GetPassportRoleCountsParams>
  ): Promise<ABTNodeClient.ResponseGetPassportCountPerRole>;
  getPassportsByRole(
    params: PartialDeep<ABTNodeClient.GetPassportsByRoleParams>
  ): Promise<ABTNodeClient.ResponsePassport>;
  getPassportLogs(params: PartialDeep<ABTNodeClient.GetPassportLogsParams>): Promise<ABTNodeClient.ResponsePassportLog>;
  getRelatedPassports(
    params: PartialDeep<ABTNodeClient.GetRelatedPassportsParams>
  ): Promise<ABTNodeClient.ResponsePassport>;
  getBlockletBaseInfo(
    params: PartialDeep<ABTNodeClient.GetBlockletBaseInfoParams>
  ): Promise<ABTNodeClient.ResponseBlockletInfo>;
  getDomainDNS(params: PartialDeep<ABTNodeClient.GetDomainDnsParams>): Promise<ABTNodeClient.ResponseDomainDNS>;
  getOAuthClients(
    params: PartialDeep<ABTNodeClient.GetOAuthClientsParams>
  ): Promise<ABTNodeClient.ResponseOAuthClients>;
  createOAuthClient(
    params: PartialDeep<ABTNodeClient.CreateOAuthClientParams>
  ): Promise<ABTNodeClient.ResponseOAuthClient>;
  updateOAuthClient(
    params: PartialDeep<ABTNodeClient.UpdateOAuthClientParams>
  ): Promise<ABTNodeClient.ResponseOAuthClient>;
  deleteOAuthClient(params: PartialDeep<ABTNodeClient.DeleteOAuthClientParams>): Promise<ABTNodeClient.GeneralResponse>;
  getOrgs(params: PartialDeep<ABTNodeClient.GetOrgsParams>): Promise<ABTNodeClient.ResponseGetOrgs>;
  getOrg(params: PartialDeep<ABTNodeClient.GetOrgParams>): Promise<ABTNodeClient.ResponseGetOrg>;
  getOrgMembers(params: PartialDeep<ABTNodeClient.GetOrgMembersParams>): Promise<ABTNodeClient.ResponseOrgUsers>;
  getOrgInvitableUsers(
    params: PartialDeep<ABTNodeClient.GetOrgInvitableUsersParams>
  ): Promise<ABTNodeClient.ResponseUsers>;
  getOrgResource(
    params: PartialDeep<ABTNodeClient.GetOrgResourceParams>
  ): Promise<ABTNodeClient.ResponseGetOrgResource>;
  installBlocklet(params: PartialDeep<ABTNodeClient.InstallBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  installComponent(params: PartialDeep<ABTNodeClient.InstallComponentParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  startBlocklet(params: PartialDeep<ABTNodeClient.StartBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  stopBlocklet(params: PartialDeep<ABTNodeClient.StopBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  reloadBlocklet(params: PartialDeep<ABTNodeClient.ReloadBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  restartBlocklet(params: PartialDeep<ABTNodeClient.RestartBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  deleteBlocklet(params: PartialDeep<ABTNodeClient.DeleteBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  deleteComponent(params: PartialDeep<ABTNodeClient.DeleteComponentParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  cancelDownloadBlocklet(
    params: PartialDeep<ABTNodeClient.CancelDownloadBlockletParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  checkComponentsForUpdates(
    params: PartialDeep<ABTNodeClient.CheckComponentsForUpdatesParams>
  ): Promise<ABTNodeClient.ResponseCheckComponentsForUpdates>;
  upgradeComponents(
    params: PartialDeep<ABTNodeClient.UpgradeComponentsParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configBlocklet(params: PartialDeep<ABTNodeClient.ConfigBlockletParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  configPublicToStore(
    params: PartialDeep<ABTNodeClient.ConfigPublicToStoreParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configNavigations(
    params: PartialDeep<ABTNodeClient.ConfigNavigationsParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configAuthentication(
    params: PartialDeep<ABTNodeClient.ConfigAuthenticationParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configDidConnect(params: PartialDeep<ABTNodeClient.ConfigDidConnectParams>): Promise<ABTNodeClient.ResponseBlocklet>;
  configDidConnectActions(
    params: PartialDeep<ABTNodeClient.ConfigDidConnectActionsParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configNotification(
    params: PartialDeep<ABTNodeClient.ConfigNotificationParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  configVault(params: PartialDeep<ABTNodeClient.ConfigVaultParams>): Promise<ABTNodeClient.ResponseConfigVault>;
  sendEmail(params: PartialDeep<ABTNodeClient.SendEmailParams>): Promise<ABTNodeClient.GeneralResponse>;
  sendPush(params: PartialDeep<ABTNodeClient.SendPushParams>): Promise<ABTNodeClient.GeneralResponse>;
  joinFederatedLogin(
    params: PartialDeep<ABTNodeClient.JoinFederatedLoginParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  quitFederatedLogin(
    params: PartialDeep<ABTNodeClient.QuitFederatedLoginParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  disbandFederatedLogin(
    params: PartialDeep<ABTNodeClient.DisbandFederatedLoginParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  syncMasterAuthorization(
    params: PartialDeep<ABTNodeClient.SyncMasterAuthorizationParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  syncFederatedConfig(
    params: PartialDeep<ABTNodeClient.SyncFederatedConfigParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  auditFederatedLogin(
    params: PartialDeep<ABTNodeClient.AuditFederatedLoginParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  updateAppSessionConfig(
    params: PartialDeep<ABTNodeClient.UpdateAppSessionConfigParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  updateComponentTitle(
    params: PartialDeep<ABTNodeClient.UpdateComponentTitleParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  updateComponentMountPoint(
    params: PartialDeep<ABTNodeClient.UpdateComponentMountPointParams>
  ): Promise<ABTNodeClient.ResponseBlocklet>;
  backupBlocklet(params: PartialDeep<ABTNodeClient.BackupBlockletParams>): Promise<ABTNodeClient.GeneralResponse>;
  abortBlockletBackup(
    params: PartialDeep<ABTNodeClient.AbortBlockletBackupParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  restoreBlocklet(params: PartialDeep<ABTNodeClient.RestoreBlockletParams>): Promise<ABTNodeClient.GeneralResponse>;
  migrateApplicationToStructV2(
    params: PartialDeep<ABTNodeClient.MigrateApplicationToStructV2Params>
  ): Promise<ABTNodeClient.GeneralResponse>;
  launchBlockletByLauncher(
    params: PartialDeep<ABTNodeClient.LaunchBlockletByLauncherParams>
  ): Promise<ABTNodeClient.ResponseLaunchBlockletByLauncher>;
  launchBlockletWithoutWallet(
    params: PartialDeep<ABTNodeClient.LaunchBlockletWithoutWalletParams>
  ): Promise<ABTNodeClient.ResponseLaunchBlockletWithoutWallet>;
  addBlockletSpaceGateway(
    params: PartialDeep<ABTNodeClient.AddBlockletSpaceGatewayParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  deleteBlockletSpaceGateway(
    params: PartialDeep<ABTNodeClient.DeleteBlockletSpaceGatewayParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  updateBlockletSpaceGateway(
    params: PartialDeep<ABTNodeClient.UpdateBlockletSpaceGatewayParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  updateAutoBackup(params: PartialDeep<ABTNodeClient.UpdateAutoBackupParams>): Promise<ABTNodeClient.GeneralResponse>;
  updateAutoCheckUpdate(
    params: PartialDeep<ABTNodeClient.UpdateAutoCheckUpdateParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  updateBlockletSettings(
    params: PartialDeep<ABTNodeClient.UpdateBlockletSettingsParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  updateNodeInfo(params: PartialDeep<ABTNodeClient.UpdateNodeInfoParams>): Promise<ABTNodeClient.ResponseGetNodeInfo>;
  upgradeNodeVersion(
    params: PartialDeep<ABTNodeClient.UpgradeNodeVersionParams>
  ): Promise<ABTNodeClient.ResponseUpgradeNodeVersion>;
  restartServer(): Promise<ABTNodeClient.ResponseRestartServer>;
  resetNode(params: PartialDeep<ABTNodeClient.ResetNodeParams>): Promise<ABTNodeClient.ResponseResetNode>;
  rotateSessionKey(params: PartialDeep<ABTNodeClient.RotateSessionKeyParams>): Promise<ABTNodeClient.GeneralResponse>;
  updateGateway(params: PartialDeep<ABTNodeClient.UpdateGatewayParams>): Promise<ABTNodeClient.ResponseGateway>;
  clearCache(params: PartialDeep<ABTNodeClient.ClearCacheParams>): Promise<ABTNodeClient.ResponseClearCache>;
  createMemberInvitation(
    params: PartialDeep<ABTNodeClient.CreateMemberInvitationParams>
  ): Promise<ABTNodeClient.ResponseCreateInvitation>;
  createTransferInvitation(
    params: PartialDeep<ABTNodeClient.CreateTransferInvitationParams>
  ): Promise<ABTNodeClient.ResponseCreateTransferNodeInvitation>;
  deleteInvitation(params: PartialDeep<ABTNodeClient.DeleteInvitationParams>): Promise<ABTNodeClient.GeneralResponse>;
  createPassportIssuance(
    params: PartialDeep<ABTNodeClient.CreatePassportIssuanceParams>
  ): Promise<ABTNodeClient.ResponseCreatePassportIssuance>;
  deletePassportIssuance(
    params: PartialDeep<ABTNodeClient.DeletePassportIssuanceParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  configTrustedPassports(
    params: PartialDeep<ABTNodeClient.ConfigTrustedPassportsParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  configTrustedFactories(
    params: PartialDeep<ABTNodeClient.ConfigTrustedFactoriesParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  configPassportIssuance(
    params: PartialDeep<ABTNodeClient.ConfigPassportIssuanceParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  removeUser(params: PartialDeep<ABTNodeClient.RemoveUserParams>): Promise<ABTNodeClient.ResponseUser>;
  updateUserTags(params: PartialDeep<ABTNodeClient.UpdateUserTagsParams>): Promise<ABTNodeClient.ResponseUser>;
  updateUserExtra(params: PartialDeep<ABTNodeClient.UpdateUserExtraParams>): Promise<ABTNodeClient.ResponseUser>;
  updateUserApproval(params: PartialDeep<ABTNodeClient.UpdateUserApprovalParams>): Promise<ABTNodeClient.ResponseUser>;
  issuePassportToUser(
    params: PartialDeep<ABTNodeClient.IssuePassportToUserParams>
  ): Promise<ABTNodeClient.ResponseUser>;
  revokeUserPassport(params: PartialDeep<ABTNodeClient.RevokeUserPassportParams>): Promise<ABTNodeClient.ResponseUser>;
  enableUserPassport(params: PartialDeep<ABTNodeClient.EnableUserPassportParams>): Promise<ABTNodeClient.ResponseUser>;
  removeUserPassport(
    params: PartialDeep<ABTNodeClient.RemoveUserPassportParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  switchProfile(params: PartialDeep<ABTNodeClient.SwitchProfileParams>): Promise<ABTNodeClient.ResponseUser>;
  updateUserAddress(params: PartialDeep<ABTNodeClient.UpdateUserAddressParams>): Promise<ABTNodeClient.ResponseUser>;
  updateUserInfo(params: PartialDeep<ABTNodeClient.UpdateUserInfoParams>): Promise<ABTNodeClient.ResponseUser>;
  createRole(params: PartialDeep<ABTNodeClient.CreateRoleParams>): Promise<ABTNodeClient.ResponseRole>;
  updateRole(params: PartialDeep<ABTNodeClient.UpdateRoleParams>): Promise<ABTNodeClient.ResponseRole>;
  deleteRole(params: PartialDeep<ABTNodeClient.DeleteRoleParams>): Promise<ABTNodeClient.GeneralResponse>;
  createPermission(
    params: PartialDeep<ABTNodeClient.CreatePermissionParams>
  ): Promise<ABTNodeClient.ResponsePermission>;
  updatePermission(
    params: PartialDeep<ABTNodeClient.UpdatePermissionParams>
  ): Promise<ABTNodeClient.ResponsePermission>;
  deletePermission(params: PartialDeep<ABTNodeClient.DeletePermissionParams>): Promise<ABTNodeClient.GeneralResponse>;
  grantPermissionForRole(
    params: PartialDeep<ABTNodeClient.GrantPermissionForRoleParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  revokePermissionFromRole(
    params: PartialDeep<ABTNodeClient.RevokePermissionFromRoleParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  updatePermissionsForRole(
    params: PartialDeep<ABTNodeClient.UpdatePermissionsForRoleParams>
  ): Promise<ABTNodeClient.ResponseRole>;
  hasPermission(params: PartialDeep<ABTNodeClient.HasPermissionParams>): Promise<ABTNodeClient.BooleanResponse>;
  addBlockletStore(params: PartialDeep<ABTNodeClient.AddBlockletStoreParams>): Promise<ABTNodeClient.GeneralResponse>;
  deleteBlockletStore(
    params: PartialDeep<ABTNodeClient.DeleteBlockletStoreParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  getTag(params: PartialDeep<ABTNodeClient.GetTagParams>): Promise<ABTNodeClient.ResponseTag>;
  createTag(params: PartialDeep<ABTNodeClient.CreateTagParams>): Promise<ABTNodeClient.ResponseTag>;
  updateTag(params: PartialDeep<ABTNodeClient.UpdateTagParams>): Promise<ABTNodeClient.ResponseTag>;
  deleteTag(params: PartialDeep<ABTNodeClient.DeleteTagParams>): Promise<ABTNodeClient.ResponseTag>;
  createTagging(params: PartialDeep<ABTNodeClient.CreateTaggingParams>): Promise<ABTNodeClient.ResponseTagging>;
  deleteTagging(params: PartialDeep<ABTNodeClient.DeleteTaggingParams>): Promise<ABTNodeClient.ResponseTagging>;
  readNotifications(
    params: PartialDeep<ABTNodeClient.ReadNotificationsParams>
  ): Promise<ABTNodeClient.ResponseReadNotifications>;
  unreadNotifications(
    params: PartialDeep<ABTNodeClient.UnreadNotificationsParams>
  ): Promise<ABTNodeClient.ResponseReadNotifications>;
  addRoutingSite(params: PartialDeep<ABTNodeClient.AddRoutingSiteParams>): Promise<ABTNodeClient.ResponseRoutingSite>;
  addDomainAlias(params: PartialDeep<ABTNodeClient.AddDomainAliasParams>): Promise<ABTNodeClient.ResponseRoutingSite>;
  deleteDomainAlias(
    params: PartialDeep<ABTNodeClient.DeleteDomainAliasParams>
  ): Promise<ABTNodeClient.ResponseRoutingSite>;
  deleteRoutingSite(params: PartialDeep<ABTNodeClient.DeleteRoutingSiteParams>): Promise<ABTNodeClient.GeneralResponse>;
  updateRoutingSite(
    params: PartialDeep<ABTNodeClient.UpdateRoutingSiteParams>
  ): Promise<ABTNodeClient.ResponseRoutingSite>;
  addRoutingRule(params: PartialDeep<ABTNodeClient.AddRoutingRuleParams>): Promise<ABTNodeClient.ResponseRoutingSite>;
  updateRoutingRule(
    params: PartialDeep<ABTNodeClient.UpdateRoutingRuleParams>
  ): Promise<ABTNodeClient.ResponseRoutingSite>;
  deleteRoutingRule(
    params: PartialDeep<ABTNodeClient.DeleteRoutingRuleParams>
  ): Promise<ABTNodeClient.ResponseRoutingSite>;
  updateCertificate(
    params: PartialDeep<ABTNodeClient.UpdateCertificateParams>
  ): Promise<ABTNodeClient.ResponseUpdateNginxHttpsCert>;
  addCertificate(
    params: PartialDeep<ABTNodeClient.AddCertificateParams>
  ): Promise<ABTNodeClient.ResponseAddNginxHttpsCert>;
  deleteCertificate(
    params: PartialDeep<ABTNodeClient.DeleteCertificateParams>
  ): Promise<ABTNodeClient.ResponseDeleteNginxHttpsCert>;
  issueLetsEncryptCert(
    params: PartialDeep<ABTNodeClient.IssueLetsEncryptCertParams>
  ): Promise<ABTNodeClient.ResponseAddLetsEncryptCert>;
  createAccessKey(
    params: PartialDeep<ABTNodeClient.CreateAccessKeyParams>
  ): Promise<ABTNodeClient.ResponseCreateAccessKey>;
  updateAccessKey(
    params: PartialDeep<ABTNodeClient.UpdateAccessKeyParams>
  ): Promise<ABTNodeClient.ResponseUpdateAccessKey>;
  deleteAccessKey(
    params: PartialDeep<ABTNodeClient.DeleteAccessKeyParams>
  ): Promise<ABTNodeClient.ResponseDeleteAccessKey>;
  verifyAccessKey(params: PartialDeep<ABTNodeClient.VerifyAccessKeyParams>): Promise<ABTNodeClient.ResponseAccessKey>;
  createWebHook(params: PartialDeep<ABTNodeClient.CreateWebHookParams>): Promise<ABTNodeClient.ResponseCreateWebHook>;
  deleteWebHook(params: PartialDeep<ABTNodeClient.DeleteWebHookParams>): Promise<ABTNodeClient.ResponseDeleteWebHook>;
  updateWebHookState(
    params: PartialDeep<ABTNodeClient.UpdateWebHookStateParams>
  ): Promise<ABTNodeClient.ResponseCreateWebhookEndpoint>;
  createProject(params: PartialDeep<ABTNodeClient.CreateProjectParams>): Promise<ABTNodeClient.ResponseProject>;
  updateProject(params: PartialDeep<ABTNodeClient.UpdateProjectParams>): Promise<ABTNodeClient.ResponseProject>;
  deleteProject(params: PartialDeep<ABTNodeClient.DeleteProjectParams>): Promise<ABTNodeClient.GeneralResponse>;
  createRelease(params: PartialDeep<ABTNodeClient.CreateReleaseParams>): Promise<ABTNodeClient.ResponseRelease>;
  deleteRelease(params: PartialDeep<ABTNodeClient.DeleteReleaseParams>): Promise<ABTNodeClient.GeneralResponse>;
  updateSelectedResources(
    params: PartialDeep<ABTNodeClient.UpdateSelectedResourcesParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  connectToStore(
    params: PartialDeep<ABTNodeClient.ConnectToStoreParams>
  ): Promise<ABTNodeClient.ResponseConnectToStore>;
  disconnectFromStore(
    params: PartialDeep<ABTNodeClient.DisconnectFromStoreParams>
  ): Promise<ABTNodeClient.ResponseDisconnectFromStore>;
  publishToStore(
    params: PartialDeep<ABTNodeClient.PublishToStoreParams>
  ): Promise<ABTNodeClient.ResponsePublishToStore>;
  connectByStudio(
    params: PartialDeep<ABTNodeClient.ConnectByStudioParams>
  ): Promise<ABTNodeClient.ResponseConnectByStudio>;
  addBlockletSecurityRule(
    params: PartialDeep<ABTNodeClient.AddBlockletSecurityRuleParams>
  ): Promise<ABTNodeClient.ResponseBlockletSecurityRule>;
  updateBlockletSecurityRule(
    params: PartialDeep<ABTNodeClient.UpdateBlockletSecurityRuleParams>
  ): Promise<ABTNodeClient.ResponseBlockletSecurityRule>;
  deleteBlockletSecurityRule(
    params: PartialDeep<ABTNodeClient.DeleteBlockletSecurityRuleParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  addBlockletResponseHeaderPolicy(
    params: PartialDeep<ABTNodeClient.AddBlockletResponseHeaderPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicy>;
  updateBlockletResponseHeaderPolicy(
    params: PartialDeep<ABTNodeClient.UpdateBlockletResponseHeaderPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletResponseHeaderPolicy>;
  deleteBlockletResponseHeaderPolicy(
    params: PartialDeep<ABTNodeClient.DeleteBlockletResponseHeaderPolicyParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  addBlockletAccessPolicy(
    params: PartialDeep<ABTNodeClient.AddBlockletAccessPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletAccessPolicy>;
  updateBlockletAccessPolicy(
    params: PartialDeep<ABTNodeClient.UpdateBlockletAccessPolicyParams>
  ): Promise<ABTNodeClient.ResponseBlockletAccessPolicy>;
  deleteBlockletAccessPolicy(
    params: PartialDeep<ABTNodeClient.DeleteBlockletAccessPolicyParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  restartAllContainers(): Promise<ABTNodeClient.ResponseRestartAllContainers>;
  createWebhookEndpoint(
    params: PartialDeep<ABTNodeClient.CreateWebhookEndpointParams>
  ): Promise<ABTNodeClient.ResponseCreateWebhookEndpoint>;
  updateWebhookEndpoint(
    params: PartialDeep<ABTNodeClient.UpdateWebhookEndpointParams>
  ): Promise<ABTNodeClient.ResponseUpdateWebhookEndpoint>;
  deleteWebhookEndpoint(
    params: PartialDeep<ABTNodeClient.DeleteWebhookEndpointParams>
  ): Promise<ABTNodeClient.ResponseDeleteWebhookEndpoint>;
  retryWebhookAttempt(
    params: PartialDeep<ABTNodeClient.RetryWebhookAttemptParams>
  ): Promise<ABTNodeClient.ResponseGetWebhookAttempt>;
  regenerateWebhookEndpointSecret(
    params: PartialDeep<ABTNodeClient.RegenerateWebhookEndpointSecretParams>
  ): Promise<ABTNodeClient.ResponseRegenerateWebhookEndpointSecret>;
  addUploadEndpoint(params: PartialDeep<ABTNodeClient.AddUploadEndpointParams>): Promise<ABTNodeClient.GeneralResponse>;
  deleteUploadEndpoint(
    params: PartialDeep<ABTNodeClient.DeleteUploadEndpointParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  connectToEndpoint(
    params: PartialDeep<ABTNodeClient.ConnectToEndpointParams>
  ): Promise<ABTNodeClient.ResponseConnectToEndpoint>;
  disconnectFromEndpoint(
    params: PartialDeep<ABTNodeClient.DisconnectFromEndpointParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  publishToEndpoint(
    params: PartialDeep<ABTNodeClient.PublishToEndpointParams>
  ): Promise<ABTNodeClient.ResponsePublishToEndpoint>;
  connectToAigne(
    params: PartialDeep<ABTNodeClient.ConnectToAigneParams>
  ): Promise<ABTNodeClient.ResponseConnectToEndpoint>;
  disconnectToAigne(params: PartialDeep<ABTNodeClient.DisconnectToAigneParams>): Promise<ABTNodeClient.GeneralResponse>;
  verifyAigneConnection(
    params: PartialDeep<ABTNodeClient.VerifyAigneConnectionParams>
  ): Promise<ABTNodeClient.GeneralResponse>;
  createOrg(params: PartialDeep<ABTNodeClient.CreateOrgParams>): Promise<ABTNodeClient.ResponseGetOrg>;
  updateOrg(params: PartialDeep<ABTNodeClient.UpdateOrgParams>): Promise<ABTNodeClient.ResponseGetOrg>;
  deleteOrg(params: PartialDeep<ABTNodeClient.DeleteOrgParams>): Promise<ABTNodeClient.GeneralResponse>;
  addOrgMember(params: PartialDeep<ABTNodeClient.AddOrgMemberParams>): Promise<ABTNodeClient.ResponseGetOrg>;
  removeOrgMember(params: PartialDeep<ABTNodeClient.RemoveOrgMemberParams>): Promise<ABTNodeClient.GeneralResponse>;
  inviteMembersToOrg(
    params: PartialDeep<ABTNodeClient.InviteMembersToOrgParams>
  ): Promise<ABTNodeClient.ResponseInviteMembersToOrg>;
  addOrgResource(
    params: PartialDeep<ABTNodeClient.AddOrgResourceParams>
  ): Promise<ABTNodeClient.ResponseOrgResourceOperation>;
  migrateOrgResource(
    params: PartialDeep<ABTNodeClient.MigrateOrgResourceParams>
  ): Promise<ABTNodeClient.ResponseOrgResourceOperation>;
}

declare namespace ABTNodeClient {
  export interface SubscriptionResult<T> {
    then(fn: (result: ABTNodeClient.Subscription<T>) => any): Promise<any>;
    catch(fn: (err: Error) => any): Promise<any>;
  }

  export interface Subscription<T> {
    on(event: 'data', fn: (data: T) => any): this;
    on(event: 'error', fn: (err: Error) => void): this;
  }

  export interface WalletTypeObject {
    pk: number;
    role: number;
    address: number;
    hash: number;
  }

  export interface EncodeTxResult {
    object: object;
    buffer: buffer;
  }

  enum BackendServiceType {
    daemon,
    blocklet,
    redirect,
    none,
    general_proxy,
    direct_response,
    rewrite,
    component,
  }

  enum BackupTo {
    spaces,
    disk,
  }

  enum BlockletSource {
    registry,
    local,
    upload,
    url,
    custom,
  }

  enum BlockletStatus {
    added,
    downloading,
    downloaded,
    installing,
    installed,
    starting,
    running,
    stopping,
    stopped,
    error,
    upgrading,
    restarting,
    corrupted,
    waiting,
    deleted,
    unknown,
  }

  enum HeaderMatchType {
    exact,
    partial,
    regexp,
  }

  enum NotificationActivity_ActivityTypeEnum {
    comment,
    like,
    follow,
    tips,
    mention,
    assign,
    un_assign,
  }

  enum NotificationAttachmentType {
    asset,
    vc,
    token,
    text,
    image,
    divider,
    transaction,
    dapp,
    link,
    section,
  }

  enum Notification_NotificationSeverity {
    info,
    success,
    error,
    warning,
  }

  enum Notification_NotificationSource {
    system,
    component,
  }

  enum Notification_NotificationType {
    notification,
    connect,
    feed,
    hi,
    passthrough,
  }

  enum OrgQueryType {
    owned,
    joined,
  }

  enum OrgUserStatus {
    active,
    inviting,
    inactive,
  }

  enum PublishType {
    resource,
    pack,
  }

  enum ReleaseStatus {
    draft,
    published,
  }

  enum SenderType {
    slack,
    api,
  }

  enum StatusCode {
    ok,
    blocklet_not_found,
    blocklet_not_purchased,
    forbidden,
    internal,
    timeout,
  }

  interface AigneConfigInput {
    provider: string;
    model: string;
    key: string;
    url: string;
    accessKeyId: string;
    secretAccessKey: string;
    validationResult: string;
  }

  interface AutoBackupInput {
    enabled: boolean;
  }

  interface AutoBlockPolicyInput {
    enabled: boolean;
    windowSize: number;
    windowQuota: number;
    blockDuration: number;
    statusCodes: number[];
  }

  interface AutoCheckUpdateInput {
    enabled: boolean;
  }

  interface BaseUserInfoInput {
    did: string;
    pk: string;
    role: string;
    avatar: string;
    fullName: string;
    email: string;
    approved: boolean;
    createdAt: number;
    updatedAt: number;
    locale: string;
  }

  interface BlockPolicyInput {
    enabled: boolean;
    blacklist: string[];
    autoBlocking: ABTNodeClient.AutoBlockPolicyInput;
  }

  interface BlockletAccessPolicyInput {
    id: string;
    name: string;
    description: string;
    roles: Record<string, any>;
    reverse: boolean;
    isProtected: boolean;
  }

  interface BlockletAccessPolicyQueryInput {
    search: string;
  }

  interface BlockletDistInput {
    tarball: string;
    integrity: string;
  }

  interface BlockletDockerInput {
    dockerImage: string;
    dockerArgs: ABTNodeClient.DockerRunKeyValuePairInput[];
    dockerEnvs: ABTNodeClient.DockerEnvKeyValuePairInput[];
    dockerCommand: string;
  }

  interface BlockletGatewayInput {
    requestLimit: ABTNodeClient.RequestLimitInput;
    blockPolicy: ABTNodeClient.BlockPolicyInput;
    proxyPolicy: ABTNodeClient.ProxyPolicyInput;
    cacheEnabled: boolean;
    wafPolicy: ABTNodeClient.WAFPolicyInput;
    teamDid: string;
  }

  interface BlockletResponseHeaderPolicyInput {
    id: string;
    name: string;
    description: string;
    securityHeader: string;
    cors: string;
    customHeader: string;
    removeHeader: string;
    isProtected: boolean;
  }

  interface BlockletResponseHeaderPolicyQueryInput {
    search: string;
  }

  interface BlockletSecurityRuleInput {
    id: string;
    pathPattern: string;
    componentDid: string;
    priority: number;
    responseHeaderPolicyId: string;
    accessPolicyId: string;
    enabled: boolean;
    remark: string;
    accessPolicy: ABTNodeClient.BlockletAccessPolicyInput;
    responseHeaderPolicy: ABTNodeClient.BlockletResponseHeaderPolicyInput;
  }

  interface BlockletSecurityRuleQueryInput {
    search: string;
  }

  interface BlockletStoreInput {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
    maintainer: string;
    cdnUrl: string;
    protected: boolean;
    id: string;
    scope: string;
  }

  interface ConfigEntryInput {
    key: string;
    value: string;
    required: boolean;
    description: string;
    validation: string;
    secure: boolean;
    custom: boolean;
    shared: boolean;
  }

  interface ConfigNavigationInput {
    id: string;
    title: string;
    link: string;
    icon: string;
    section: string;
    component: string;
    parent: string;
    role: string;
    visible: boolean;
    from: string;
    activeIcon: string;
    color: string;
    activeColor: string;
    description: string;
    private: boolean;
  }

  interface ConnectedAccountInfoInput {
    name: string;
    picture: string;
    email: string;
    emailVerified: boolean;
    sub: string;
    extraData: Record<string, any>;
  }

  interface ConnectedAccountInput {
    provider: string;
    did: string;
    pk: string;
    id: string;
    lastLoginAt: number;
    userInfo: ABTNodeClient.ConnectedAccountInfoInput;
    extra: Record<string, any>;
  }

  interface DockerEnvKeyValuePairInput {
    key: string;
    value: string;
    description: string;
    secure: boolean;
    shared: boolean;
    required: boolean;
    custom: string;
  }

  interface DockerRunKeyValuePairInput {
    key: string;
    value: string;
    path: string;
    type: string;
    name: string;
    prefix: string;
    protocol: string;
    proxyBehavior: string;
  }

  interface DownloadTokenInput {
    did: string;
    token: string;
  }

  interface EnableEventInput {
    type: string;
    source: string;
  }

  interface GatewayInput {
    requestLimit: ABTNodeClient.RequestLimitInput;
    blockPolicy: ABTNodeClient.BlockPolicyInput;
    proxyPolicy: ABTNodeClient.ProxyPolicyInput;
    cacheEnabled: boolean;
    wafPolicy: ABTNodeClient.WAFPolicyInput;
  }

  interface HashFileInput {
    file: string;
    hash: string;
  }

  interface InviteSettingsInput {
    enabled: boolean;
  }

  interface IssuerInput {
    id: string;
    name: string;
    pk: string;
  }

  interface LoginEmailSettingsInput {
    enabled: boolean;
    requireVerified: boolean;
    requireUnique: boolean;
    trustOauthProviders: boolean;
    enableDomainBlackList: boolean;
    domainBlackList: string[];
    enableDomainWhiteList: boolean;
    domainWhiteList: string[];
    trustedIssuers: ABTNodeClient.IssuerInput[];
  }

  interface LoginPhoneSettingsInput {
    enabled: boolean;
    requireVerified: boolean;
    requireUnique: boolean;
    trustedIssuers: ABTNodeClient.IssuerInput[];
    enableRegionBlackList: boolean;
    regionBlackList: string[];
    enableRegionWhiteList: boolean;
    regionWhiteList: string[];
  }

  interface NodeInfoInput {
    name: string;
    description: string;
    autoUpgrade: boolean;
    enableWelcomePage: boolean;
    registerUrl: string;
    webWalletUrl: string;
    blockletRegistryList: ABTNodeClient.BlockletStoreInput[];
    diskAlertThreshold: number;
    enableBetaRelease: boolean;
    nftDomainUrl: string;
    enableFileSystemIsolation: boolean;
    enableDocker: boolean;
    isDockerInstalled: boolean;
    enableDockerNetwork: boolean;
    enableSessionHardening: boolean;
  }

  interface OauthClientInput {
    redirectUris: string[];
    tokenEndpointAuthMethod: string;
    grantTypes: string[];
    responseTypes: string[];
    clientName: string;
    clientUri: string;
    logoUri: string;
    scope: string;
    contacts: string[];
    tosUri: string;
    policyUri: string;
    jwksUri: string;
    jwks: string;
    softwareId: string;
    softwareVersion: string;
    clientId: string;
    clientIdIssuedAt: number;
    clientSecret: string;
    clientSecretExpiresAt: number;
    updatedAt: number;
    createdBy: string;
    createUser: ABTNodeClient.UserInfoInput;
  }

  interface OrgInput {
    id: string;
    name: string;
    description: string;
    ownerDid: string;
    createdAt: number;
    updatedAt: number;
    members: ABTNodeClient.UserOrgInput[];
    owner: ABTNodeClient.UserInfoInput;
    membersCount: number;
    passports: ABTNodeClient.PassportInput[];
    metadata: Record<string, any>;
    avatar: string;
  }

  interface OrgSettingsInput {
    enabled: boolean;
    maxMemberPerOrg: number;
    maxOrgPerUser: number;
  }

  interface PagingInput {
    total: number;
    pageSize: number;
    pageCount: number;
    page: number;
  }

  interface PassportDisplayInput {
    type: string;
    content: string;
  }

  interface PassportInput {
    id: string;
    name: string;
    title: string;
    issuer: ABTNodeClient.IssuerInput;
    type: string[];
    issuanceDate: number;
    expirationDate: number;
    status: string;
    role: string;
    lastLoginAt: number;
    scope: string;
    display: ABTNodeClient.PassportDisplayInput;
    source: string;
    parentDid: string;
    userDid: string;
    user: ABTNodeClient.BaseUserInfoInput;
  }

  interface PassportLogQueryInput {
    passportId: string;
  }

  interface PassportQueryInput {
    role: string;
    search: string;
    status: string;
  }

  interface PermissionInput {
    name: string;
    description: string;
    isProtected: boolean;
  }

  interface ProxyPolicyInput {
    enabled: boolean;
    trustRecursive: boolean;
    trustedProxies: string[];
    realIpHeader: string;
  }

  interface QueryUserFollowOptionsInput {
    includeUserInfo: boolean;
    includeFollowStatus: boolean;
  }

  interface QueryUserFollowStateOptionsInput {
    includeFollowing: boolean;
    includeFollowers: boolean;
    includeInvitees: boolean;
  }

  interface RequestAbortBlockletBackupInput {
    appPid: string;
  }

  interface RequestAccessKeyInput {
    teamDid: string;
    accessKeyId: string;
  }

  interface RequestAccessKeysInput {
    teamDid: string;
    paging: ABTNodeClient.PagingInput;
    remark: string;
    componentDid: string;
    resourceType: string;
    resourceId: string;
  }

  interface RequestAddBlockletAccessPolicyInput {
    did: string;
    data: ABTNodeClient.BlockletAccessPolicyInput;
  }

  interface RequestAddBlockletResponseHeaderPolicyInput {
    did: string;
    data: ABTNodeClient.BlockletResponseHeaderPolicyInput;
  }

  interface RequestAddBlockletSecurityRuleInput {
    did: string;
    data: ABTNodeClient.BlockletSecurityRuleInput;
  }

  interface RequestAddBlockletSpaceGatewayInput {
    did: string;
    spaceGateway: ABTNodeClient.SpaceGatewayInput;
  }

  interface RequestAddBlockletStoreInput {
    teamDid: string;
    url: string;
    scope: string;
  }

  interface RequestAddDomainAliasInput {
    id: string;
    domainAlias: string;
    force: boolean;
    teamDid: string;
    type: string;
    nftDid: string;
    chainHost: string;
    inBlockletSetup: boolean;
    metadata: string;
  }

  interface RequestAddLetsEncryptCertInput {
    domain: string;
    did: string;
    siteId: string;
    inBlockletSetup: boolean;
  }

  interface RequestAddNginxHttpsCertInput {
    name: string;
    privateKey: string;
    certificate: string;
  }

  interface RequestAddOrgResourceInput {
    teamDid: string;
    orgId: string;
    resourceIds: string[];
    type: string;
    metadata: Record<string, any>;
  }

  interface RequestAddRoutingRuleInput {
    id: string;
    rule: ABTNodeClient.RoutingRuleInput;
    teamDid: string;
  }

  interface RequestAddRoutingSiteInput {
    domain: string;
    type: string;
    rules: ABTNodeClient.RoutingRuleInput[];
  }

  interface RequestAddUploadEndpointInput {
    teamDid: string;
    url: string;
    scope: string;
  }

  interface RequestAttemptIdInput {
    eventId: string;
    webhookId: string;
  }

  interface RequestAttemptInput {
    eventId: string;
    webhookId: string;
    attemptId: string;
    teamDid: string;
  }

  interface RequestAuditFederatedLoginInput {
    did: string;
    memberPid: string;
    status: string;
  }

  interface RequestBackupBlockletInput {
    appDid: string;
    to: ABTNodeClient.BackupTo;
  }

  interface RequestBlockletDetailInput {
    did: string;
    attachDiskInfo: boolean;
    attachRuntimeInfo: boolean;
    getOptionalComponents: boolean;
    domain: string;
    useCache: boolean;
  }

  interface RequestBlockletDiffInput {
    did: string;
    hashFiles: ABTNodeClient.HashFileInput[];
    rootDid: string;
  }

  interface RequestBlockletInput {
    did: string;
  }

  interface RequestBlockletMetaFromUrlInput {
    url: string;
    checkPrice: boolean;
  }

  interface RequestBlockletMetaInput {
    did: string;
    storeUrl: string;
  }

  interface RequestBlockletRuntimeHistoryInput {
    did: string;
    hours: number;
  }

  interface RequestBlockletSettingsInput {
    did: string;
    enableSessionHardening: boolean;
    invite: ABTNodeClient.InviteSettingsInput;
    gateway: ABTNodeClient.BlockletGatewayInput;
    aigne: ABTNodeClient.AigneConfigInput;
    org: ABTNodeClient.OrgSettingsInput;
    subService: ABTNodeClient.SubServiceConfigInput;
  }

  interface RequestCheckDomainsInput {
    domains: string[];
    did: string;
  }

  interface RequestCheckFollowingInput {
    teamDid: string;
    userDids: string[];
    followerDid: string;
  }

  interface RequestClearCacheInput {
    teamDid: string;
    pattern: string;
  }

  interface RequestComponentsInput {
    did: string;
    componentDids: string[];
  }

  interface RequestConfigAuthenticationInput {
    did: string;
    authentication: string;
    oauth: string;
  }

  interface RequestConfigBlockletInput {
    did: string[];
    configs: ABTNodeClient.ConfigEntryInput[];
  }

  interface RequestConfigDidConnectActionsInput {
    did: string;
    actionConfig: string;
  }

  interface RequestConfigDidConnectInput {
    did: string;
    didConnect: string;
  }

  interface RequestConfigNavigationsInput {
    did: string;
    navigations: ABTNodeClient.ConfigNavigationInput[];
  }

  interface RequestConfigNotificationInput {
    did: string;
    notification: string;
  }

  interface RequestConfigPassportIssuanceInput {
    teamDid: string;
    enable: boolean;
  }

  interface RequestConfigPublicToStoreInput {
    did: string;
    publicToStore: boolean;
  }

  interface RequestConfigTrustedFactoriesInput {
    teamDid: string;
    trustedFactories: ABTNodeClient.TrustedFactoryInput[];
  }

  interface RequestConfigTrustedPassportsInput {
    teamDid: string;
    trustedPassports: ABTNodeClient.TrustedPassportInput[];
  }

  interface RequestConfigVaultInput {
    teamDid: string;
    vaultDid: string;
    sessionId: string;
  }

  interface RequestConnectByStudioInput {
    did: string;
    storeId: string;
    storeUrl: string;
    storeName: string;
    blockletTitle: string;
    type: string;
    tenantScope: string;
    componentDid: string;
    messageId: string;
  }

  interface RequestConnectToAigneInput {
    did: string;
    baseUrl: string;
    provider: string;
    model: string;
  }

  interface RequestConnectToEndpointInput {
    did: string;
    endpointId: string;
    projectId: string;
  }

  interface RequestConnectToStoreInput {
    did: string;
    storeId: string;
    storeUrl: string;
    storeName: string;
    projectId: string;
  }

  interface RequestCreateAccessKeyInput {
    teamDid: string;
    remark: string;
    passport: string;
    authType: string;
    componentDid: string;
    resourceType: string;
    resourceId: string;
    createdVia: string;
    expireAt: number;
  }

  interface RequestCreateInvitationInput {
    teamDid: string;
    role: string;
    remark: string;
    sourceAppPid: string;
    display: ABTNodeClient.PassportDisplayInput;
    passportExpireTime: string;
  }

  interface RequestCreateOrgInput {
    teamDid: string;
    name: string;
    description: string;
    ownerDid: string;
    deferPassport: boolean;
  }

  interface RequestCreatePassportIssuanceInput {
    teamDid: string;
    ownerDid: string;
    name: string;
    display: ABTNodeClient.PassportDisplayInput;
    passportExpireTime: string;
  }

  interface RequestCreatePermissionInput {
    teamDid: string;
    name: string;
    description: string;
  }

  interface RequestCreateProjectInput {
    did: string;
    type: ABTNodeClient.PublishType;
    blockletDid: string;
    blockletTitle: string;
    componentDid: string;
    tenantScope: string;
  }

  interface RequestCreateReleaseInput {
    did: string;
    projectId: string;
    releaseId: string;
    blockletDid: string;
    blockletVersion: string;
    blockletTitle: string;
    blockletDescription: string;
    blockletLogo: string;
    blockletIntroduction: string;
    blockletScreenshots: string[];
    note: string;
    status: string;
    blockletComponents: string[];
    uploadedResource: string;
    blockletResourceType: string;
    blockletSupport: string;
    blockletCommunity: string;
    blockletHomepage: string;
    blockletVideos: string[];
    blockletRepository: string;
    contentType: string;
    blockletDocker: ABTNodeClient.BlockletDockerInput;
    blockletSingleton: boolean;
  }

  interface RequestCreateRoleInput {
    teamDid: string;
    name: string;
    title: string;
    description: string;
    childName: string;
    permissions: string[];
    extra: string;
    orgId: string;
  }

  interface RequestCreateTransferNodeInvitationInput {
    teamDid: string;
    remark: string;
  }

  interface RequestCreateWebHookInput {
    type: ABTNodeClient.SenderType;
    title: string;
    description: string;
    params: ABTNodeClient.WebHookParamInput[];
  }

  interface RequestCreateWebhookEndpointInput {
    teamDid: string;
    input: ABTNodeClient.WebhookEndpointStateInput;
  }

  interface RequestDeleteAccessKeyInput {
    teamDid: string;
    accessKeyId: string;
  }

  interface RequestDeleteBlockletAccessPolicyInput {
    did: string;
    id: string;
  }

  interface RequestDeleteBlockletInput {
    did: string;
    keepData: boolean;
    sessionId: string;
  }

  interface RequestDeleteBlockletResponseHeaderPolicyInput {
    did: string;
    id: string;
  }

  interface RequestDeleteBlockletSecurityRuleInput {
    did: string;
    id: string;
  }

  interface RequestDeleteBlockletSpaceGatewayInput {
    did: string;
    spaceGatewayDid: string;
  }

  interface RequestDeleteBlockletStoreInput {
    teamDid: string;
    url: string;
    projectId: string;
    scope: string;
  }

  interface RequestDeleteComponentInput {
    did: string;
    rootDid: string;
    keepData: boolean;
    sessionId: string;
  }

  interface RequestDeleteDomainAliasInput {
    id: string;
    domainAlias: string;
    teamDid: string;
  }

  interface RequestDeleteInvitationInput {
    teamDid: string;
    inviteId: string;
  }

  interface RequestDeleteNginxHttpsCertInput {
    id: string;
  }

  interface RequestDeleteOAuthClientInput {
    teamDid: string;
    clientId: string;
  }

  interface RequestDeletePermissionInput {
    teamDid: string;
    name: string;
  }

  interface RequestDeleteRoleInput {
    teamDid: string;
    name: string;
  }

  interface RequestDeleteRoutingRuleInput {
    id: string;
    ruleId: string;
    teamDid: string;
  }

  interface RequestDeleteRoutingSiteInput {
    id: string;
  }

  interface RequestDeleteTeamSessionInput {
    teamDid: string;
    sessionId: string;
  }

  interface RequestDeleteUploadEndpointInput {
    teamDid: string;
    did: string;
    scope: string;
    projectId: string;
  }

  interface RequestDeleteWebHookInput {
    id: string;
  }

  interface RequestDeleteWebhookEndpointInput {
    teamDid: string;
    id: string;
  }

  interface RequestDisbandFederatedLoginInput {
    did: string;
  }

  interface RequestDisconnectFromEndpointInput {
    did: string;
    endpointId: string;
    projectId: string;
  }

  interface RequestDisconnectFromStoreInput {
    did: string;
    storeId: string;
    projectId: string;
    storeScope: string;
  }

  interface RequestDisconnectToAigneInput {
    did: string;
    url: string;
    key: string;
  }

  interface RequestDomainDNSInput {
    teamDid: string;
    domain: string;
  }

  interface RequestFindCertificateByDomainInput {
    domain: string;
    did: string;
  }

  interface RequestFollowUserActionInput {
    teamDid: string;
    userDid: string;
    followerDid: string;
    options: ABTNodeClient.UserFollowOptionsInput;
  }

  interface RequestGetAuditLogsInput {
    paging: ABTNodeClient.PagingInput;
    scope: string;
    category: string;
    actionOrContent: string;
  }

  interface RequestGetBlockletAccessPoliciesInput {
    did: string;
    paging: ABTNodeClient.PagingInput;
    query: ABTNodeClient.BlockletAccessPolicyQueryInput;
  }

  interface RequestGetBlockletAccessPolicyInput {
    did: string;
    id: string;
  }

  interface RequestGetBlockletBackupSummaryInput {
    did: string;
    startTime: string;
    endTime: string;
  }

  interface RequestGetBlockletBackupsInput {
    did: string;
    startTime: string;
    endTime: string;
  }

  interface RequestGetBlockletResponseHeaderPoliciesInput {
    did: string;
    paging: ABTNodeClient.PagingInput;
    query: ABTNodeClient.BlockletResponseHeaderPolicyQueryInput;
  }

  interface RequestGetBlockletResponseHeaderPolicyInput {
    did: string;
    id: string;
  }

  interface RequestGetBlockletSecurityRuleInput {
    did: string;
    id: string;
  }

  interface RequestGetBlockletSecurityRulesInput {
    did: string;
    paging: ABTNodeClient.PagingInput;
    query: ABTNodeClient.BlockletSecurityRuleQueryInput;
    includeDisabled: boolean;
  }

  interface RequestGetBlockletsInput {
    useCache: boolean;
    includeRuntimeInfo: boolean;
    paging: ABTNodeClient.PagingInput;
    search: string;
    external: boolean;
    sort: ABTNodeClient.SortInput;
  }

  interface RequestGetDynamicComponentsInput {
    url: string;
  }

  interface RequestGetLauncherSessionInput {
    launcherSessionId: string;
    launcherUrl: string;
  }

  interface RequestGetNotificationsInput {
    receiver: string;
    sender: string;
    read: boolean;
    paging: ABTNodeClient.PagingInput;
    teamDid: string;
    severity: string[];
    componentDid: string[];
    entityId: string[];
    source: string[];
  }

  interface RequestGetOrgDataInput {
    teamDid: string;
    orgId: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestGetOrgInput {
    teamDid: string;
    id: string;
  }

  interface RequestGetOrgMemberInput {
    teamDid: string;
    orgId: string;
    userDid: string;
  }

  interface RequestGetOrgResourceInput {
    teamDid: string;
    orgId: string;
    resourceId: string;
  }

  interface RequestGetOrgsInput {
    teamDid: string;
    org: ABTNodeClient.OrgInput;
    paging: ABTNodeClient.PagingInput;
    type: ABTNodeClient.OrgQueryType;
    userDid: string;
    options: ABTNodeClient.RequestGetOrgsOptionsInput;
  }

  interface RequestGetOrgsOptionsInput {
    includeMembers: boolean;
    includePassports: boolean;
  }

  interface RequestGetPassportIssuancesInput {
    teamDid: string;
    ownerDid: string;
  }

  interface RequestGetProjectsInput {
    did: string;
    paging: ABTNodeClient.PagingInput;
    componentDid: string;
    tenantScope: string;
  }

  interface RequestGetReleasesInput {
    did: string;
    projectId: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestGetRoutingSitesInput {
    snapshotHash: string;
  }

  interface RequestGetSelectedResourcesInput {
    did: string;
    projectId: string;
    releaseId: string;
    componentDid: string;
  }

  interface RequestGetSessionInput {
    id: string;
  }

  interface RequestGetTrafficInsightsInput {
    did: string;
    startDate: string;
    endDate: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestGetWebhookAttemptsInput {
    teamDid: string;
    input: ABTNodeClient.RequestAttemptIdInput;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestGetWebhookEndpointInput {
    teamDid: string;
    id: string;
  }

  interface RequestGetWebhookEndpointsInput {
    teamDid: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestGrantPermissionForRoleInput {
    teamDid: string;
    roleName: string;
    grantName: string;
  }

  interface RequestHasPermissionInput {
    teamDid: string;
    role: string;
    permission: string;
  }

  interface RequestInstallBlockletInput {
    type: string;
    did: string;
    storeUrl: string;
    url: string;
    file: undefined;
    diffVersion: string;
    deleteSet: string[];
    title: string;
    description: string;
    startImmediately: boolean;
    appSk: string;
    downloadTokenList: ABTNodeClient.DownloadTokenInput[];
  }

  interface RequestInstallComponentInput {
    rootDid: string;
    mountPoint: string;
    url: string;
    file: undefined;
    did: string;
    diffVersion: string;
    deleteSet: string[];
    name: string;
    title: string;
    configs: ABTNodeClient.ConfigEntryInput[];
    downloadTokenList: ABTNodeClient.DownloadTokenInput[];
    skipNavigation: boolean;
    onlyRequired: boolean;
    dist: ABTNodeClient.BlockletDistInput;
  }

  interface RequestInvitableUsersInput {
    teamDid: string;
    id: string;
    query: ABTNodeClient.UserQueryInput;
  }

  interface RequestInviteMembersToOrgInput {
    teamDid: string;
    orgId: string;
    userDids: string[];
    role: string;
    inviteType: string;
    email: string;
  }

  interface RequestIsDidDomainInput {
    domain: string;
  }

  interface RequestIssuePassportToUserInput {
    teamDid: string;
    userDid: string;
    role: string;
    display: ABTNodeClient.PassportDisplayInput;
    notify: boolean;
    notification: string;
  }

  interface RequestJoinFederatedLoginInput {
    did: string;
    appUrl: string;
  }

  interface RequestLaunchBlockletByLauncherInput {
    blockletMetaUrl: string;
    title: string;
    description: string;
    chainHost: string;
    launcherSessionId: string;
    launcherUrl: string;
    onlyRequired: boolean;
    type: string;
    storeUrl: string;
    autoStart: boolean;
    bindDomainCap: string;
    domainNftDid: string;
  }

  interface RequestLaunchBlockletWithoutWalletInput {
    blockletMetaUrl: string;
    title: string;
    description: string;
    onlyRequired: boolean;
    type: string;
    storeUrl: string;
  }

  interface RequestLimitInput {
    enabled: boolean;
    global: number;
    burstFactor: number;
    burstDelay: number;
    rate: number;
    methods: string[];
  }

  interface RequestLogoutUserInput {
    teamDid: string;
    appPid: string;
    userDid: string;
    visitorId: string;
    remove: boolean;
  }

  interface RequestMakeAllNotificationsAsReadInput {
    receiver: string;
    teamDid: string;
    severity: string;
    componentDid: string;
    entityId: string;
    source: string;
  }

  interface RequestMigrateApplicationToStructV2Input {
    did: string;
    appSk: string;
  }

  interface RequestMigrateOrgResourceInput {
    teamDid: string;
    from: string;
    to: string;
    resourceIds: string[];
  }

  interface RequestNodeRuntimeHistoryInput {
    hours: number;
  }

  interface RequestNotificationComponentsInput {
    teamDid: string;
    receiver: string;
  }

  interface RequestNotificationSendLogInput {
    teamDid: string;
    dateRange: string[];
    paging: ABTNodeClient.PagingInput;
    source: string;
    componentDids: string[];
    severities: string[];
  }

  interface RequestOAuthClientInput {
    teamDid: string;
    input: ABTNodeClient.OauthClientInput;
  }

  interface RequestPassportInput {
    teamDid: string;
    query: ABTNodeClient.PassportQueryInput;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestPassportLogInput {
    teamDid: string;
    query: ABTNodeClient.PassportLogQueryInput;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestProjectInput {
    did: string;
    projectId: string;
    messageId: string;
  }

  interface RequestPublishToEndpointInput {
    did: string;
    endpointId: string;
    projectId: string;
    releaseId: string;
  }

  interface RequestPublishToStoreInput {
    did: string;
    projectId: string;
    releaseId: string;
    type: string;
    storeId: string;
  }

  interface RequestQuitFederatedLoginInput {
    did: string;
    targetDid: string;
  }

  interface RequestReadNotificationsInput {
    notificationIds: string[];
    teamDid: string;
    receiver: string;
  }

  interface RequestReceiversInput {
    teamDid: string;
    userName: string;
    userDid: string;
    walletSendStatus: number[];
    pushKitSendStatus: number[];
    emailSendStatus: number[];
    dateRange: string[];
    paging: ABTNodeClient.PagingInput;
    notificationId: string;
  }

  interface RequestRegenerateWebhookEndpointSecretInput {
    teamDid: string;
    id: string;
  }

  interface RequestRelatedPassportsInput {
    teamDid: string;
    passportId: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestReleaseInput {
    did: string;
    projectId: string;
    releaseId: string;
  }

  interface RequestResendNotificationInput {
    teamDid: string;
    notificationId: string;
    receivers: string[];
    channels: string[];
    webhookUrls: string[];
    resendFailedOnly: boolean;
  }

  interface RequestResetNodeInput {
    owner: boolean;
    blocklets: boolean;
    webhooks: boolean;
    certificates: boolean;
    accessKeys: boolean;
    blockletExtras: boolean;
    routingRules: boolean;
    users: boolean;
    invitations: boolean;
  }

  interface RequestRestoreBlockletInput {
    endpoint: string;
    appDid: string;
    delegation: string;
    password: undefined;
    wallet: Record<string, any>;
    from: ABTNodeClient.BackupTo;
    appPid: string;
  }

  interface RequestRevokePermissionFromRoleInput {
    teamDid: string;
    roleName: string;
    grantName: string;
  }

  interface RequestRevokeUserPassportInput {
    teamDid: string;
    userDid: string;
    passportId: string;
  }

  interface RequestRotateSessionKeyInput {
    teamDid: string;
    sessionId: string;
  }

  interface RequestSendEmailInput {
    did: string;
    receiver: string;
    email: string;
  }

  interface RequestSendMsgInput {
    webhookId: string;
    message: string;
  }

  interface RequestSendPushInput {
    did: string;
    receiver: string;
    notification: string;
  }

  interface RequestSwitchProfileInput {
    teamDid: string;
    userDid: string;
    profile: ABTNodeClient.UserProfileInput;
  }

  interface RequestSyncFederatedInput {
    did: string;
  }

  interface RequestSyncMasterAuthorizationInput {
    did: string;
  }

  interface RequestTagInput {
    teamDid: string;
    tag: ABTNodeClient.TagInput;
    moveTo: number;
  }

  interface RequestTaggingInput {
    teamDid: string;
    tagging: ABTNodeClient.TaggingInput;
  }

  interface RequestTagsInput {
    teamDid: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestTeamPermissionInput {
    teamDid: string;
    permission: ABTNodeClient.PermissionInput;
  }

  interface RequestTeamRoleInput {
    teamDid: string;
    role: ABTNodeClient.RoleUpdateInput;
    orgId: string;
  }

  interface RequestTeamUserInput {
    teamDid: string;
    user: ABTNodeClient.UserInfoInput;
    options: ABTNodeClient.RequestTeamUserOptionsInput;
    sessionId: string;
  }

  interface RequestTeamUserOptionsInput {
    enableConnectedAccount: boolean;
    includeTags: boolean;
    includeFederated: boolean;
  }

  interface RequestUpdateAccessKeyInput {
    teamDid: string;
    accessKeyId: string;
    remark: string;
    passport: string;
    expireAt: number;
  }

  interface RequestUpdateAppSessionConfigInput {
    did: string;
    config: ABTNodeClient.SessionConfigInput;
  }

  interface RequestUpdateAutoBackupInput {
    did: string;
    autoBackup: ABTNodeClient.AutoBackupInput;
  }

  interface RequestUpdateAutoCheckUpdateInput {
    did: string;
    autoCheckUpdate: ABTNodeClient.AutoCheckUpdateInput;
  }

  interface RequestUpdateBlockletAccessPolicyInput {
    did: string;
    data: ABTNodeClient.BlockletAccessPolicyInput;
  }

  interface RequestUpdateBlockletResponseHeaderPolicyInput {
    did: string;
    data: ABTNodeClient.BlockletResponseHeaderPolicyInput;
  }

  interface RequestUpdateBlockletSecurityRuleInput {
    did: string;
    data: ABTNodeClient.BlockletSecurityRuleInput;
  }

  interface RequestUpdateBlockletSpaceGatewayInput {
    did: string;
    where: ABTNodeClient.SpaceGatewayInput;
    spaceGateway: ABTNodeClient.SpaceGatewayInput;
  }

  interface RequestUpdateComponentMountPointInput {
    did: string;
    rootDid: string;
    mountPoint: string;
  }

  interface RequestUpdateComponentTitleInput {
    did: string;
    rootDid: string;
    title: string;
  }

  interface RequestUpdateComponentsInput {
    updateId: string;
    rootDid: string;
    selectedComponents: string[];
  }

  interface RequestUpdateNginxHttpsCertInput {
    id: string;
    name: string;
    certificate: string;
    privateKey: string;
  }

  interface RequestUpdateOrgInput {
    teamDid: string;
    org: ABTNodeClient.OrgInput;
  }

  interface RequestUpdatePermissionsForRoleInput {
    teamDid: string;
    roleName: string;
    grantNames: string[];
  }

  interface RequestUpdateProjectInput {
    did: string;
    projectId: string;
    blockletTitle: string;
    blockletDescription: string;
    blockletIntroduction: string;
    autoUpload: boolean;
    possibleSameStore: boolean;
    blockletSupport: string;
    blockletCommunity: string;
    blockletHomepage: string;
  }

  interface RequestUpdateRoutingRuleInput {
    id: string;
    rule: ABTNodeClient.RoutingRuleInput;
    teamDid: string;
  }

  interface RequestUpdateRoutingSiteInput {
    id: string;
    corsAllowedOrigins: string[];
    domain: string;
    teamDid: string;
  }

  interface RequestUpdateSelectedResourcesInput {
    did: string;
    projectId: string;
    releaseId: string;
    componentDid: string;
    resources: string[];
  }

  interface RequestUpdateUserAddressInput {
    teamDid: string;
    did: string;
    address: ABTNodeClient.UserAddressInput;
  }

  interface RequestUpdateUserExtraInput {
    teamDid: string;
    did: string;
    remark: string;
    extra: string;
  }

  interface RequestUpdateUserInfoInput {
    teamDid: string;
    user: ABTNodeClient.UserInfoInput;
  }

  interface RequestUpdateUserTagsInput {
    teamDid: string;
    did: string;
    tags: number[];
  }

  interface RequestUpdateWebHookStateInput {
    id: string;
    url: string;
    enabled: boolean;
    consecutiveFailures: number;
  }

  interface RequestUpdateWebhookEndpointInput {
    teamDid: string;
    id: string;
    data: ABTNodeClient.WebhookEndpointStateInput;
  }

  interface RequestUpgradeNodeVersionInput {
    sessionId: string;
  }

  interface RequestUserRelationCountInput {
    teamDid: string;
    userDids: string[];
    options: ABTNodeClient.QueryUserFollowStateOptionsInput;
  }

  interface RequestUserRelationQueryInput {
    teamDid: string;
    userDid: string;
    paging: ABTNodeClient.PagingInput;
    sort: ABTNodeClient.UserSortInput;
    options: ABTNodeClient.QueryUserFollowOptionsInput;
  }

  interface RequestUserSessionsCountInput {
    teamDid: string;
    query: ABTNodeClient.UserSessionQueryInput;
  }

  interface RequestUserSessionsInput {
    teamDid: string;
    query: ABTNodeClient.UserSessionQueryInput;
    sort: ABTNodeClient.UserSessionSortInput;
    paging: ABTNodeClient.PagingInput;
  }

  interface RequestUsersInput {
    teamDid: string;
    query: ABTNodeClient.UserQueryInput;
    sort: ABTNodeClient.UserSortInput;
    paging: ABTNodeClient.PagingInput;
    dids: string[];
  }

  interface RequestVerifyAccessKeyInput {
    teamDid: string;
    accessKeyId: string;
    resourceType: string;
    resourceId: string;
    componentDid: string;
  }

  interface RequestVerifyAigneConnectionInput {
    did: string;
  }

  interface RoleUpdateInput {
    name: string;
    title: string;
    description: string;
    extra: string;
  }

  interface RoutingRuleFromInput {
    pathPrefix: string;
    header: ABTNodeClient.RoutingRuleHeaderInput[];
  }

  interface RoutingRuleHeaderInput {
    key: string;
    value: string;
    type: ABTNodeClient.HeaderMatchType;
  }

  interface RoutingRuleInput {
    id: string;
    from: ABTNodeClient.RoutingRuleFromInput;
    to: ABTNodeClient.RoutingRuleToInput;
    isProtected: boolean;
  }

  interface RoutingRuleResponseInput {
    status: number;
    contentType: string;
    body: string;
  }

  interface RoutingRuleToInput {
    port: number;
    type: ABTNodeClient.BackendServiceType;
    did: string;
    url: string;
    redirectCode: number;
    interfaceName: string;
    componentId: string;
    pageGroup: string;
    response: ABTNodeClient.RoutingRuleResponseInput;
  }

  interface SessionConfigInput {
    cacheTtl: number;
    ttl: number;
    email: ABTNodeClient.LoginEmailSettingsInput;
    phone: ABTNodeClient.LoginPhoneSettingsInput;
    salt: string;
    enableBlacklist: boolean;
  }

  interface SortInput {
    field: string;
    direction: string;
  }

  interface SpaceGatewayInput {
    name: string;
    url: string;
    protected: string;
    endpoint: string;
    did: string;
  }

  interface SubServiceConfigInput {
    enabled: boolean;
    domain: string;
    staticRoot: string;
  }

  interface TagInput {
    id: number;
    title: string;
    description: string;
    color: string;
    createdAt: number;
    updatedAt: number;
    slug: string;
    type: string;
    componentDid: string;
    parentId: number;
    createdBy: string;
    updatedBy: string;
  }

  interface TaggingInput {
    tagId: number;
    taggableType: string;
    taggableIds: string[];
  }

  interface TeamInput {
    teamDid: string;
    paging: ABTNodeClient.PagingInput;
  }

  interface TrustedFactoryInput {
    holderDid: string;
    issuerDid: string;
    factoryAddress: string;
    remark: string;
    passport: ABTNodeClient.TrustedPassportMappingToInput;
  }

  interface TrustedPassportInput {
    issuerDid: string;
    remark: string;
    mappings: ABTNodeClient.TrustedPassportMappingInput[];
  }

  interface TrustedPassportMappingFromInput {
    passport: string;
  }

  interface TrustedPassportMappingInput {
    from: ABTNodeClient.TrustedPassportMappingFromInput;
    to: ABTNodeClient.TrustedPassportMappingToInput;
  }

  interface TrustedPassportMappingToInput {
    role: string;
    ttl: string;
    ttlPolicy: string;
  }

  interface UserAddressInput {
    country: string;
    province: string;
    city: string;
    postalCode: string;
    line1: string;
    line2: string;
  }

  interface UserFollowOptionsInput {
    skipNotification: boolean;
  }

  interface UserInfoInput {
    did: string;
    pk: string;
    role: string;
    avatar: string;
    fullName: string;
    email: string;
    approved: boolean;
    createdAt: number;
    updatedAt: number;
    locale: string;
    passports: ABTNodeClient.PassportInput[];
    firstLoginAt: number;
    lastLoginAt: number;
    remark: string;
    lastLoginIp: string;
    sourceProvider: string;
    sourceAppPid: string;
    connectedAccounts: ABTNodeClient.ConnectedAccountInput[];
    extra: Record<string, any>;
    tags: ABTNodeClient.TagInput[];
    didSpace: Record<string, any>;
    userSessions: ABTNodeClient.UserSessionInput[];
    url: string;
    phone: string;
    inviter: string;
    generation: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    metadata: ABTNodeClient.UserMetadataInput;
    address: ABTNodeClient.UserAddressInput;
    userSessionsCount: number;
    isFollowing: boolean;
    name: string;
    createdByAppPid: string;
  }

  interface UserMetadataInput {
    bio: string;
    location: string;
    timezone: string;
    cover: string;
    links: ABTNodeClient.UserMetadataLinkInput[];
    status: ABTNodeClient.UserMetadataStatusInput;
    phone: ABTNodeClient.UserPhoneInfoInput;
  }

  interface UserMetadataLinkInput {
    url: string;
    favicon: string;
  }

  interface UserMetadataStatusInput {
    label: string;
    icon: string;
    duration: string;
    dateRange: number[];
  }

  interface UserOrgInput {
    id: string;
    orgId: string;
    userDid: string;
    status: ABTNodeClient.OrgUserStatus;
    createdAt: number;
    updatedAt: number;
    user: ABTNodeClient.UserInfoInput;
    metadata: Record<string, any>;
  }

  interface UserPhoneInfoInput {
    country: string;
    phoneNumber: string;
  }

  interface UserProfileInput {
    did: string;
    avatar: string;
    fullName: string;
    email: string;
  }

  interface UserQueryInput {
    role: string;
    approved: boolean;
    search: string;
    connectedDid: string;
    tags: number[];
    inviter: string;
    invitee: string;
    generation: number;
    includeTags: boolean;
    includeUserSessions: boolean;
    includePassports: boolean;
    includeConnectedAccounts: boolean;
    includeFollowStatus: boolean;
    createdByAppPid: string;
  }

  interface UserSessionInput {
    id: string;
    visitorId: string;
    appPid: string;
    userDid: string;
    ua: string;
    passportId: string;
    status: string;
    lastLoginIp: string;
    extra: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    createdByAppPid: string;
  }

  interface UserSessionQueryInput {
    userDid: string;
    visitorId: string;
    appPid: string;
    status: string;
    includeUser: boolean;
    createdByAppPid: string;
  }

  interface UserSessionSortInput {
    updatedAt: number;
    createdAt: number;
  }

  interface UserSortInput {
    updatedAt: number;
    createdAt: number;
    lastLoginAt: number;
  }

  interface WAFPolicyInput {
    enabled: boolean;
    mode: string;
    inboundAnomalyScoreThreshold: number;
    outboundAnomalyScoreThreshold: number;
    logLevel: number;
  }

  interface WebHookParamInput {
    name: string;
    description: string;
    required: boolean;
    defaultValue: string;
    value: string;
    type: string;
    enabled: boolean;
    consecutiveFailures: number;
  }

  interface WebhookEndpointStateInput {
    id: string;
    apiVersion: string;
    url: string;
    description: string;
    enabledEvents: ABTNodeClient.EnableEventInput[];
    metadata: Record<string, any>;
    status: string;
    createdAt: number;
    updatedAt: number;
    secret: string;
  }

  interface AccessKey {
    accessKeyId: string;
    accessKeyPublic: string;
    remark: string;
    passport: string;
    createdAt: number;
    updatedAt: number;
    lastUsedAt: number;
    createdBy: string;
    updatedBy: string;
    authType: string;
    componentDid: string;
    resourceType: string;
    resourceId: string;
    createdVia: string;
    expireAt: number;
  }

  interface AigneConfig {
    provider: string;
    model: string;
    key: string;
    url: string;
    accessKeyId: string;
    secretAccessKey: string;
    validationResult: string;
  }

  interface AuditLog {
    id: string;
    scope: string;
    category: string;
    action: string;
    content: string;
    actor: ABTNodeClient.AuditLogActor;
    env: ABTNodeClient.AuditLogEnv;
    createdAt: number;
    ip: string;
    ua: string;
    componentDid: string;
  }

  interface AuditLogActor {
    did: string;
    role: string;
    fullName: string;
    avatar: string;
    source: string;
  }

  interface AuditLogEnv {
    browser: ABTNodeClient.AuditLogEnvItem;
    os: ABTNodeClient.AuditLogEnvItem;
  }

  interface AuditLogEnvItem {
    name: string;
    version: string;
  }

  interface AutoBackup {
    enabled: boolean;
  }

  interface AutoBlockPolicy {
    enabled: boolean;
    windowSize: number;
    windowQuota: number;
    blockDuration: number;
    statusCodes: number[];
  }

  interface AutoCheckUpdate {
    enabled: boolean;
  }

  interface Backup {
    appPid: string;
    userDid: string;
    strategy: number;
    sourceUrl: string;
    target: string;
    targetName: string;
    targetUrl: string;
    createdAt: number;
    updatedAt: number;
    status: number;
    message: string;
    progress: number;
    metadata: Record<string, any>;
  }

  interface BackupSummaryItem {
    date: string;
    successCount: number;
    errorCount: number;
  }

  interface BaseUserInfo {
    did: string;
    pk: string;
    role: string;
    avatar: string;
    fullName: string;
    email: string;
    approved: boolean;
    createdAt: number;
    updatedAt: number;
    locale: string;
  }

  interface BlockPolicy {
    enabled: boolean;
    blacklist: string[];
    autoBlocking: ABTNodeClient.AutoBlockPolicy;
  }

  interface BlockletAccessPolicy {
    id: string;
    name: string;
    description: string;
    roles: Record<string, any>;
    reverse: boolean;
    isProtected: boolean;
  }

  interface BlockletBackupState {
    appDid: string;
    appPid: string;
    name: string;
    createdAt: number;
  }

  interface BlockletCapabilities {
    clusterMode: boolean;
    component: boolean;
    navigation: boolean;
    didSpace: string;
    resourceExportApi: string;
  }

  interface BlockletController {
    id: string;
    nftId: string;
    nftOwner: string;
    chainHost: string;
    expireDate: number;
    consumedAt: string;
    launcherUrl: string;
    launcherSessionId: string;
    ownerDid: string;
    status: ABTNodeClient.BlockletControllerStatus;
  }

  interface BlockletControllerStatus {
    value: number;
    reason: string;
  }

  interface BlockletDiff {
    hasBlocklet: boolean;
    version: string;
    addSet: string[];
    changeSet: string[];
    deleteSet: string[];
  }

  interface BlockletDist {
    tarball: string;
    integrity: string;
  }

  interface BlockletDocker {
    dockerImage: string;
    dockerArgs: ABTNodeClient.DockerRunKeyValuePair[];
    dockerEnvs: ABTNodeClient.DockerEnvKeyValuePair[];
    dockerCommand: string;
  }

  interface BlockletDockerMeta {
    image: string;
    shell: string;
    runBaseScript: boolean;
    installNodeModules: boolean;
  }

  interface BlockletEngine {
    name: string;
    displayName: string;
    description: string;
    version: string;
    available: boolean;
    visible: boolean;
    logo: string;
  }

  interface BlockletEvent {
    type: string;
    description: string;
  }

  interface BlockletHistoryItem {
    date: number;
    cpu: number;
    mem: number;
  }

  interface BlockletHistoryItemList {
    key: string;
    value: ABTNodeClient.BlockletHistoryItem[];
  }

  interface BlockletIntegrations {
    webhooks: number;
    accessKeys: number;
    oauthApps: number;
  }

  interface BlockletMeta {
    did: string;
    name: string;
    version: string;
    description: string;
    interfaces: ABTNodeClient.BlockletMetaInterface[];
    author: ABTNodeClient.BlockletMetaPerson;
    main: string;
    stats: ABTNodeClient.BlockletStats;
    homepage: string;
    path: string;
    community: string;
    documentation: string;
    support: string;
    screenshots: string[];
    keywords: string[];
    group: string;
    logo: string;
    title: string;
    dist: ABTNodeClient.BlockletDist;
    maintainers: ABTNodeClient.BlockletMetaPerson[];
    contributors: ABTNodeClient.BlockletMetaPerson[];
    repository: ABTNodeClient.BlockletRepository;
    payment: ABTNodeClient.BlockletPayment;
    nftFactory: string;
    lastPublishedAt: number;
    capabilities: ABTNodeClient.BlockletCapabilities;
    components: ABTNodeClient.ChildConfig[];
    environments: ABTNodeClient.Environment[];
    requirements: ABTNodeClient.Requirement;
    bundleDid: string;
    bundleName: string;
    navigation: Record<string, any>[];
    resources: string[];
    resource: ABTNodeClient.BlockletResource;
    engine: Record<string, any>;
    owner: ABTNodeClient.BlockletMetaOwner;
    docker: ABTNodeClient.BlockletDockerMeta;
    events: ABTNodeClient.BlockletEvent[];
  }

  interface BlockletMetaInterface {
    type: string;
    name: string;
    path: string;
    prefix: string;
    protocol: string;
    port: Record<string, any>;
    services: ABTNodeClient.BlockletMetaService[];
    cacheable: string[];
    pageGroups: string[];
  }

  interface BlockletMetaOwner {
    avatar: string;
    did: string;
    email: string;
    fullName: string;
  }

  interface BlockletMetaPerson {
    name: string;
    email: string;
    url: string;
  }

  interface BlockletMetaService {
    name: string;
    config: Record<string, any>;
  }

  interface BlockletMigrateRecord {
    appSk: string;
    appDid: string;
    at: string;
  }

  interface BlockletPassport {
    passports: number;
    activePassports: number;
  }

  interface BlockletPayment {
    price: ABTNodeClient.BlockletPaymentPrice[];
    share: ABTNodeClient.BlockletPaymentShare[];
  }

  interface BlockletPaymentPrice {
    address: string;
    value: string;
    symbol: string;
  }

  interface BlockletPaymentShare {
    address: string;
    name: string;
    value: string;
  }

  interface BlockletPreUpdateInfo {
    updateId: string;
    updateList: ABTNodeClient.UpdateList[];
  }

  interface BlockletRepository {
    type: string;
    url: string;
  }

  interface BlockletResource {
    exportApi: string;
    types: ABTNodeClient.BlockletResourceType[];
    bundles: ABTNodeClient.BlockletResourceBundle[];
  }

  interface BlockletResourceBundle {
    did: string;
    type: string;
    public: boolean;
  }

  interface BlockletResourceType {
    type: string;
    description: string;
  }

  interface BlockletResponseHeaderPolicy {
    id: string;
    name: string;
    description: string;
    securityHeader: string;
    cors: string;
    customHeader: string;
    removeHeader: string;
    isProtected: boolean;
  }

  interface BlockletSecurityRule {
    id: string;
    pathPattern: string;
    componentDid: string;
    priority: number;
    responseHeaderPolicyId: string;
    accessPolicyId: string;
    enabled: boolean;
    remark: string;
    accessPolicy: ABTNodeClient.BlockletAccessPolicy;
    responseHeaderPolicy: ABTNodeClient.BlockletResponseHeaderPolicy;
  }

  interface BlockletSettings {
    initialized: boolean;
    enablePassportIssuance: boolean;
    trustedPassports: ABTNodeClient.TrustedPassport[];
    whoCanAccess: string;
    owner: ABTNodeClient.WalletInfo;
    children: ABTNodeClient.SimpleBlockletState[];
    publicToStore: boolean;
    storeList: ABTNodeClient.BlockletStore[];
    navigations: ABTNodeClient.ConfigNavigation[];
    authentication: Record<string, any>;
    trustedFactories: ABTNodeClient.TrustedFactory[];
    notification: Record<string, any>;
    session: ABTNodeClient.SessionConfig;
    federated: ABTNodeClient.FederatedConfig;
    autoCheckUpdate: ABTNodeClient.AutoCheckUpdate;
    autoBackup: ABTNodeClient.AutoBackup;
    invite: ABTNodeClient.InviteSettings;
    theme: Record<string, any>;
    endpointList: ABTNodeClient.ConnectEndpoint[];
    gateway: ABTNodeClient.Gateway;
    enableSessionHardening: boolean;
    aigne: ABTNodeClient.AigneConfig;
    org: ABTNodeClient.OrgSettings;
    didConnect: Record<string, any>;
    oauth: Record<string, any>;
    actionConfig: Record<string, any>;
    subService: ABTNodeClient.SubServiceConfig;
  }

  interface BlockletState {
    meta: ABTNodeClient.BlockletMeta;
    status: ABTNodeClient.BlockletStatus;
    createdAt: number;
    installedAt: number;
    startedAt: number;
    pausedAt: number;
    stoppedAt: number;
    updatedAt: number;
    environments: ABTNodeClient.ConfigEntry[];
    configs: ABTNodeClient.ConfigEntry[];
    diskInfo: ABTNodeClient.DiskInfo;
    runtimeInfo: ABTNodeClient.RuntimeInfo;
    appRuntimeInfo: ABTNodeClient.RuntimeInfo;
    source: ABTNodeClient.BlockletSource;
    deployedFrom: string;
    bundleSource: Record<string, any>;
    port: number;
    engine: ABTNodeClient.BlockletEngine;
    mode: string;
    ports: Record<string, any>;
    children: ABTNodeClient.ComponentState[];
    optionalComponents: ABTNodeClient.OptionalComponentState[];
    trustedPassports: ABTNodeClient.TrustedPassport[];
    trustedFactories: ABTNodeClient.TrustedFactory[];
    enablePassportIssuance: boolean;
    dynamic: boolean;
    mountPoint: string;
    settings: ABTNodeClient.BlockletSettings;
    appDid: string;
    site: ABTNodeClient.RoutingSite;
    controller: ABTNodeClient.BlockletController;
    migratedFrom: ABTNodeClient.BlockletMigrateRecord[];
    appPid: string;
    externalSk: boolean;
    externalSkSource: string;
    structVersion: string;
    enableDocker: boolean;
    enableDockerNetwork: boolean;
    vaults: ABTNodeClient.BlockletVaultRecord[];
  }

  interface BlockletStats {
    downloads: number;
    star: number;
    purchases: number;
  }

  interface BlockletStore {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
    maintainer: string;
    cdnUrl: string;
    protected: boolean;
    id: string;
    scope: string;
  }

  interface BlockletStudio {
    blocklets: number;
    releases: number;
  }

  interface BlockletTraffic {
    totalRequests: number;
    failedRequests: number;
  }

  interface BlockletUsers {
    users: number;
    approvedUsers: number;
  }

  interface BlockletVaultRecord {
    pk: string;
    did: string;
    at: number;
    sig: string;
    approverSig: string;
    approverDid: string;
    approverPk: string;
  }

  interface BooleanResponse {
    code: ABTNodeClient.StatusCode;
    result: boolean;
  }

  interface Certificate {
    name: string;
    domain: string;
    id: string;
    meta: ABTNodeClient.CertificateMeta;
    matchedSites: ABTNodeClient.MatchedSites[];
    createdAt: number;
    updatedAt: number;
    isProtected: boolean;
    source: string;
    status: string;
  }

  interface CertificateIssuer {
    countryName: string;
    organizationName: string;
    commonName: string;
  }

  interface CertificateMeta {
    issuer: ABTNodeClient.CertificateIssuer;
    sans: string[];
    validFrom: number;
    validTo: number;
    fingerprintAlg: string;
    fingerprint: string;
    validityPeriod: number;
  }

  interface ChildConfig {
    name: string;
    mountPoint: string;
    required: boolean;
  }

  interface ComponentState {
    meta: ABTNodeClient.BlockletMeta;
    status: ABTNodeClient.BlockletStatus;
    createdAt: number;
    installedAt: number;
    startedAt: number;
    pausedAt: number;
    stoppedAt: number;
    environments: ABTNodeClient.ConfigEntry[];
    configs: ABTNodeClient.ConfigEntry[];
    diskInfo: ABTNodeClient.DiskInfo;
    runtimeInfo: ABTNodeClient.RuntimeInfo;
    source: ABTNodeClient.BlockletSource;
    deployedFrom: string;
    bundleSource: Record<string, any>;
    port: number;
    engine: ABTNodeClient.BlockletEngine;
    mode: string;
    ports: Record<string, any>;
    children: ABTNodeClient.ComponentState[];
    dynamic: boolean;
    mountPoint: string;
    dependents: ABTNodeClient.Dependent[];
    required: boolean;
    appRuntimeInfo: ABTNodeClient.RuntimeInfo;
    greenStatus: ABTNodeClient.BlockletStatus;
  }

  interface ConfigEntry {
    key: string;
    value: string;
    required: boolean;
    description: string;
    validation: string;
    secure: boolean;
    custom: boolean;
    shared: boolean;
  }

  interface ConfigNavigation {
    id: string;
    title: string;
    link: string;
    icon: string;
    section: string;
    component: string;
    parent: string;
    role: string;
    visible: boolean;
    from: string;
    activeIcon: string;
    color: string;
    activeColor: string;
    description: string;
    private: boolean;
  }

  interface ConnectEndpoint {
    id: string;
    scope: string;
    url: string;
    endpoint: string;
    protected: boolean;
    appName: string;
    appDescription: string;
  }

  interface ConnectedAccount {
    provider: string;
    did: string;
    pk: string;
    id: string;
    lastLoginAt: number;
    userInfo: ABTNodeClient.ConnectedAccountInfo;
    extra: Record<string, any>;
  }

  interface ConnectedAccountInfo {
    name: string;
    picture: string;
    email: string;
    emailVerified: boolean;
    sub: string;
    extraData: Record<string, any>;
  }

  interface ConnectedEndpoint {
    endpointId: string;
    accessKeyId: string;
    accessKeySecret: string;
    expireId: string;
    developerDid: string;
    developerName: string;
    developerEmail: string;
    createdBy: string;
  }

  interface ConnectedStore {
    storeId: string;
    storeName: string;
    storeUrl: string;
    accessToken: string;
    developerDid: string;
    developerEmail: string;
    developerName: string;
    scope: string;
  }

  interface CreateAccessKey {
    accessKeyId: string;
    accessKeyPublic: string;
    accessKeySecret: string;
    remark: string;
    passport: string;
    createdAt: number;
    lastUsedAt: number;
    authType: string;
    componentDid: string;
    resourceType: string;
    resourceId: string;
    createdVia: string;
    expireAt: number;
  }

  interface DelegationState {
    delegated: boolean;
  }

  interface Dependent {
    id: string;
    required: boolean;
  }

  interface DiskInfo {
    app: number;
    data: number;
    log: number;
    cache: number;
    blocklets: number;
  }

  interface DockerEnvKeyValuePair {
    key: string;
    value: string;
    description: string;
    secure: boolean;
    shared: boolean;
    required: boolean;
    custom: string;
  }

  interface DockerRunKeyValuePair {
    key: string;
    value: string;
    path: string;
    type: string;
    name: string;
    prefix: string;
    protocol: string;
    proxyBehavior: string;
  }

  interface EnableEvent {
    type: string;
    source: string;
  }

  interface Environment {
    name: string;
    description: string;
    default: string;
    required: boolean;
    secure: boolean;
    validation: string;
    shared: boolean;
  }

  interface FederatedConfig {
    config: ABTNodeClient.FederatedConfigDetail;
    sites: ABTNodeClient.FederatedConfigSite[];
  }

  interface FederatedConfigDetail {
    appId: string;
    appPid: string;
    delegation: string;
    isMaster: boolean;
    autoLogin: boolean;
  }

  interface FederatedConfigSite {
    appId: string;
    appPid: string;
    aliasDid: string[];
    appName: string;
    appDescription: string;
    appUrl: string;
    aliasDomain: string[];
    appLogo: string;
    appLogoRect: string;
    did: string;
    pk: string;
    version: string;
    serverId: string;
    serverVersion: string;
    appliedAt: number;
    status: string;
    isMaster: boolean;
  }

  interface Fuel {
    endpoint: string;
    address: string;
    value: string;
    reason: string;
  }

  interface Gateway {
    requestLimit: ABTNodeClient.RequestLimit;
    blockPolicy: ABTNodeClient.BlockPolicy;
    proxyPolicy: ABTNodeClient.ProxyPolicy;
    cacheEnabled: boolean;
    wafPolicy: ABTNodeClient.WAFPolicy;
  }

  interface GeneralResponse {
    code: ABTNodeClient.StatusCode;
  }

  interface IPInfo {
    internalV4: string;
    externalV4: string;
    internalV6: string;
    externalV6: string;
  }

  interface InviteInfo {
    inviteId: string;
    role: string;
    remark: string;
    expireDate: string;
    inviter: ABTNodeClient.UserInfo;
    teamDid: string;
    interfaceName: string;
    display: ABTNodeClient.PassportDisplay;
    orgId: string;
    inviteUserDids: string[];
  }

  interface InviteResult {
    successDids: string[];
    failedDids: string[];
    inviteLink: string;
  }

  interface InviteSettings {
    enabled: boolean;
  }

  interface Issuer {
    id: string;
    name: string;
    pk: string;
  }

  interface KeyValue {
    key: string;
    value: Record<string, any>;
  }

  interface LauncherInfo {
    did: string;
    type: string;
    provider: string;
    url: string;
    tag: string;
    chainHost: string;
  }

  interface LoginEmailSettings {
    enabled: boolean;
    requireVerified: boolean;
    requireUnique: boolean;
    trustOauthProviders: boolean;
    enableDomainBlackList: boolean;
    domainBlackList: string[];
    enableDomainWhiteList: boolean;
    domainWhiteList: string[];
    trustedIssuers: ABTNodeClient.Issuer[];
  }

  interface LoginPhoneSettings {
    enabled: boolean;
    requireVerified: boolean;
    requireUnique: boolean;
    trustedIssuers: ABTNodeClient.Issuer[];
    enableRegionBlackList: boolean;
    regionBlackList: string[];
    enableRegionWhiteList: boolean;
    regionWhiteList: string[];
  }

  interface MatchedSites {
    id: string;
    domain: string;
  }

  interface Mutation {
    installBlocklet: ABTNodeClient.ResponseBlocklet;
    installComponent: ABTNodeClient.ResponseBlocklet;
    startBlocklet: ABTNodeClient.ResponseBlocklet;
    stopBlocklet: ABTNodeClient.ResponseBlocklet;
    reloadBlocklet: ABTNodeClient.ResponseBlocklet;
    restartBlocklet: ABTNodeClient.ResponseBlocklet;
    deleteBlocklet: ABTNodeClient.ResponseBlocklet;
    deleteComponent: ABTNodeClient.ResponseBlocklet;
    cancelDownloadBlocklet: ABTNodeClient.ResponseBlocklet;
    checkComponentsForUpdates: ABTNodeClient.ResponseCheckComponentsForUpdates;
    upgradeComponents: ABTNodeClient.ResponseBlocklet;
    configBlocklet: ABTNodeClient.ResponseBlocklet;
    configPublicToStore: ABTNodeClient.ResponseBlocklet;
    configNavigations: ABTNodeClient.ResponseBlocklet;
    configAuthentication: ABTNodeClient.ResponseBlocklet;
    configDidConnect: ABTNodeClient.ResponseBlocklet;
    configDidConnectActions: ABTNodeClient.ResponseBlocklet;
    configNotification: ABTNodeClient.ResponseBlocklet;
    configVault: ABTNodeClient.ResponseConfigVault;
    sendEmail: ABTNodeClient.GeneralResponse;
    sendPush: ABTNodeClient.GeneralResponse;
    joinFederatedLogin: ABTNodeClient.ResponseBlocklet;
    quitFederatedLogin: ABTNodeClient.ResponseBlocklet;
    disbandFederatedLogin: ABTNodeClient.ResponseBlocklet;
    syncMasterAuthorization: ABTNodeClient.ResponseBlocklet;
    syncFederatedConfig: ABTNodeClient.ResponseBlocklet;
    auditFederatedLogin: ABTNodeClient.ResponseBlocklet;
    updateAppSessionConfig: ABTNodeClient.ResponseBlocklet;
    updateComponentTitle: ABTNodeClient.ResponseBlocklet;
    updateComponentMountPoint: ABTNodeClient.ResponseBlocklet;
    backupBlocklet: ABTNodeClient.GeneralResponse;
    abortBlockletBackup: ABTNodeClient.GeneralResponse;
    restoreBlocklet: ABTNodeClient.GeneralResponse;
    migrateApplicationToStructV2: ABTNodeClient.GeneralResponse;
    launchBlockletByLauncher: ABTNodeClient.ResponseLaunchBlockletByLauncher;
    launchBlockletWithoutWallet: ABTNodeClient.ResponseLaunchBlockletWithoutWallet;
    addBlockletSpaceGateway: ABTNodeClient.GeneralResponse;
    deleteBlockletSpaceGateway: ABTNodeClient.GeneralResponse;
    updateBlockletSpaceGateway: ABTNodeClient.GeneralResponse;
    updateAutoBackup: ABTNodeClient.GeneralResponse;
    updateAutoCheckUpdate: ABTNodeClient.GeneralResponse;
    updateBlockletSettings: ABTNodeClient.GeneralResponse;
    updateNodeInfo: ABTNodeClient.ResponseGetNodeInfo;
    upgradeNodeVersion: ABTNodeClient.ResponseUpgradeNodeVersion;
    restartServer: ABTNodeClient.ResponseRestartServer;
    resetNode: ABTNodeClient.ResponseResetNode;
    rotateSessionKey: ABTNodeClient.GeneralResponse;
    updateGateway: ABTNodeClient.ResponseGateway;
    clearCache: ABTNodeClient.ResponseClearCache;
    createMemberInvitation: ABTNodeClient.ResponseCreateInvitation;
    createTransferInvitation: ABTNodeClient.ResponseCreateTransferNodeInvitation;
    deleteInvitation: ABTNodeClient.GeneralResponse;
    createPassportIssuance: ABTNodeClient.ResponseCreatePassportIssuance;
    deletePassportIssuance: ABTNodeClient.GeneralResponse;
    configTrustedPassports: ABTNodeClient.GeneralResponse;
    configTrustedFactories: ABTNodeClient.GeneralResponse;
    configPassportIssuance: ABTNodeClient.GeneralResponse;
    removeUser: ABTNodeClient.ResponseUser;
    updateUserTags: ABTNodeClient.ResponseUser;
    updateUserExtra: ABTNodeClient.ResponseUser;
    updateUserApproval: ABTNodeClient.ResponseUser;
    issuePassportToUser: ABTNodeClient.ResponseUser;
    revokeUserPassport: ABTNodeClient.ResponseUser;
    enableUserPassport: ABTNodeClient.ResponseUser;
    removeUserPassport: ABTNodeClient.GeneralResponse;
    switchProfile: ABTNodeClient.ResponseUser;
    updateUserAddress: ABTNodeClient.ResponseUser;
    updateUserInfo: ABTNodeClient.ResponseUser;
    createRole: ABTNodeClient.ResponseRole;
    updateRole: ABTNodeClient.ResponseRole;
    deleteRole: ABTNodeClient.GeneralResponse;
    createPermission: ABTNodeClient.ResponsePermission;
    updatePermission: ABTNodeClient.ResponsePermission;
    deletePermission: ABTNodeClient.GeneralResponse;
    grantPermissionForRole: ABTNodeClient.GeneralResponse;
    revokePermissionFromRole: ABTNodeClient.GeneralResponse;
    updatePermissionsForRole: ABTNodeClient.ResponseRole;
    hasPermission: ABTNodeClient.BooleanResponse;
    addBlockletStore: ABTNodeClient.GeneralResponse;
    deleteBlockletStore: ABTNodeClient.GeneralResponse;
    getTag: ABTNodeClient.ResponseTag;
    createTag: ABTNodeClient.ResponseTag;
    updateTag: ABTNodeClient.ResponseTag;
    deleteTag: ABTNodeClient.ResponseTag;
    createTagging: ABTNodeClient.ResponseTagging;
    deleteTagging: ABTNodeClient.ResponseTagging;
    readNotifications: ABTNodeClient.ResponseReadNotifications;
    unreadNotifications: ABTNodeClient.ResponseReadNotifications;
    addRoutingSite: ABTNodeClient.ResponseRoutingSite;
    addDomainAlias: ABTNodeClient.ResponseRoutingSite;
    deleteDomainAlias: ABTNodeClient.ResponseRoutingSite;
    deleteRoutingSite: ABTNodeClient.GeneralResponse;
    updateRoutingSite: ABTNodeClient.ResponseRoutingSite;
    addRoutingRule: ABTNodeClient.ResponseRoutingSite;
    updateRoutingRule: ABTNodeClient.ResponseRoutingSite;
    deleteRoutingRule: ABTNodeClient.ResponseRoutingSite;
    updateCertificate: ABTNodeClient.ResponseUpdateNginxHttpsCert;
    addCertificate: ABTNodeClient.ResponseAddNginxHttpsCert;
    deleteCertificate: ABTNodeClient.ResponseDeleteNginxHttpsCert;
    issueLetsEncryptCert: ABTNodeClient.ResponseAddLetsEncryptCert;
    createAccessKey: ABTNodeClient.ResponseCreateAccessKey;
    updateAccessKey: ABTNodeClient.ResponseUpdateAccessKey;
    deleteAccessKey: ABTNodeClient.ResponseDeleteAccessKey;
    verifyAccessKey: ABTNodeClient.ResponseAccessKey;
    createWebHook: ABTNodeClient.ResponseCreateWebHook;
    deleteWebHook: ABTNodeClient.ResponseDeleteWebHook;
    updateWebHookState: ABTNodeClient.ResponseCreateWebhookEndpoint;
    createProject: ABTNodeClient.ResponseProject;
    updateProject: ABTNodeClient.ResponseProject;
    deleteProject: ABTNodeClient.GeneralResponse;
    createRelease: ABTNodeClient.ResponseRelease;
    deleteRelease: ABTNodeClient.GeneralResponse;
    updateSelectedResources: ABTNodeClient.GeneralResponse;
    connectToStore: ABTNodeClient.ResponseConnectToStore;
    disconnectFromStore: ABTNodeClient.ResponseDisconnectFromStore;
    publishToStore: ABTNodeClient.ResponsePublishToStore;
    connectByStudio: ABTNodeClient.ResponseConnectByStudio;
    addBlockletSecurityRule: ABTNodeClient.ResponseBlockletSecurityRule;
    updateBlockletSecurityRule: ABTNodeClient.ResponseBlockletSecurityRule;
    deleteBlockletSecurityRule: ABTNodeClient.GeneralResponse;
    addBlockletResponseHeaderPolicy: ABTNodeClient.ResponseBlockletResponseHeaderPolicy;
    updateBlockletResponseHeaderPolicy: ABTNodeClient.ResponseBlockletResponseHeaderPolicy;
    deleteBlockletResponseHeaderPolicy: ABTNodeClient.GeneralResponse;
    addBlockletAccessPolicy: ABTNodeClient.ResponseBlockletAccessPolicy;
    updateBlockletAccessPolicy: ABTNodeClient.ResponseBlockletAccessPolicy;
    deleteBlockletAccessPolicy: ABTNodeClient.GeneralResponse;
    restartAllContainers: ABTNodeClient.ResponseRestartAllContainers;
    createWebhookEndpoint: ABTNodeClient.ResponseCreateWebhookEndpoint;
    updateWebhookEndpoint: ABTNodeClient.ResponseUpdateWebhookEndpoint;
    deleteWebhookEndpoint: ABTNodeClient.ResponseDeleteWebhookEndpoint;
    retryWebhookAttempt: ABTNodeClient.ResponseGetWebhookAttempt;
    regenerateWebhookEndpointSecret: ABTNodeClient.ResponseRegenerateWebhookEndpointSecret;
    addUploadEndpoint: ABTNodeClient.GeneralResponse;
    deleteUploadEndpoint: ABTNodeClient.GeneralResponse;
    connectToEndpoint: ABTNodeClient.ResponseConnectToEndpoint;
    disconnectFromEndpoint: ABTNodeClient.GeneralResponse;
    publishToEndpoint: ABTNodeClient.ResponsePublishToEndpoint;
    connectToAigne: ABTNodeClient.ResponseConnectToEndpoint;
    disconnectToAigne: ABTNodeClient.GeneralResponse;
    verifyAigneConnection: ABTNodeClient.GeneralResponse;
    createOrg: ABTNodeClient.ResponseGetOrg;
    updateOrg: ABTNodeClient.ResponseGetOrg;
    deleteOrg: ABTNodeClient.GeneralResponse;
    addOrgMember: ABTNodeClient.ResponseGetOrg;
    removeOrgMember: ABTNodeClient.GeneralResponse;
    inviteMembersToOrg: ABTNodeClient.ResponseInviteMembersToOrg;
    addOrgResource: ABTNodeClient.ResponseOrgResourceOperation;
    migrateOrgResource: ABTNodeClient.ResponseOrgResourceOperation;
  }

  interface NodeEnvInfo {
    ip: ABTNodeClient.IPInfo;
    os: string;
    location: string;
    docker: boolean;
    image: boolean;
    blockletEngines: ABTNodeClient.BlockletEngine[];
    gitpod: boolean;
    disk: ABTNodeClient.DiskInfo;
    dbProvider: string;
    routerProvider: string;
  }

  interface NodeHistoryItem {
    date: number;
    cpu: number;
    mem: number;
    daemonMem: number;
    serviceMem: number;
    hubMem: number;
  }

  interface NodeRouting {
    provider: string;
    snapshotHash: string;
    adminPath: string;
    requestLimit: ABTNodeClient.RequestLimit;
    cacheEnabled: boolean;
    blockPolicy: ABTNodeClient.BlockPolicy;
    proxyPolicy: ABTNodeClient.ProxyPolicy;
    wafPolicy: ABTNodeClient.WAFPolicy;
  }

  interface NodeRuntimeConfig {
    blockletMaxMemoryLimit: number;
    daemonMaxMemoryLimit: number;
  }

  interface NodeState {
    did: string;
    pk: string;
    version: string;
    name: string;
    description: string;
    port: string;
    initialized: boolean;
    nodeOwner: ABTNodeClient.WalletInfo;
    createdAt: number;
    startedAt: number;
    initializedAt: number;
    mode: string;
    routing: ABTNodeClient.NodeRouting;
    environments: ABTNodeClient.ConfigEntry[];
    uptime: number;
    autoUpgrade: boolean;
    nextVersion: string;
    upgradeSessionId: string;
    registerUrl: string;
    enableWelcomePage: boolean;
    webWalletUrl: string;
    blockletRegistryList: ABTNodeClient.BlockletStore[];
    ownerNft: ABTNodeClient.OwnerNft;
    diskAlertThreshold: number;
    trustedPassports: ABTNodeClient.TrustedPassport[];
    launcher: ABTNodeClient.LauncherInfo;
    enablePassportIssuance: boolean;
    didRegistry: string;
    didDomain: string;
    status: number;
    trustedFactories: ABTNodeClient.TrustedFactory[];
    enableBetaRelease: boolean;
    runtimeConfig: ABTNodeClient.NodeRuntimeConfig;
    nftDomainUrl: string;
    enableFileSystemIsolation: boolean;
    enableDocker: boolean;
    isDockerInstalled: boolean;
    enableDockerNetwork: boolean;
    enableSessionHardening: boolean;
    sessionSalt: string;
  }

  interface Notification {
    sender: string;
    receiver: string;
    title: string;
    description: string;
    action: string;
    entityType: string;
    entityId: string;
    read: boolean;
    createdAt: number;
    id: string;
    severity: ABTNodeClient.Notification_NotificationSeverity;
    source: ABTNodeClient.Notification_NotificationSource;
    attachments: ABTNodeClient.NotificationAttachment[];
    blocks: ABTNodeClient.NotificationAttachment[];
    actions: ABTNodeClient.NotificationAction[];
    componentDid: string;
    type: ABTNodeClient.Notification_NotificationType;
    receivers: ABTNodeClient.NotificationReceiver[];
    data: Record<string, any>;
    feedType: string;
    statistics: ABTNodeClient.NotificationStatistics;
    activity: ABTNodeClient.NotificationActivity;
    actorInfo: ABTNodeClient.UserInfo;
    options: Record<string, any>;
    utm: ABTNodeClient.TUTM;
  }

  interface NotificationAction {
    bgColor: string;
    color: string;
    link: string;
    name: string;
    title: string;
    utm: ABTNodeClient.TUTM;
  }

  interface NotificationActivity {
    type: ABTNodeClient.NotificationActivity_ActivityTypeEnum;
    actor: string;
    target: Record<string, any>;
    meta: Record<string, any>;
  }

  interface NotificationAttachment {
    data: Record<string, any>;
    fields: Record<string, any>;
    type: ABTNodeClient.NotificationAttachmentType;
  }

  interface NotificationReceiver {
    id: string;
    notificationId: string;
    receiver: string;
    read: boolean;
    readAt: number;
    walletSendStatus: number;
    walletSendAt: number;
    pushKitSendStatus: number;
    pushKitSendAt: number;
    emailSendStatus: number;
    emailSendAt: number;
    createdAt: number;
    receiverUser: ABTNodeClient.UserInfo;
    walletSendFailedReason: string;
    walletSendRecord: ABTNodeClient.NotificationSendRecord[];
    pushKitSendFailedReason: string;
    pushKitSendRecord: ABTNodeClient.NotificationSendRecord[];
    emailSendFailedReason: string;
    emailSendRecord: ABTNodeClient.NotificationSendRecord[];
    webhook: Record<string, any>;
    email: string;
    webhookUrls: string;
    deviceId: string;
  }

  interface NotificationSendRecord {
    sendStatus: number;
    sendAt: number;
    failedReason: string;
  }

  interface NotificationStatistics {
    total: number;
    wallet: ABTNodeClient.Statistics;
    push: ABTNodeClient.Statistics;
    email: ABTNodeClient.Statistics;
    webhook: ABTNodeClient.WebhookStatistics;
  }

  interface OauthClient {
    redirectUris: string[];
    tokenEndpointAuthMethod: string;
    grantTypes: string[];
    responseTypes: string[];
    clientName: string;
    clientUri: string;
    logoUri: string;
    scope: string;
    contacts: string[];
    tosUri: string;
    policyUri: string;
    jwksUri: string;
    jwks: string;
    softwareId: string;
    softwareVersion: string;
    clientId: string;
    clientIdIssuedAt: number;
    clientSecret: string;
    clientSecretExpiresAt: number;
    updatedAt: number;
    createdBy: string;
    createUser: ABTNodeClient.UserInfo;
  }

  interface OptionalComponentState {
    logoUrl: string;
    dependencies: ABTNodeClient.OptionalDependencies[];
    meta: ABTNodeClient.BlockletMeta;
    bundleSource: Record<string, any>;
  }

  interface OptionalDependencies {
    parentDid: string;
    parentName: string;
    parentTitle: string;
    mountPoint: string;
    required: boolean;
  }

  interface Org {
    id: string;
    name: string;
    description: string;
    ownerDid: string;
    createdAt: number;
    updatedAt: number;
    members: ABTNodeClient.UserOrg[];
    owner: ABTNodeClient.UserInfo;
    membersCount: number;
    passports: ABTNodeClient.Passport[];
    metadata: Record<string, any>;
    avatar: string;
  }

  interface OrgResourceResult {
    success: string[];
    failed: string[];
  }

  interface OrgResources {
    id: string;
    orgId: string;
    resourceId: string;
    type: string;
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
  }

  interface OrgSettings {
    enabled: boolean;
    maxMemberPerOrg: number;
    maxOrgPerUser: number;
  }

  interface OwnerNft {
    did: string;
    holder: string;
    issuer: string;
    launcherSessionId: string;
  }

  interface Paging {
    total: number;
    pageSize: number;
    pageCount: number;
    page: number;
  }

  interface Passport {
    id: string;
    name: string;
    title: string;
    issuer: ABTNodeClient.Issuer;
    type: string[];
    issuanceDate: number;
    expirationDate: number;
    status: string;
    role: string;
    lastLoginAt: number;
    scope: string;
    display: ABTNodeClient.PassportDisplay;
    source: string;
    parentDid: string;
    userDid: string;
    user: ABTNodeClient.BaseUserInfo;
  }

  interface PassportDisplay {
    type: string;
    content: string;
  }

  interface PassportIssuanceInfo {
    id: string;
    name: string;
    title: string;
    expireDate: string;
    teamDid: string;
    ownerDid: string;
    display: ABTNodeClient.PassportDisplay;
  }

  interface PassportLogState {
    id: number;
    passportId: string;
    action: string;
    operatorIp: string;
    operatorUa: string;
    operatorDid: string;
    metadata: Record<string, any>;
    createdAt: number;
  }

  interface Permission {
    name: string;
    description: string;
    isProtected: boolean;
  }

  interface Project {
    id: string;
    type: ABTNodeClient.PublishType;
    blockletDid: string;
    blockletVersion: string;
    blockletTitle: string;
    blockletDescription: string;
    blockletLogo: string;
    blockletIntroduction: string;
    blockletScreenshots: string[];
    createdAt: string;
    updatedAt: string;
    componentDid: string;
    lastReleaseId: string;
    lastReleaseFiles: string[];
    connectedStores: ABTNodeClient.ConnectedStore[];
    tenantScope: string;
    createdBy: string;
    autoUpload: boolean;
    possibleSameStore: boolean;
    connectedEndpoints: ABTNodeClient.ConnectedEndpoint[];
  }

  interface ProxyPolicy {
    enabled: boolean;
    trustRecursive: boolean;
    trustedProxies: string[];
    realIpHeader: string;
  }

  interface Query {
    getBlocklet: ABTNodeClient.ResponseBlocklet;
    getBlockletMetaFromUrl: ABTNodeClient.ResponseBlockletMetaFromUrl;
    getBlockletDiff: ABTNodeClient.ResponseBlockletDiff;
    getBlocklets: ABTNodeClient.ResponseGetBlocklets;
    getBlockletRuntimeHistory: ABTNodeClient.ResponseBlockletRuntimeHistory;
    getBlockletsFromBackup: ABTNodeClient.ResponseBlockletsFromBackup;
    getDynamicComponents: ABTNodeClient.ResponseGetDynamicComponents;
    getNodeInfo: ABTNodeClient.ResponseGetNodeInfo;
    resetNodeStatus: ABTNodeClient.ResponseGetNodeInfo;
    getNodeEnv: ABTNodeClient.ResponseGetNodeEnv;
    checkNodeVersion: ABTNodeClient.ResponseCheckNodeVersion;
    getDelegationState: ABTNodeClient.ResponseDelegationState;
    getNodeRuntimeHistory: ABTNodeClient.ResponseNodeRuntimeHistory;
    getBlockletMeta: ABTNodeClient.ResponseBlockletMeta;
    getNotifications: ABTNodeClient.ResponseGetNotifications;
    makeAllNotificationsAsRead: ABTNodeClient.ResponseMakeAllNotificationsAsRead;
    getNotificationSendLog: ABTNodeClient.ResponseNotificationSendLog;
    getReceivers: ABTNodeClient.ResponseReceivers;
    getNotificationComponents: ABTNodeClient.ResponseNotificationComponents;
    resendNotification: ABTNodeClient.ResponseResendNotification;
    getRoutingSites: ABTNodeClient.ResponseGetRoutingSites;
    getRoutingProviders: ABTNodeClient.ResponseGetRoutingProviders;
    isDidDomain: ABTNodeClient.ResponseIsDidDomain;
    getCertificates: ABTNodeClient.ResponseGetCertificates;
    checkDomains: ABTNodeClient.ResponseCheckDomains;
    findCertificateByDomain: ABTNodeClient.ResponseFindCertificateByDomain;
    getAccessKeys: ABTNodeClient.ResponseAccessKeys;
    getAccessKey: ABTNodeClient.ResponseAccessKey;
    getWebHooks: ABTNodeClient.ResponseWebHooks;
    getWebhookSenders: ABTNodeClient.ResponseSenderList;
    sendTestMessage: ABTNodeClient.ResponseSendMsg;
    getSession: ABTNodeClient.ResponseGetSession;
    getRoles: ABTNodeClient.ResponseRoles;
    getRole: ABTNodeClient.ResponseRole;
    getPermissions: ABTNodeClient.ResponsePermissions;
    getInvitations: ABTNodeClient.ResponseGetInvitations;
    getUsers: ABTNodeClient.ResponseUsers;
    getUser: ABTNodeClient.ResponseUser;
    getUserSessions: ABTNodeClient.ResponseUserSessions;
    getUserSessionsCount: ABTNodeClient.ResponseUserSessionsCount;
    getUsersCount: ABTNodeClient.ResponseGetUsersCount;
    getUsersCountPerRole: ABTNodeClient.ResponseGetUsersCountPerRole;
    getOwner: ABTNodeClient.ResponseUser;
    getPermissionsByRole: ABTNodeClient.ResponsePermissions;
    getPassportIssuances: ABTNodeClient.ResponseGetPassportIssuances;
    logoutUser: ABTNodeClient.GeneralResponse;
    destroySelf: ABTNodeClient.ResponseUser;
    getUserFollowers: ABTNodeClient.ResponseUserFollows;
    getUserFollowing: ABTNodeClient.ResponseUserFollows;
    getUserFollowStats: ABTNodeClient.ResponseUserRelationCount;
    checkFollowing: ABTNodeClient.ResponseCheckFollowing;
    followUser: ABTNodeClient.GeneralResponse;
    unfollowUser: ABTNodeClient.GeneralResponse;
    getUserInvites: ABTNodeClient.ResponseUsers;
    getTags: ABTNodeClient.ResponseTags;
    getAuditLogs: ABTNodeClient.ResponseGetAuditLogs;
    getLauncherSession: ABTNodeClient.ResponseGetLauncherSession;
    getBlockletBackups: ABTNodeClient.ResponseGetBlockletBackups;
    getBlockletBackupSummary: ABTNodeClient.ResponseGetBlockletBackupSummary;
    getBlockletSpaceGateways: ABTNodeClient.ResponseGetBlockletSpaceGateways;
    getTrafficInsights: ABTNodeClient.ResponseGetTrafficInsights;
    getProjects: ABTNodeClient.ResponseGetProjects;
    getProject: ABTNodeClient.ResponseGetProject;
    getReleases: ABTNodeClient.ResponseGetReleases;
    getRelease: ABTNodeClient.ResponseGetRelease;
    getSelectedResources: ABTNodeClient.ResponseGetSelectedResources;
    getBlockletSecurityRule: ABTNodeClient.ResponseBlockletSecurityRule;
    getBlockletSecurityRules: ABTNodeClient.ResponseBlockletSecurityRules;
    getBlockletResponseHeaderPolicy: ABTNodeClient.ResponseBlockletAccessPolicy;
    getBlockletResponseHeaderPolicies: ABTNodeClient.ResponseBlockletResponseHeaderPolicies;
    getBlockletAccessPolicy: ABTNodeClient.ResponseBlockletAccessPolicy;
    getBlockletAccessPolicies: ABTNodeClient.ResponseBlockletAccessPolicies;
    getWebhookEndpoints: ABTNodeClient.ResponseGetWebhookEndpoints;
    getWebhookEndpoint: ABTNodeClient.ResponseGetWebhookEndpoint;
    getWebhookAttempts: ABTNodeClient.ResponseGetWebhookAttempts;
    getPassportRoleCounts: ABTNodeClient.ResponseGetPassportCountPerRole;
    getPassportsByRole: ABTNodeClient.ResponsePassport;
    getPassportLogs: ABTNodeClient.ResponsePassportLog;
    getRelatedPassports: ABTNodeClient.ResponsePassport;
    getBlockletBaseInfo: ABTNodeClient.ResponseBlockletInfo;
    getDomainDNS: ABTNodeClient.ResponseDomainDNS;
    getOAuthClients: ABTNodeClient.ResponseOAuthClients;
    createOAuthClient: ABTNodeClient.ResponseOAuthClient;
    updateOAuthClient: ABTNodeClient.ResponseOAuthClient;
    deleteOAuthClient: ABTNodeClient.GeneralResponse;
    getOrgs: ABTNodeClient.ResponseGetOrgs;
    getOrg: ABTNodeClient.ResponseGetOrg;
    getOrgMembers: ABTNodeClient.ResponseOrgUsers;
    getOrgInvitableUsers: ABTNodeClient.ResponseUsers;
    getOrgResource: ABTNodeClient.ResponseGetOrgResource;
  }

  interface ReadUpdateAffected {
    numAffected: number;
    notificationIds: string[];
  }

  interface Release {
    id: string;
    projectId: string;
    blockletDid: string;
    blockletVersion: string;
    blockletTitle: string;
    blockletDescription: string;
    blockletLogo: string;
    blockletIntroduction: string;
    blockletScreenshots: string[];
    note: string;
    files: string[];
    status: ABTNodeClient.ReleaseStatus;
    createdAt: string;
    updatedAt: string;
    blockletComponents: ABTNodeClient.ReleaseComponent[];
    publishedStoreIds: string[];
    uploadedResource: string;
    blockletResourceType: string;
    blockletSupport: string;
    blockletCommunity: string;
    blockletHomepage: string;
    blockletVideos: string[];
    blockletRepository: string;
    contentType: string;
    blockletDocker: ABTNodeClient.BlockletDocker;
    blockletSingleton: boolean;
  }

  interface ReleaseComponent {
    did: string;
    required: boolean;
  }

  interface RequestLimit {
    enabled: boolean;
    global: number;
    burstFactor: number;
    burstDelay: number;
    rate: number;
    methods: string[];
  }

  interface Requirement {
    server: string;
    os: Record<string, any>;
    cpu: Record<string, any>;
    fuels: ABTNodeClient.Fuel[];
    aigne: boolean;
  }

  interface ResponseAccessKey {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.AccessKey;
  }

  interface ResponseAccessKeys {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.AccessKey[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseAddLetsEncryptCert {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseAddNginxHttpsCert {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseBlocklet {
    code: ABTNodeClient.StatusCode;
    blocklet: ABTNodeClient.BlockletState;
  }

  interface ResponseBlockletAccessPolicies {
    code: ABTNodeClient.StatusCode;
    accessPolicies: ABTNodeClient.BlockletAccessPolicy[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseBlockletAccessPolicy {
    code: ABTNodeClient.StatusCode;
    accessPolicy: ABTNodeClient.BlockletAccessPolicy;
  }

  interface ResponseBlockletDiff {
    code: ABTNodeClient.StatusCode;
    blockletDiff: ABTNodeClient.BlockletDiff;
  }

  interface ResponseBlockletInfo {
    user: ABTNodeClient.BlockletUsers;
    passport: ABTNodeClient.BlockletPassport;
    backup: ABTNodeClient.Backup;
    appRuntimeInfo: ABTNodeClient.RuntimeInfo;
    traffic: ABTNodeClient.BlockletTraffic;
    integrations: ABTNodeClient.BlockletIntegrations;
    studio: ABTNodeClient.BlockletStudio;
  }

  interface ResponseBlockletMeta {
    code: ABTNodeClient.StatusCode;
    meta: Record<string, any>;
  }

  interface ResponseBlockletMetaFromUrl {
    code: ABTNodeClient.StatusCode;
    meta: ABTNodeClient.BlockletMeta;
    isFree: boolean;
    inStore: boolean;
    registryUrl: string;
  }

  interface ResponseBlockletResponseHeaderPolicies {
    code: ABTNodeClient.StatusCode;
    responseHeaderPolicies: ABTNodeClient.BlockletResponseHeaderPolicy[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseBlockletResponseHeaderPolicy {
    code: ABTNodeClient.StatusCode;
    responseHeaderPolicy: ABTNodeClient.BlockletResponseHeaderPolicy;
  }

  interface ResponseBlockletRuntimeHistory {
    code: ABTNodeClient.StatusCode;
    historyList: ABTNodeClient.BlockletHistoryItemList[];
  }

  interface ResponseBlockletSecurityRule {
    code: ABTNodeClient.StatusCode;
    securityRule: ABTNodeClient.BlockletSecurityRule;
  }

  interface ResponseBlockletSecurityRules {
    code: ABTNodeClient.StatusCode;
    securityRules: ABTNodeClient.BlockletSecurityRule[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseBlockletsFromBackup {
    code: ABTNodeClient.StatusCode;
    backups: ABTNodeClient.BlockletBackupState[];
  }

  interface ResponseCheckComponentsForUpdates {
    code: ABTNodeClient.StatusCode;
    preUpdateInfo: ABTNodeClient.BlockletPreUpdateInfo;
  }

  interface ResponseCheckDomains {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseCheckFollowing {
    code: ABTNodeClient.StatusCode;
    data: Record<string, any>;
  }

  interface ResponseCheckNodeVersion {
    code: ABTNodeClient.StatusCode;
    version: string;
  }

  interface ResponseClearCache {
    code: ABTNodeClient.StatusCode;
    removed: string[];
  }

  interface ResponseConfigVault {
    code: ABTNodeClient.StatusCode;
    sessionId: string;
  }

  interface ResponseConnectByStudio {
    code: ABTNodeClient.StatusCode;
    url: string;
  }

  interface ResponseConnectToEndpoint {
    code: ABTNodeClient.StatusCode;
    url: string;
  }

  interface ResponseConnectToStore {
    code: ABTNodeClient.StatusCode;
    url: string;
  }

  interface ResponseCreateAccessKey {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.CreateAccessKey;
  }

  interface ResponseCreateInvitation {
    code: ABTNodeClient.StatusCode;
    inviteInfo: ABTNodeClient.InviteInfo;
  }

  interface ResponseCreatePassportIssuance {
    code: ABTNodeClient.StatusCode;
    info: ABTNodeClient.PassportIssuanceInfo;
  }

  interface ResponseCreateTransferNodeInvitation {
    code: ABTNodeClient.StatusCode;
    inviteInfo: ABTNodeClient.InviteInfo;
  }

  interface ResponseCreateWebHook {
    code: ABTNodeClient.StatusCode;
    webhook: ABTNodeClient.WebHookSender;
  }

  interface ResponseCreateWebhookEndpoint {
    data: ABTNodeClient.WebhookEndpointState;
  }

  interface ResponseDelegationState {
    code: ABTNodeClient.StatusCode;
    state: ABTNodeClient.DelegationState;
  }

  interface ResponseDeleteAccessKey {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseDeleteNginxHttpsCert {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseDeleteWebHook {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseDeleteWebhookEndpoint {
    data: ABTNodeClient.WebhookEndpointState;
  }

  interface ResponseDisconnectFromStore {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseDomainDNS {
    isDnsResolved: boolean;
    hasCname: boolean;
    isCnameMatch: boolean;
    error: string;
  }

  interface ResponseFindCertificateByDomain {
    code: ABTNodeClient.StatusCode;
    cert: ABTNodeClient.Certificate;
  }

  interface ResponseGateway {
    code: ABTNodeClient.StatusCode;
    gateway: ABTNodeClient.Gateway;
  }

  interface ResponseGetAuditLogs {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.AuditLog[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetBlockletBackupSummary {
    code: ABTNodeClient.StatusCode;
    summary: ABTNodeClient.BackupSummaryItem[];
  }

  interface ResponseGetBlockletBackups {
    code: ABTNodeClient.StatusCode;
    backups: ABTNodeClient.Backup[];
  }

  interface ResponseGetBlockletSpaceGateways {
    code: ABTNodeClient.StatusCode;
    spaceGateways: ABTNodeClient.SpaceGateway[];
  }

  interface ResponseGetBlocklets {
    code: ABTNodeClient.StatusCode;
    blocklets: ABTNodeClient.BlockletState[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetCertificates {
    code: ABTNodeClient.StatusCode;
    certificates: ABTNodeClient.Certificate[];
  }

  interface ResponseGetDynamicComponents {
    code: ABTNodeClient.StatusCode;
    components: ABTNodeClient.ComponentState[];
  }

  interface ResponseGetInvitations {
    code: ABTNodeClient.StatusCode;
    invitations: ABTNodeClient.InviteInfo[];
  }

  interface ResponseGetLauncherSession {
    code: ABTNodeClient.StatusCode;
    error: string;
    launcherSession: Record<string, any>;
  }

  interface ResponseGetNodeEnv {
    code: ABTNodeClient.StatusCode;
    info: ABTNodeClient.NodeEnvInfo;
  }

  interface ResponseGetNodeInfo {
    code: ABTNodeClient.StatusCode;
    info: ABTNodeClient.NodeState;
  }

  interface ResponseGetNotifications {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.Notification[];
    paging: ABTNodeClient.Paging;
    unreadCount: number;
  }

  interface ResponseGetOrg {
    code: ABTNodeClient.StatusCode;
    org: ABTNodeClient.Org;
  }

  interface ResponseGetOrgResource {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.OrgResources[];
  }

  interface ResponseGetOrgs {
    code: ABTNodeClient.StatusCode;
    orgs: ABTNodeClient.Org[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetPassportCountPerRole {
    code: ABTNodeClient.StatusCode;
    counts: ABTNodeClient.KeyValue[];
  }

  interface ResponseGetPassportIssuances {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.PassportIssuanceInfo[];
  }

  interface ResponseGetProject {
    code: ABTNodeClient.StatusCode;
    project: ABTNodeClient.Project;
  }

  interface ResponseGetProjects {
    code: ABTNodeClient.StatusCode;
    projects: ABTNodeClient.Project[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetRelease {
    code: ABTNodeClient.StatusCode;
    release: ABTNodeClient.Release;
  }

  interface ResponseGetReleases {
    code: ABTNodeClient.StatusCode;
    releases: ABTNodeClient.Release[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetRoutingProviders {
    code: ABTNodeClient.StatusCode;
    providers: ABTNodeClient.RoutingProvider[];
  }

  interface ResponseGetRoutingSites {
    code: ABTNodeClient.StatusCode;
    sites: ABTNodeClient.RoutingSite[];
  }

  interface ResponseGetSelectedResources {
    code: ABTNodeClient.StatusCode;
    resources: string[];
  }

  interface ResponseGetSession {
    code: ABTNodeClient.StatusCode;
    session: Record<string, any>;
  }

  interface ResponseGetTrafficInsights {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.TrafficInsight[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetUsersCount {
    code: ABTNodeClient.StatusCode;
    count: number;
  }

  interface ResponseGetUsersCountPerRole {
    code: ABTNodeClient.StatusCode;
    counts: ABTNodeClient.KeyValue[];
  }

  interface ResponseGetWebhookAttempt {
    data: ABTNodeClient.WebhookAttemptState;
  }

  interface ResponseGetWebhookAttempts {
    list: ABTNodeClient.WebhookAttemptWithEndpointEventState[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseGetWebhookEndpoint {
    data: ABTNodeClient.WebhookEndpointWithUserInfo;
  }

  interface ResponseGetWebhookEndpoints {
    list: ABTNodeClient.WebhookEndpointWithUserInfo[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseInviteMembersToOrg {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.InviteResult;
  }

  interface ResponseIsDidDomain {
    code: ABTNodeClient.StatusCode;
    value: boolean;
  }

  interface ResponseLaunchBlockletByLauncher {
    code: ABTNodeClient.StatusCode;
    data: Record<string, any>;
  }

  interface ResponseLaunchBlockletWithoutWallet {
    code: ABTNodeClient.StatusCode;
    data: Record<string, any>;
  }

  interface ResponseMakeAllNotificationsAsRead {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.ReadUpdateAffected;
  }

  interface ResponseNodeRuntimeHistory {
    code: ABTNodeClient.StatusCode;
    history: ABTNodeClient.NodeHistoryItem[];
  }

  interface ResponseNotificationComponents {
    code: ABTNodeClient.StatusCode;
    componentDids: string[];
  }

  interface ResponseNotificationSendLog {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.Notification[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseOAuthClient {
    data: ABTNodeClient.OauthClient;
  }

  interface ResponseOAuthClients {
    list: ABTNodeClient.OauthClient[];
  }

  interface ResponseOrgResourceOperation {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.OrgResourceResult;
  }

  interface ResponseOrgUsers {
    code: ABTNodeClient.StatusCode;
    users: ABTNodeClient.UserOrg[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponsePassport {
    code: ABTNodeClient.StatusCode;
    passports: ABTNodeClient.Passport[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponsePassportLog {
    passportLogs: ABTNodeClient.PassportLogState[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponsePermission {
    code: ABTNodeClient.StatusCode;
    permission: ABTNodeClient.Permission;
  }

  interface ResponsePermissions {
    code: ABTNodeClient.StatusCode;
    permissions: ABTNodeClient.Permission[];
  }

  interface ResponseProject {
    code: ABTNodeClient.StatusCode;
    project: ABTNodeClient.Project;
  }

  interface ResponsePublishToEndpoint {
    code: ABTNodeClient.StatusCode;
    url: string;
  }

  interface ResponsePublishToStore {
    code: ABTNodeClient.StatusCode;
    url: string;
  }

  interface ResponseReadNotifications {
    code: ABTNodeClient.StatusCode;
    numAffected: number;
  }

  interface ResponseReceivers {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.NotificationReceiver[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseRegenerateWebhookEndpointSecret {
    secret: string;
  }

  interface ResponseRelease {
    code: ABTNodeClient.StatusCode;
    release: ABTNodeClient.Release;
  }

  interface ResponseResendNotification {
    code: ABTNodeClient.StatusCode;
    data: Record<string, any>;
  }

  interface ResponseResetNode {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseRestartAllContainers {
    code: ABTNodeClient.StatusCode;
    sessionId: string;
  }

  interface ResponseRestartServer {
    code: ABTNodeClient.StatusCode;
    sessionId: string;
  }

  interface ResponseRole {
    code: ABTNodeClient.StatusCode;
    role: ABTNodeClient.Role;
  }

  interface ResponseRoles {
    code: ABTNodeClient.StatusCode;
    roles: ABTNodeClient.Role[];
  }

  interface ResponseRoutingSite {
    code: ABTNodeClient.StatusCode;
    site: ABTNodeClient.RoutingSite;
  }

  interface ResponseSendMsg {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseSenderList {
    code: ABTNodeClient.StatusCode;
    senders: ABTNodeClient.WebHookSender[];
  }

  interface ResponseTag {
    code: ABTNodeClient.StatusCode;
    tag: ABTNodeClient.Tag;
  }

  interface ResponseTagging {
    code: ABTNodeClient.StatusCode;
    tagging: ABTNodeClient.Tagging[];
  }

  interface ResponseTags {
    code: ABTNodeClient.StatusCode;
    tags: ABTNodeClient.Tag[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseUpdateAccessKey {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.AccessKey;
  }

  interface ResponseUpdateNginxHttpsCert {
    code: ABTNodeClient.StatusCode;
  }

  interface ResponseUpdateWebhookEndpoint {
    data: ABTNodeClient.WebhookEndpointState;
  }

  interface ResponseUpgradeNodeVersion {
    code: ABTNodeClient.StatusCode;
    sessionId: string;
  }

  interface ResponseUser {
    code: ABTNodeClient.StatusCode;
    user: ABTNodeClient.UserInfo;
  }

  interface ResponseUserFollows {
    code: ABTNodeClient.StatusCode;
    data: ABTNodeClient.UserFollows[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseUserRelationCount {
    code: ABTNodeClient.StatusCode;
    data: Record<string, any>;
  }

  interface ResponseUserSessions {
    code: ABTNodeClient.StatusCode;
    list: ABTNodeClient.UserSession[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseUserSessionsCount {
    code: ABTNodeClient.StatusCode;
    count: number;
  }

  interface ResponseUsers {
    code: ABTNodeClient.StatusCode;
    users: ABTNodeClient.UserInfo[];
    paging: ABTNodeClient.Paging;
  }

  interface ResponseWebHooks {
    code: ABTNodeClient.StatusCode;
    webhooks: ABTNodeClient.WebHook[];
  }

  interface Role {
    name: string;
    description: string;
    grants: string[];
    title: string;
    isProtected: boolean;
    extra: Record<string, any>;
    orgId: string;
  }

  interface RoutingProvider {
    name: string;
    description: string;
    running: boolean;
    available: boolean;
    error: string;
  }

  interface RoutingRule {
    id: string;
    from: ABTNodeClient.RoutingRuleFrom;
    to: ABTNodeClient.RoutingRuleTo;
    isProtected: boolean;
  }

  interface RoutingRuleFrom {
    pathPrefix: string;
    header: ABTNodeClient.RoutingRuleHeader[];
  }

  interface RoutingRuleHeader {
    key: string;
    value: string;
    type: ABTNodeClient.HeaderMatchType;
  }

  interface RoutingRuleResponse {
    status: number;
    contentType: string;
    body: string;
  }

  interface RoutingRuleTo {
    port: number;
    type: ABTNodeClient.BackendServiceType;
    did: string;
    url: string;
    redirectCode: number;
    interfaceName: string;
    componentId: string;
    pageGroup: string;
    response: ABTNodeClient.RoutingRuleResponse;
  }

  interface RoutingSite {
    id: string;
    domain: string;
    domainAliases: Record<string, any>[];
    rules: ABTNodeClient.RoutingRule[];
    isProtected: boolean;
    corsAllowedOrigins: string[];
  }

  interface RuntimeInfo {
    pid: string;
    port: string;
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
    runningDocker: boolean;
    cpus: Record<string, any>;
  }

  interface SessionConfig {
    cacheTtl: number;
    ttl: number;
    email: ABTNodeClient.LoginEmailSettings;
    phone: ABTNodeClient.LoginPhoneSettings;
    salt: string;
    enableBlacklist: boolean;
  }

  interface SimpleBlockletMeta {
    did: string;
    name: string;
    version: string;
    description: string;
    title: string;
    bundleDid: string;
    bundleName: string;
  }

  interface SimpleBlockletState {
    meta: ABTNodeClient.SimpleBlockletMeta;
    status: ABTNodeClient.BlockletStatus;
    deployedFrom: string;
    mountPoint: string;
    deletedAt: number;
  }

  interface SpaceGateway {
    name: string;
    url: string;
    protected: string;
    endpoint: string;
    did: string;
  }

  interface Statistics {
    total: number;
    pending: number;
    success: number;
    failed: number;
  }

  interface SubServiceConfig {
    enabled: boolean;
    domain: string;
    staticRoot: string;
  }

  interface TUTM {
    source: string;
    medium: string;
    campaign: string;
    content: string;
  }

  interface Tag {
    id: number;
    title: string;
    description: string;
    color: string;
    createdAt: number;
    updatedAt: number;
    slug: string;
    type: string;
    componentDid: string;
    parentId: number;
    createdBy: string;
    updatedBy: string;
  }

  interface Tagging {
    tagId: number;
    taggableType: string;
    taggableIds: string[];
  }

  interface TrafficInsight {
    did: string;
    date: string;
    totalRequests: number;
    validRequests: number;
    failedRequests: number;
    generationTime: number;
    uniqueVisitors: number;
    uniqueFiles: number;
    excludedHits: number;
    uniqueReferrers: number;
    uniqueNotFound: number;
    uniqueStaticFiles: number;
    logSize: number;
    bandwidth: number;
  }

  interface TrustedFactory {
    holderDid: string;
    issuerDid: string;
    factoryAddress: string;
    remark: string;
    passport: ABTNodeClient.TrustedPassportMappingTo;
  }

  interface TrustedPassport {
    issuerDid: string;
    remark: string;
    mappings: ABTNodeClient.TrustedPassportMapping[];
  }

  interface TrustedPassportMapping {
    from: ABTNodeClient.TrustedPassportMappingFrom;
    to: ABTNodeClient.TrustedPassportMappingTo;
  }

  interface TrustedPassportMappingFrom {
    passport: string;
  }

  interface TrustedPassportMappingTo {
    role: string;
    ttl: string;
    ttlPolicy: string;
  }

  interface UpdateList {
    id: string;
    meta: ABTNodeClient.BlockletMeta;
  }

  interface UserAddress {
    country: string;
    province: string;
    city: string;
    postalCode: string;
    line1: string;
    line2: string;
  }

  interface UserFollows {
    userDid: string;
    followerDid: string;
    createdAt: number;
    user: ABTNodeClient.UserInfo;
    isFollowing: boolean;
  }

  interface UserInfo {
    did: string;
    pk: string;
    role: string;
    avatar: string;
    fullName: string;
    email: string;
    approved: boolean;
    createdAt: number;
    updatedAt: number;
    locale: string;
    passports: ABTNodeClient.Passport[];
    firstLoginAt: number;
    lastLoginAt: number;
    remark: string;
    lastLoginIp: string;
    sourceProvider: string;
    sourceAppPid: string;
    connectedAccounts: ABTNodeClient.ConnectedAccount[];
    extra: Record<string, any>;
    tags: ABTNodeClient.Tag[];
    didSpace: Record<string, any>;
    userSessions: ABTNodeClient.UserSession[];
    url: string;
    phone: string;
    inviter: string;
    generation: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    metadata: ABTNodeClient.UserMetadata;
    address: ABTNodeClient.UserAddress;
    userSessionsCount: number;
    isFollowing: boolean;
    name: string;
    createdByAppPid: string;
  }

  interface UserMetadata {
    bio: string;
    location: string;
    timezone: string;
    cover: string;
    links: ABTNodeClient.UserMetadataLink[];
    status: ABTNodeClient.UserMetadataStatus;
    phone: ABTNodeClient.UserPhoneInfo;
  }

  interface UserMetadataLink {
    url: string;
    favicon: string;
  }

  interface UserMetadataStatus {
    label: string;
    icon: string;
    duration: string;
    dateRange: number[];
  }

  interface UserOrg {
    id: string;
    orgId: string;
    userDid: string;
    status: ABTNodeClient.OrgUserStatus;
    createdAt: number;
    updatedAt: number;
    user: ABTNodeClient.UserInfo;
    metadata: Record<string, any>;
  }

  interface UserPhoneInfo {
    country: string;
    phoneNumber: string;
  }

  interface UserSession {
    id: string;
    visitorId: string;
    appPid: string;
    userDid: string;
    ua: string;
    passportId: string;
    status: string;
    lastLoginIp: string;
    extra: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    createdByAppPid: string;
  }

  interface WAFPolicy {
    enabled: boolean;
    mode: string;
    inboundAnomalyScoreThreshold: number;
    outboundAnomalyScoreThreshold: number;
    logLevel: number;
  }

  interface WalletInfo {
    did: string;
    pk: string;
  }

  interface WebHook {
    type: ABTNodeClient.SenderType;
    id: string;
    params: ABTNodeClient.WebHookParam[];
    createdAt: number;
    updatedAt: number;
  }

  interface WebHookParam {
    name: string;
    description: string;
    required: boolean;
    defaultValue: string;
    value: string;
    type: string;
    enabled: boolean;
    consecutiveFailures: number;
  }

  interface WebHookSender {
    type: ABTNodeClient.SenderType;
    title: string;
    description: string;
    params: ABTNodeClient.WebHookParam[];
  }

  interface WebhookAttemptState {
    id: string;
    eventId: string;
    webhookId: string;
    status: string;
    responseStatus: number;
    responseBody: Record<string, any>;
    retryCount: number;
    createdAt: number;
    updatedAt: number;
    triggeredBy: string;
    triggeredFrom: string;
  }

  interface WebhookAttemptWithEndpointEventState {
    id: string;
    eventId: string;
    webhookId: string;
    status: string;
    responseStatus: number;
    responseBody: Record<string, any>;
    retryCount: number;
    createdAt: number;
    updatedAt: number;
    endpoint: ABTNodeClient.WebhookEndpointState;
    event: ABTNodeClient.WebhookEventState;
    triggeredBy: string;
    triggeredFrom: string;
  }

  interface WebhookEndpointState {
    id: string;
    apiVersion: string;
    url: string;
    description: string;
    enabledEvents: ABTNodeClient.EnableEvent[];
    metadata: Record<string, any>;
    status: string;
    createdAt: number;
    updatedAt: number;
    secret: string;
  }

  interface WebhookEndpointWithUserInfo {
    id: string;
    apiVersion: string;
    url: string;
    description: string;
    enabledEvents: ABTNodeClient.EnableEvent[];
    metadata: Record<string, any>;
    status: string;
    createdAt: number;
    updatedAt: number;
    createUser: ABTNodeClient.UserInfo;
    updateUser: ABTNodeClient.UserInfo;
    secret: string;
  }

  interface WebhookEventState {
    id: string;
    type: string;
    apiVersion: string;
    data: Record<string, any>;
    objectType: string;
    objectId: string;
    request: Record<string, any>;
    pendingWebhooks: number;
    metadata: Record<string, any>;
    createdAt: number;
    updatedAt: number;
    source: string;
  }

  interface WebhookStatistics {
    total: number;
    pending: string[];
    success: string[];
    failed: string[];
  }

  interface GetBlockletParams {
    input: ABTNodeClient.RequestBlockletDetailInput;
  }

  interface GetBlockletMetaFromUrlParams {
    input: ABTNodeClient.RequestBlockletMetaFromUrlInput;
  }

  interface GetBlockletDiffParams {
    input: ABTNodeClient.RequestBlockletDiffInput;
  }

  interface GetBlockletsParams {
    input: ABTNodeClient.RequestGetBlockletsInput;
  }

  interface GetBlockletRuntimeHistoryParams {
    input: ABTNodeClient.RequestBlockletRuntimeHistoryInput;
  }

  interface GetDynamicComponentsParams {
    input: ABTNodeClient.RequestGetDynamicComponentsInput;
  }

  interface GetNodeRuntimeHistoryParams {
    input: ABTNodeClient.RequestNodeRuntimeHistoryInput;
  }

  interface GetBlockletMetaParams {
    input: ABTNodeClient.RequestBlockletMetaInput;
  }

  interface GetNotificationsParams {
    input: ABTNodeClient.RequestGetNotificationsInput;
  }

  interface MakeAllNotificationsAsReadParams {
    input: ABTNodeClient.RequestMakeAllNotificationsAsReadInput;
  }

  interface GetNotificationSendLogParams {
    input: ABTNodeClient.RequestNotificationSendLogInput;
  }

  interface GetReceiversParams {
    input: ABTNodeClient.RequestReceiversInput;
  }

  interface GetNotificationComponentsParams {
    input: ABTNodeClient.RequestNotificationComponentsInput;
  }

  interface ResendNotificationParams {
    input: ABTNodeClient.RequestResendNotificationInput;
  }

  interface GetRoutingSitesParams {
    input: ABTNodeClient.RequestGetRoutingSitesInput;
  }

  interface IsDidDomainParams {
    input: ABTNodeClient.RequestIsDidDomainInput;
  }

  interface CheckDomainsParams {
    input: ABTNodeClient.RequestCheckDomainsInput;
  }

  interface FindCertificateByDomainParams {
    input: ABTNodeClient.RequestFindCertificateByDomainInput;
  }

  interface GetAccessKeysParams {
    input: ABTNodeClient.RequestAccessKeysInput;
  }

  interface GetAccessKeyParams {
    input: ABTNodeClient.RequestAccessKeyInput;
  }

  interface SendTestMessageParams {
    input: ABTNodeClient.RequestSendMsgInput;
  }

  interface GetSessionParams {
    input: ABTNodeClient.RequestGetSessionInput;
  }

  interface GetRolesParams {
    input: ABTNodeClient.RequestGetOrgDataInput;
  }

  interface GetRoleParams {
    input: ABTNodeClient.RequestTeamRoleInput;
  }

  interface GetPermissionsParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetInvitationsParams {
    input: ABTNodeClient.RequestGetOrgDataInput;
  }

  interface GetUsersParams {
    input: ABTNodeClient.RequestUsersInput;
  }

  interface GetUserParams {
    input: ABTNodeClient.RequestTeamUserInput;
  }

  interface GetUserSessionsParams {
    input: ABTNodeClient.RequestUserSessionsInput;
  }

  interface GetUserSessionsCountParams {
    input: ABTNodeClient.RequestUserSessionsCountInput;
  }

  interface GetUsersCountParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetUsersCountPerRoleParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetOwnerParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetPermissionsByRoleParams {
    input: ABTNodeClient.RequestTeamRoleInput;
  }

  interface GetPassportIssuancesParams {
    input: ABTNodeClient.RequestGetPassportIssuancesInput;
  }

  interface LogoutUserParams {
    input: ABTNodeClient.RequestLogoutUserInput;
  }

  interface DestroySelfParams {
    input: ABTNodeClient.RequestTeamUserInput;
  }

  interface GetUserFollowersParams {
    input: ABTNodeClient.RequestUserRelationQueryInput;
  }

  interface GetUserFollowingParams {
    input: ABTNodeClient.RequestUserRelationQueryInput;
  }

  interface GetUserFollowStatsParams {
    input: ABTNodeClient.RequestUserRelationCountInput;
  }

  interface CheckFollowingParams {
    input: ABTNodeClient.RequestCheckFollowingInput;
  }

  interface FollowUserParams {
    input: ABTNodeClient.RequestFollowUserActionInput;
  }

  interface UnfollowUserParams {
    input: ABTNodeClient.RequestFollowUserActionInput;
  }

  interface GetUserInvitesParams {
    input: ABTNodeClient.RequestUserRelationQueryInput;
  }

  interface GetTagsParams {
    input: ABTNodeClient.RequestTagsInput;
  }

  interface GetAuditLogsParams {
    input: ABTNodeClient.RequestGetAuditLogsInput;
  }

  interface GetLauncherSessionParams {
    input: ABTNodeClient.RequestGetLauncherSessionInput;
  }

  interface GetBlockletBackupsParams {
    input: ABTNodeClient.RequestGetBlockletBackupsInput;
  }

  interface GetBlockletBackupSummaryParams {
    input: ABTNodeClient.RequestGetBlockletBackupSummaryInput;
  }

  interface GetBlockletSpaceGatewaysParams {
    input: ABTNodeClient.RequestBlockletInput;
  }

  interface GetTrafficInsightsParams {
    input: ABTNodeClient.RequestGetTrafficInsightsInput;
  }

  interface GetProjectsParams {
    input: ABTNodeClient.RequestGetProjectsInput;
  }

  interface GetProjectParams {
    input: ABTNodeClient.RequestProjectInput;
  }

  interface GetReleasesParams {
    input: ABTNodeClient.RequestGetReleasesInput;
  }

  interface GetReleaseParams {
    input: ABTNodeClient.RequestReleaseInput;
  }

  interface GetSelectedResourcesParams {
    input: ABTNodeClient.RequestGetSelectedResourcesInput;
  }

  interface GetBlockletSecurityRuleParams {
    input: ABTNodeClient.RequestGetBlockletSecurityRuleInput;
  }

  interface GetBlockletSecurityRulesParams {
    input: ABTNodeClient.RequestGetBlockletSecurityRulesInput;
  }

  interface GetBlockletResponseHeaderPolicyParams {
    input: ABTNodeClient.RequestGetBlockletResponseHeaderPolicyInput;
  }

  interface GetBlockletResponseHeaderPoliciesParams {
    input: ABTNodeClient.RequestGetBlockletResponseHeaderPoliciesInput;
  }

  interface GetBlockletAccessPolicyParams {
    input: ABTNodeClient.RequestGetBlockletAccessPolicyInput;
  }

  interface GetBlockletAccessPoliciesParams {
    input: ABTNodeClient.RequestGetBlockletAccessPoliciesInput;
  }

  interface GetWebhookEndpointsParams {
    input: ABTNodeClient.RequestGetWebhookEndpointsInput;
  }

  interface GetWebhookEndpointParams {
    input: ABTNodeClient.RequestGetWebhookEndpointInput;
  }

  interface GetWebhookAttemptsParams {
    input: ABTNodeClient.RequestGetWebhookAttemptsInput;
  }

  interface GetPassportRoleCountsParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetPassportsByRoleParams {
    input: ABTNodeClient.RequestPassportInput;
  }

  interface GetPassportLogsParams {
    input: ABTNodeClient.RequestPassportLogInput;
  }

  interface GetRelatedPassportsParams {
    input: ABTNodeClient.RequestRelatedPassportsInput;
  }

  interface GetBlockletBaseInfoParams {
    input: ABTNodeClient.TeamInput;
  }

  interface GetDomainDnsParams {
    input: ABTNodeClient.RequestDomainDNSInput;
  }

  interface GetOAuthClientsParams {
    input: ABTNodeClient.TeamInput;
  }

  interface CreateOAuthClientParams {
    input: ABTNodeClient.RequestOAuthClientInput;
  }

  interface UpdateOAuthClientParams {
    input: ABTNodeClient.RequestOAuthClientInput;
  }

  interface DeleteOAuthClientParams {
    input: ABTNodeClient.RequestDeleteOAuthClientInput;
  }

  interface GetOrgsParams {
    input: ABTNodeClient.RequestGetOrgsInput;
  }

  interface GetOrgParams {
    input: ABTNodeClient.RequestGetOrgInput;
  }

  interface GetOrgMembersParams {
    input: ABTNodeClient.RequestGetOrgDataInput;
  }

  interface GetOrgInvitableUsersParams {
    input: ABTNodeClient.RequestInvitableUsersInput;
  }

  interface GetOrgResourceParams {
    input: ABTNodeClient.RequestGetOrgResourceInput;
  }

  interface InstallBlockletParams {
    input: ABTNodeClient.RequestInstallBlockletInput;
  }

  interface InstallComponentParams {
    input: ABTNodeClient.RequestInstallComponentInput;
  }

  interface StartBlockletParams {
    input: ABTNodeClient.RequestComponentsInput;
  }

  interface StopBlockletParams {
    input: ABTNodeClient.RequestComponentsInput;
  }

  interface ReloadBlockletParams {
    input: ABTNodeClient.RequestComponentsInput;
  }

  interface RestartBlockletParams {
    input: ABTNodeClient.RequestComponentsInput;
  }

  interface DeleteBlockletParams {
    input: ABTNodeClient.RequestDeleteBlockletInput;
  }

  interface DeleteComponentParams {
    input: ABTNodeClient.RequestDeleteComponentInput;
  }

  interface CancelDownloadBlockletParams {
    input: ABTNodeClient.RequestBlockletInput;
  }

  interface CheckComponentsForUpdatesParams {
    input: ABTNodeClient.RequestBlockletInput;
  }

  interface UpgradeComponentsParams {
    input: ABTNodeClient.RequestUpdateComponentsInput;
  }

  interface ConfigBlockletParams {
    input: ABTNodeClient.RequestConfigBlockletInput;
  }

  interface ConfigPublicToStoreParams {
    input: ABTNodeClient.RequestConfigPublicToStoreInput;
  }

  interface ConfigNavigationsParams {
    input: ABTNodeClient.RequestConfigNavigationsInput;
  }

  interface ConfigAuthenticationParams {
    input: ABTNodeClient.RequestConfigAuthenticationInput;
  }

  interface ConfigDidConnectParams {
    input: ABTNodeClient.RequestConfigDidConnectInput;
  }

  interface ConfigDidConnectActionsParams {
    input: ABTNodeClient.RequestConfigDidConnectActionsInput;
  }

  interface ConfigNotificationParams {
    input: ABTNodeClient.RequestConfigNotificationInput;
  }

  interface ConfigVaultParams {
    input: ABTNodeClient.RequestConfigVaultInput;
  }

  interface SendEmailParams {
    input: ABTNodeClient.RequestSendEmailInput;
  }

  interface SendPushParams {
    input: ABTNodeClient.RequestSendPushInput;
  }

  interface JoinFederatedLoginParams {
    input: ABTNodeClient.RequestJoinFederatedLoginInput;
  }

  interface QuitFederatedLoginParams {
    input: ABTNodeClient.RequestQuitFederatedLoginInput;
  }

  interface DisbandFederatedLoginParams {
    input: ABTNodeClient.RequestDisbandFederatedLoginInput;
  }

  interface SyncMasterAuthorizationParams {
    input: ABTNodeClient.RequestSyncMasterAuthorizationInput;
  }

  interface SyncFederatedConfigParams {
    input: ABTNodeClient.RequestSyncFederatedInput;
  }

  interface AuditFederatedLoginParams {
    input: ABTNodeClient.RequestAuditFederatedLoginInput;
  }

  interface UpdateAppSessionConfigParams {
    input: ABTNodeClient.RequestUpdateAppSessionConfigInput;
  }

  interface UpdateComponentTitleParams {
    input: ABTNodeClient.RequestUpdateComponentTitleInput;
  }

  interface UpdateComponentMountPointParams {
    input: ABTNodeClient.RequestUpdateComponentMountPointInput;
  }

  interface BackupBlockletParams {
    input: ABTNodeClient.RequestBackupBlockletInput;
  }

  interface AbortBlockletBackupParams {
    input: ABTNodeClient.RequestAbortBlockletBackupInput;
  }

  interface RestoreBlockletParams {
    input: ABTNodeClient.RequestRestoreBlockletInput;
  }

  interface MigrateApplicationToStructV2Params {
    input: ABTNodeClient.RequestMigrateApplicationToStructV2Input;
  }

  interface LaunchBlockletByLauncherParams {
    input: ABTNodeClient.RequestLaunchBlockletByLauncherInput;
  }

  interface LaunchBlockletWithoutWalletParams {
    input: ABTNodeClient.RequestLaunchBlockletWithoutWalletInput;
  }

  interface AddBlockletSpaceGatewayParams {
    input: ABTNodeClient.RequestAddBlockletSpaceGatewayInput;
  }

  interface DeleteBlockletSpaceGatewayParams {
    input: ABTNodeClient.RequestDeleteBlockletSpaceGatewayInput;
  }

  interface UpdateBlockletSpaceGatewayParams {
    input: ABTNodeClient.RequestUpdateBlockletSpaceGatewayInput;
  }

  interface UpdateAutoBackupParams {
    input: ABTNodeClient.RequestUpdateAutoBackupInput;
  }

  interface UpdateAutoCheckUpdateParams {
    input: ABTNodeClient.RequestUpdateAutoCheckUpdateInput;
  }

  interface UpdateBlockletSettingsParams {
    input: ABTNodeClient.RequestBlockletSettingsInput;
  }

  interface UpdateNodeInfoParams {
    input: ABTNodeClient.NodeInfoInput;
  }

  interface UpgradeNodeVersionParams {
    input: ABTNodeClient.RequestUpgradeNodeVersionInput;
  }

  interface ResetNodeParams {
    input: ABTNodeClient.RequestResetNodeInput;
  }

  interface RotateSessionKeyParams {
    input: ABTNodeClient.RequestRotateSessionKeyInput;
  }

  interface UpdateGatewayParams {
    input: ABTNodeClient.GatewayInput;
  }

  interface ClearCacheParams {
    input: ABTNodeClient.RequestClearCacheInput;
  }

  interface CreateMemberInvitationParams {
    input: ABTNodeClient.RequestCreateInvitationInput;
  }

  interface CreateTransferInvitationParams {
    input: ABTNodeClient.RequestCreateTransferNodeInvitationInput;
  }

  interface DeleteInvitationParams {
    input: ABTNodeClient.RequestDeleteInvitationInput;
  }

  interface CreatePassportIssuanceParams {
    input: ABTNodeClient.RequestCreatePassportIssuanceInput;
  }

  interface DeletePassportIssuanceParams {
    input: ABTNodeClient.RequestDeleteTeamSessionInput;
  }

  interface ConfigTrustedPassportsParams {
    input: ABTNodeClient.RequestConfigTrustedPassportsInput;
  }

  interface ConfigTrustedFactoriesParams {
    input: ABTNodeClient.RequestConfigTrustedFactoriesInput;
  }

  interface ConfigPassportIssuanceParams {
    input: ABTNodeClient.RequestConfigPassportIssuanceInput;
  }

  interface RemoveUserParams {
    input: ABTNodeClient.RequestTeamUserInput;
  }

  interface UpdateUserTagsParams {
    input: ABTNodeClient.RequestUpdateUserTagsInput;
  }

  interface UpdateUserExtraParams {
    input: ABTNodeClient.RequestUpdateUserExtraInput;
  }

  interface UpdateUserApprovalParams {
    input: ABTNodeClient.RequestTeamUserInput;
  }

  interface IssuePassportToUserParams {
    input: ABTNodeClient.RequestIssuePassportToUserInput;
  }

  interface RevokeUserPassportParams {
    input: ABTNodeClient.RequestRevokeUserPassportInput;
  }

  interface EnableUserPassportParams {
    input: ABTNodeClient.RequestRevokeUserPassportInput;
  }

  interface RemoveUserPassportParams {
    input: ABTNodeClient.RequestRevokeUserPassportInput;
  }

  interface SwitchProfileParams {
    input: ABTNodeClient.RequestSwitchProfileInput;
  }

  interface UpdateUserAddressParams {
    input: ABTNodeClient.RequestUpdateUserAddressInput;
  }

  interface UpdateUserInfoParams {
    input: ABTNodeClient.RequestUpdateUserInfoInput;
  }

  interface CreateRoleParams {
    input: ABTNodeClient.RequestCreateRoleInput;
  }

  interface UpdateRoleParams {
    input: ABTNodeClient.RequestTeamRoleInput;
  }

  interface DeleteRoleParams {
    input: ABTNodeClient.RequestDeleteRoleInput;
  }

  interface CreatePermissionParams {
    input: ABTNodeClient.RequestCreatePermissionInput;
  }

  interface UpdatePermissionParams {
    input: ABTNodeClient.RequestTeamPermissionInput;
  }

  interface DeletePermissionParams {
    input: ABTNodeClient.RequestDeletePermissionInput;
  }

  interface GrantPermissionForRoleParams {
    input: ABTNodeClient.RequestGrantPermissionForRoleInput;
  }

  interface RevokePermissionFromRoleParams {
    input: ABTNodeClient.RequestRevokePermissionFromRoleInput;
  }

  interface UpdatePermissionsForRoleParams {
    input: ABTNodeClient.RequestUpdatePermissionsForRoleInput;
  }

  interface HasPermissionParams {
    input: ABTNodeClient.RequestHasPermissionInput;
  }

  interface AddBlockletStoreParams {
    input: ABTNodeClient.RequestAddBlockletStoreInput;
  }

  interface DeleteBlockletStoreParams {
    input: ABTNodeClient.RequestDeleteBlockletStoreInput;
  }

  interface GetTagParams {
    input: ABTNodeClient.RequestTagInput;
  }

  interface CreateTagParams {
    input: ABTNodeClient.RequestTagInput;
  }

  interface UpdateTagParams {
    input: ABTNodeClient.RequestTagInput;
  }

  interface DeleteTagParams {
    input: ABTNodeClient.RequestTagInput;
  }

  interface CreateTaggingParams {
    input: ABTNodeClient.RequestTaggingInput;
  }

  interface DeleteTaggingParams {
    input: ABTNodeClient.RequestTaggingInput;
  }

  interface ReadNotificationsParams {
    input: ABTNodeClient.RequestReadNotificationsInput;
  }

  interface UnreadNotificationsParams {
    input: ABTNodeClient.RequestReadNotificationsInput;
  }

  interface AddRoutingSiteParams {
    input: ABTNodeClient.RequestAddRoutingSiteInput;
  }

  interface AddDomainAliasParams {
    input: ABTNodeClient.RequestAddDomainAliasInput;
  }

  interface DeleteDomainAliasParams {
    input: ABTNodeClient.RequestDeleteDomainAliasInput;
  }

  interface DeleteRoutingSiteParams {
    input: ABTNodeClient.RequestDeleteRoutingSiteInput;
  }

  interface UpdateRoutingSiteParams {
    input: ABTNodeClient.RequestUpdateRoutingSiteInput;
  }

  interface AddRoutingRuleParams {
    input: ABTNodeClient.RequestAddRoutingRuleInput;
  }

  interface UpdateRoutingRuleParams {
    input: ABTNodeClient.RequestUpdateRoutingRuleInput;
  }

  interface DeleteRoutingRuleParams {
    input: ABTNodeClient.RequestDeleteRoutingRuleInput;
  }

  interface UpdateCertificateParams {
    input: ABTNodeClient.RequestUpdateNginxHttpsCertInput;
  }

  interface AddCertificateParams {
    input: ABTNodeClient.RequestAddNginxHttpsCertInput;
  }

  interface DeleteCertificateParams {
    input: ABTNodeClient.RequestDeleteNginxHttpsCertInput;
  }

  interface IssueLetsEncryptCertParams {
    input: ABTNodeClient.RequestAddLetsEncryptCertInput;
  }

  interface CreateAccessKeyParams {
    input: ABTNodeClient.RequestCreateAccessKeyInput;
  }

  interface UpdateAccessKeyParams {
    input: ABTNodeClient.RequestUpdateAccessKeyInput;
  }

  interface DeleteAccessKeyParams {
    input: ABTNodeClient.RequestDeleteAccessKeyInput;
  }

  interface VerifyAccessKeyParams {
    input: ABTNodeClient.RequestVerifyAccessKeyInput;
  }

  interface CreateWebHookParams {
    input: ABTNodeClient.RequestCreateWebHookInput;
  }

  interface DeleteWebHookParams {
    input: ABTNodeClient.RequestDeleteWebHookInput;
  }

  interface UpdateWebHookStateParams {
    input: ABTNodeClient.RequestUpdateWebHookStateInput;
  }

  interface CreateProjectParams {
    input: ABTNodeClient.RequestCreateProjectInput;
  }

  interface UpdateProjectParams {
    input: ABTNodeClient.RequestUpdateProjectInput;
  }

  interface DeleteProjectParams {
    input: ABTNodeClient.RequestProjectInput;
  }

  interface CreateReleaseParams {
    input: ABTNodeClient.RequestCreateReleaseInput;
  }

  interface DeleteReleaseParams {
    input: ABTNodeClient.RequestReleaseInput;
  }

  interface UpdateSelectedResourcesParams {
    input: ABTNodeClient.RequestUpdateSelectedResourcesInput;
  }

  interface ConnectToStoreParams {
    input: ABTNodeClient.RequestConnectToStoreInput;
  }

  interface DisconnectFromStoreParams {
    input: ABTNodeClient.RequestDisconnectFromStoreInput;
  }

  interface PublishToStoreParams {
    input: ABTNodeClient.RequestPublishToStoreInput;
  }

  interface ConnectByStudioParams {
    input: ABTNodeClient.RequestConnectByStudioInput;
  }

  interface AddBlockletSecurityRuleParams {
    input: ABTNodeClient.RequestAddBlockletSecurityRuleInput;
  }

  interface UpdateBlockletSecurityRuleParams {
    input: ABTNodeClient.RequestUpdateBlockletSecurityRuleInput;
  }

  interface DeleteBlockletSecurityRuleParams {
    input: ABTNodeClient.RequestDeleteBlockletSecurityRuleInput;
  }

  interface AddBlockletResponseHeaderPolicyParams {
    input: ABTNodeClient.RequestAddBlockletResponseHeaderPolicyInput;
  }

  interface UpdateBlockletResponseHeaderPolicyParams {
    input: ABTNodeClient.RequestUpdateBlockletResponseHeaderPolicyInput;
  }

  interface DeleteBlockletResponseHeaderPolicyParams {
    input: ABTNodeClient.RequestDeleteBlockletResponseHeaderPolicyInput;
  }

  interface AddBlockletAccessPolicyParams {
    input: ABTNodeClient.RequestAddBlockletAccessPolicyInput;
  }

  interface UpdateBlockletAccessPolicyParams {
    input: ABTNodeClient.RequestUpdateBlockletAccessPolicyInput;
  }

  interface DeleteBlockletAccessPolicyParams {
    input: ABTNodeClient.RequestDeleteBlockletAccessPolicyInput;
  }

  interface CreateWebhookEndpointParams {
    input: ABTNodeClient.RequestCreateWebhookEndpointInput;
  }

  interface UpdateWebhookEndpointParams {
    input: ABTNodeClient.RequestUpdateWebhookEndpointInput;
  }

  interface DeleteWebhookEndpointParams {
    input: ABTNodeClient.RequestDeleteWebhookEndpointInput;
  }

  interface RetryWebhookAttemptParams {
    input: ABTNodeClient.RequestAttemptInput;
  }

  interface RegenerateWebhookEndpointSecretParams {
    input: ABTNodeClient.RequestRegenerateWebhookEndpointSecretInput;
  }

  interface AddUploadEndpointParams {
    input: ABTNodeClient.RequestAddUploadEndpointInput;
  }

  interface DeleteUploadEndpointParams {
    input: ABTNodeClient.RequestDeleteUploadEndpointInput;
  }

  interface ConnectToEndpointParams {
    input: ABTNodeClient.RequestConnectToEndpointInput;
  }

  interface DisconnectFromEndpointParams {
    input: ABTNodeClient.RequestDisconnectFromEndpointInput;
  }

  interface PublishToEndpointParams {
    input: ABTNodeClient.RequestPublishToEndpointInput;
  }

  interface ConnectToAigneParams {
    input: ABTNodeClient.RequestConnectToAigneInput;
  }

  interface DisconnectToAigneParams {
    input: ABTNodeClient.RequestDisconnectToAigneInput;
  }

  interface VerifyAigneConnectionParams {
    input: ABTNodeClient.RequestVerifyAigneConnectionInput;
  }

  interface CreateOrgParams {
    input: ABTNodeClient.RequestCreateOrgInput;
  }

  interface UpdateOrgParams {
    input: ABTNodeClient.RequestUpdateOrgInput;
  }

  interface DeleteOrgParams {
    input: ABTNodeClient.RequestGetOrgInput;
  }

  interface AddOrgMemberParams {
    input: ABTNodeClient.RequestGetOrgMemberInput;
  }

  interface RemoveOrgMemberParams {
    input: ABTNodeClient.RequestGetOrgMemberInput;
  }

  interface InviteMembersToOrgParams {
    input: ABTNodeClient.RequestInviteMembersToOrgInput;
  }

  interface AddOrgResourceParams {
    input: ABTNodeClient.RequestAddOrgResourceInput;
  }

  interface MigrateOrgResourceParams {
    input: ABTNodeClient.RequestMigrateOrgResourceInput;
  }
}
