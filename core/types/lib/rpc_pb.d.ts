// package: abt_node
// file: rpc.proto
import * as enum_pb from './enum_pb';
import * as type_pb from './type_pb';
export type TEmptyRequest = {};
export type TGeneralResponse = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TBooleanResponse = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  result: boolean;
};
export type TRequestBlocklet = {
  did: string;
};
export type TRequestComponents = {
  did: string;
  componentDids: string[];
};
export type TRequestBlockletDetail = {
  did: string;
  attachDiskInfo: boolean;
  attachRuntimeInfo: boolean;
  getOptionalComponents: boolean;
  domain: string;
  useCache: boolean;
};
export type TResponseBlocklet = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  blocklet?: type_pb.TBlockletState;
};
export type TRequestBlockletMetaFromUrl = {
  url: string;
  checkPrice: boolean;
};
export type TResponseBlockletMetaFromUrl = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  meta?: type_pb.TBlockletMeta;
  isFree: boolean;
  inStore: boolean;
  registryUrl: string;
};
export type TRequestBlockletDiff = {
  did: string;
  hashFiles: type_pb.THashFile[];
  rootDid: string;
};
export type TResponseBlockletDiff = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  blockletDiff?: type_pb.TBlockletDiff;
};
export type TRequestGetBlocklets = {
  useCache: boolean;
  query?: type_pb.TBlockletQuery;
  includeRuntimeInfo: boolean;
  paging?: type_pb.TPaging;
  search: string;
  external: boolean;
  sort?: type_pb.TSort;
};
export type TResponseGetBlocklets = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  blocklets: type_pb.TBlockletState[];
  paging?: type_pb.TPaging;
};
export type TResponseBlockletsFromBackup = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  backups: type_pb.TBlockletBackupState[];
};
export type TRequestGetNodeInfo = {};
export type TResponseGetNodeInfo = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  info?: type_pb.TNodeState;
};
export type TResponseGetNodeEnv = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  info?: type_pb.TNodeEnvInfo;
};
export type TRequestResetNode = {
  owner: boolean;
  blocklets: boolean;
  webhooks: boolean;
  certificates: boolean;
  accessKeys: boolean;
  blockletExtras: boolean;
  routingRules: boolean;
  users: boolean;
  invitations: boolean;
};
export type TResponseResetNode = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestDelegationState = {};
export type TResponseDelegationState = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  state?: type_pb.TDelegationState;
};
export type TRequestConfigBlocklet = {
  did: string[];
  configs: type_pb.TConfigEntry[];
};
export type TRequestInstallBlocklet = {
  type: string;
  did: string;
  storeUrl: string;
  url: string;
  file: enum_pb.UploadMap[keyof enum_pb.UploadMap];
  diffVersion: string;
  deleteSet: string[];
  title: string;
  description: string;
  startImmediately: boolean;
  appSk: string;
  downloadTokenList: type_pb.TDownloadToken[];
};
export type TRequestInstallComponent = {
  rootDid: string;
  mountPoint: string;
  url: string;
  file: enum_pb.UploadMap[keyof enum_pb.UploadMap];
  did: string;
  diffVersion: string;
  deleteSet: string[];
  name: string;
  title: string;
  configs: type_pb.TConfigEntry[];
  downloadTokenList: type_pb.TDownloadToken[];
  skipNavigation: boolean;
  onlyRequired: boolean;
  dist?: type_pb.TBlockletDist;
};
export type TResponseCheckComponentsForUpdates = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  preUpdateInfo?: type_pb.TBlockletPreUpdateInfo;
};
export type TRequestUpdateComponents = {
  updateId: string;
  rootDid: string;
  selectedComponents: string[];
};
export type TRequestGetDynamicComponents = {
  url: string;
};
export type TResponseGetDynamicComponents = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  components: type_pb.TComponentState[];
};
export type TRequestConfigPublicToStore = {
  did: string;
  publicToStore: boolean;
};
export type TRequestConfigNavigations = {
  did: string;
  navigations: type_pb.TConfigNavigation[];
};
export type TRequestConfigAuthentication = {
  did: string;
  authentication: string;
  oauth: string;
};
export type TRequestConfigDidConnect = {
  did: string;
  didConnect: string;
};
export type TRequestConfigDidConnectActions = {
  did: string;
  actionConfig: string;
};
export type TRequestJoinFederatedLogin = {
  did: string;
  appUrl: string;
};
export type TRequestQuitFederatedLogin = {
  did: string;
  targetDid: string;
};
export type TRequestDisbandFederatedLogin = {
  did: string;
};
export type TRequestAuditFederatedLogin = {
  did: string;
  memberPid: string;
  status: string;
};
export type TRequestSyncMasterAuthorization = {
  did: string;
};
export type TRequestSyncFederated = {
  did: string;
};
export type TRequestConfigNotification = {
  did: string;
  notification: string;
};
export type TRequestSendEmail = {
  did: string;
  receiver: string;
  email: string;
};
export type TRequestSendPush = {
  did: string;
  receiver: string;
  notification: string;
};
export type TRequestUpdateComponentTitle = {
  did: string;
  rootDid: string;
  title: string;
};
export type TRequestUpdateComponentMountPoint = {
  did: string;
  rootDid: string;
  mountPoint: string;
};
export type TRequestBackupBlocklet = {
  appDid: string;
  to: enum_pb.BackupToMap[keyof enum_pb.BackupToMap];
};
export type TRequestAbortBlockletBackup = {
  appPid: string;
};
export type TRequestRestoreBlocklet = {
  endpoint: string;
  appDid: string;
  delegation: string;
  password: Uint8Array | string;
  wallet?: Record<string, any>;
  from: enum_pb.BackupToMap[keyof enum_pb.BackupToMap];
  appPid: string;
};
export type TRequestDeleteBlocklet = {
  did: string;
  keepData: boolean;
  sessionId: string;
};
export type TRequestDeleteComponent = {
  did: string;
  rootDid: string;
  keepData: boolean;
  sessionId: string;
};
export type TRequestRegistry = {};
export type TRequestBlockletMeta = {
  did: string;
  storeUrl: string;
};
export type TResponseBlockletMeta = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  meta?: Record<string, any>;
};
export type TRequestGetNotifications = {
  receiver: string;
  sender: string;
  read: boolean;
  paging?: type_pb.TPaging;
  teamDid: string;
  severity: string[];
  componentDid: string[];
  entityId: string[];
  source: string[];
};
export type TResponseGetNotifications = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TNotification[];
  paging?: type_pb.TPaging;
  unreadCount: number;
};
export type TRequestNotificationSendLog = {
  teamDid: string;
  dateRange: string[];
  paging?: type_pb.TPaging;
  source: string;
  componentDids: string[];
  severities: string[];
};
export type TResponseNotificationSendLog = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TNotification[];
  paging?: type_pb.TPaging;
};
export type TRequestReceivers = {
  teamDid: string;
  userName: string;
  userDid: string;
  walletSendStatus: number[];
  pushKitSendStatus: number[];
  emailSendStatus: number[];
  dateRange: string[];
  paging?: type_pb.TPaging;
  notificationId: string;
};
export type TResponseReceivers = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TNotificationReceiver[];
  paging?: type_pb.TPaging;
};
export type TRequestNotificationComponents = {
  teamDid: string;
  receiver: string;
};
export type TResponseNotificationComponents = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  componentDids: string[];
};
export type TRequestResendNotification = {
  teamDid: string;
  notificationId: string;
  receivers: string[];
  channels: string[];
  webhookUrls: string[];
  resendFailedOnly: boolean;
};
export type TResponseResendNotification = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: Record<string, any>;
};
export type TRequestMakeAllNotificationsAsRead = {
  receiver: string;
  teamDid: string;
  severity: string;
  componentDid: string;
  entityId: string;
  source: string;
};
export type TreadUpdateAffected = {
  numAffected: number;
  notificationIds: string[];
};
export type TResponseMakeAllNotificationsAsRead = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: TreadUpdateAffected;
};
export type TRequestReadNotifications = {
  notificationIds: string[];
  teamDid: string;
  receiver: string;
};
export type TResponseReadNotifications = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  numAffected: number;
};
export type TRequestAddRoutingSite = {
  domain: string;
  type: string;
  rules: type_pb.TRoutingRule[];
};
export type TRequestUpdateRoutingSite = {
  id: string;
  corsAllowedOrigins: string[];
  domain: string;
  teamDid: string;
};
export type TRequestAddDomainAlias = {
  id: string;
  domainAlias: string;
  force: boolean;
  teamDid: string;
  type: string;
  nftDid: string;
  chainHost: string;
  inBlockletSetup: boolean;
  metadata: string;
};
export type TRequestDeleteDomainAlias = {
  id: string;
  domainAlias: string;
  teamDid: string;
};
export type TRequestGetRoutingSites = {
  snapshotHash: string;
};
export type TResponseGetRoutingSites = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  sites: type_pb.TRoutingSite[];
};
export type TResponseRoutingSite = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  site?: type_pb.TRoutingSite;
};
export type TRequestDeleteRoutingSite = {
  id: string;
};
export type TRequestAddRoutingRule = {
  id: string;
  rule?: type_pb.TRoutingRule;
  teamDid: string;
};
export type TRequestUpdateRoutingRule = {
  id: string;
  rule?: type_pb.TRoutingRule;
  teamDid: string;
};
export type TRequestDeleteRoutingRule = {
  id: string;
  ruleId: string;
  teamDid: string;
};
export type TRequestCheckDomains = {
  domains: string[];
  did: string;
};
export type TResponseCheckDomains = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestFindCertificateByDomain = {
  domain: string;
  did: string;
};
export type TResponseFindCertificateByDomain = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  cert?: type_pb.TCertificate;
};
export type TRequestGetRoutingProviders = {};
export type TResponseGetRoutingProviders = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  providers: type_pb.TRoutingProvider[];
};
export type TRequestGetCertificates = {};
export type TResponseGetCertificates = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  certificates: type_pb.TCertificate[];
};
export type TRequestAddNginxHttpsCert = {
  name: string;
  privateKey: string;
  certificate: string;
};
export type TResponseAddNginxHttpsCert = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestUpdateNginxHttpsCert = {
  id: string;
  name: string;
  certificate: string;
  privateKey: string;
};
export type TResponseUpdateNginxHttpsCert = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestDeleteNginxHttpsCert = {
  id: string;
};
export type TResponseDeleteNginxHttpsCert = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestAddLetsEncryptCert = {
  domain: string;
  did: string;
  siteId: string;
  inBlockletSetup: boolean;
};
export type TResponseAddLetsEncryptCert = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestIsDidDomain = {
  domain: string;
};
export type TResponseIsDidDomain = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  value: boolean;
};
export type TRequestAccessKeys = {
  teamDid: string;
  paging?: type_pb.TPaging;
  remark: string;
  componentDid: string;
  resourceType: string;
  resourceId: string;
};
export type TResponseAccessKeys = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TAccessKey[];
  paging?: type_pb.TPaging;
};
export type TRequestAccessKey = {
  teamDid: string;
  accessKeyId: string;
};
export type TResponseAccessKey = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: type_pb.TAccessKey;
};
export type TRequestCreateAccessKey = {
  teamDid: string;
  remark: string;
  passport: string;
  authType: string;
  componentDid: string;
  resourceType: string;
  resourceId: string;
  createdVia: string;
  expireAt: number;
};
export type TResponseCreateAccessKey = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: type_pb.TCreateAccessKey;
};
export type TRequestUpdateAccessKey = {
  teamDid: string;
  accessKeyId: string;
  remark: string;
  passport: string;
  expireAt: number;
};
export type TResponseUpdateAccessKey = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: type_pb.TAccessKey;
};
export type TRequestDeleteAccessKey = {
  teamDid: string;
  accessKeyId: string;
};
export type TResponseDeleteAccessKey = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestVerifyAccessKey = {
  teamDid: string;
  accessKeyId: string;
  resourceType: string;
  resourceId: string;
  componentDid: string;
};
export type TRequestCreateWebHook = {
  type: enum_pb.SenderTypeMap[keyof enum_pb.SenderTypeMap];
  title: string;
  description: string;
  params: type_pb.TWebHookParam[];
};
export type TRequestDeleteWebHook = {
  id: string;
};
export type TRequestWebHook = {};
export type TRequestSenderList = {};
export type TResponseSenderList = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  senders: type_pb.TWebHookSender[];
};
export type TResponseWebHooks = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  webhooks: type_pb.TWebHook[];
};
export type TResponseDeleteWebHook = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TResponseCreateWebHook = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  webhook?: type_pb.TWebHookSender;
};
export type TRequestSendMsg = {
  webhookId: string;
  message: string;
};
export type TResponseSendMsg = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestUpgradeNodeVersion = {
  sessionId: string;
};
export type TResponseUpgradeNodeVersion = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  sessionId: string;
};
export type TRequestCheckNodeVersion = {};
export type TResponseCheckNodeVersion = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  version: string;
};
export type TRequestRestartServer = {};
export type TResponseRestartServer = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  sessionId: string;
};
export type TRequestRestartAllContainers = {};
export type TResponseRestartAllContainers = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  sessionId: string;
};
export type TRequestGetSession = {
  id: string;
};
export type TResponseGetSession = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  session?: Record<string, any>;
};
export type TRequestCreateInvitation = {
  teamDid: string;
  role: string;
  remark: string;
  sourceAppPid: string;
  display?: type_pb.TPassportDisplay;
  passportExpireTime: string;
};
export type TResponseCreateInvitation = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  inviteInfo?: type_pb.TInviteInfo;
};
export type TRequestCreateTransferNodeInvitation = {
  teamDid: string;
  remark: string;
};
export type TResponseCreateTransferNodeInvitation = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  inviteInfo?: type_pb.TInviteInfo;
};
export type TRequestDeleteTeamSession = {
  teamDid: string;
  sessionId: string;
};
export type TResponseGetInvitations = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  invitations: type_pb.TInviteInfo[];
};
export type TRequestDeleteInvitation = {
  teamDid: string;
  inviteId: string;
};
export type TRequestHasPermission = {
  teamDid: string;
  role: string;
  permission: string;
};
export type TRequestCreatePassportIssuance = {
  teamDid: string;
  ownerDid: string;
  name: string;
  display?: type_pb.TPassportDisplay;
  passportExpireTime: string;
};
export type TResponseCreatePassportIssuance = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  info?: type_pb.TPassportIssuanceInfo;
};
export type TRequestGetPassportIssuances = {
  teamDid: string;
  ownerDid: string;
};
export type TResponseGetPassportIssuances = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TPassportIssuanceInfo[];
};
export type TRequestConfigTrustedPassports = {
  teamDid: string;
  trustedPassports: type_pb.TTrustedPassport[];
};
export type TRequestConfigTrustedFactories = {
  teamDid: string;
  trustedFactories: type_pb.TTrustedFactory[];
};
export type TRequestConfigPassportIssuance = {
  teamDid: string;
  enable: boolean;
};
export type TResponseRoles = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  roles: type_pb.TRole[];
};
export type TRequestCreateRole = {
  teamDid: string;
  name: string;
  title: string;
  description: string;
  childName: string;
  permissions: string[];
  extra: string;
  orgId: string;
};
export type TResponseRole = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  role?: type_pb.TRole;
};
export type TResponsePermissions = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  permissions: type_pb.TPermission[];
};
export type TRequestCreatePermission = {
  teamDid: string;
  name: string;
  description: string;
};
export type TRequestTeamPermission = {
  teamDid: string;
  permission?: type_pb.TPermission;
};
export type TResponsePermission = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  permission?: type_pb.TPermission;
};
export type TRequestGrantPermissionForRole = {
  teamDid: string;
  roleName: string;
  grantName: string;
};
export type TRequestRevokePermissionFromRole = {
  teamDid: string;
  roleName: string;
  grantName: string;
};
export type TRequestDeleteRole = {
  teamDid: string;
  name: string;
};
export type TRequestDeletePermission = {
  teamDid: string;
  name: string;
};
export type TRequestUpdatePermissionsForRole = {
  teamDid: string;
  roleName: string;
  grantNames: string[];
};
export type TRequestTeamRole = {
  teamDid: string;
  role?: type_pb.TRoleUpdate;
  orgId: string;
};
export type TRequestTeamUser = {
  teamDid: string;
  user?: type_pb.TUserInfo;
  options?: TRequestTeamUserOptions;
  sessionId: string;
};
export type TRequestUpdateUserTags = {
  teamDid: string;
  did: string;
  tags: number[];
};
export type TRequestUpdateUserExtra = {
  teamDid: string;
  did: string;
  remark: string;
  extra: string;
};
export type TQueryUserFollowOptions = {
  includeUserInfo: boolean;
  includeFollowStatus: boolean;
};
export type TRequestUserRelationQuery = {
  teamDid: string;
  userDid: string;
  paging?: type_pb.TPaging;
  sort?: type_pb.TUserSort;
  options?: TQueryUserFollowOptions;
};
export type TResponseGetUserInvites = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data: type_pb.TUserInfo[];
  paging?: type_pb.TPaging;
};
export type TQueryUserFollowStateOptions = {
  includeFollowing: boolean;
  includeFollowers: boolean;
  includeInvitees: boolean;
};
export type TRequestUserRelationCount = {
  teamDid: string;
  userDids: string[];
  options?: TQueryUserFollowStateOptions;
};
export type TRequestCheckFollowing = {
  teamDid: string;
  userDids: string[];
  followerDid: string;
};
export type TUserFollowOptions = {
  skipNotification: boolean;
};
export type TRequestFollowUserAction = {
  teamDid: string;
  userDid: string;
  followerDid: string;
  options?: TUserFollowOptions;
};
export type TResponseCheckFollowing = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: Record<string, any>;
};
export type TUserFollows = {
  userDid: string;
  followerDid: string;
  createdAt: number;
  user?: type_pb.TUserInfo;
  isFollowing: boolean;
};
export type TResponseUserFollows = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data: TUserFollows[];
  paging?: type_pb.TPaging;
};
export type TResponseUserRelationCount = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: Record<string, any>;
};
export type TRequestUpdateUserAddress = {
  teamDid: string;
  did: string;
  address?: type_pb.TUserAddress;
};
export type TRequestUpdateUserInfo = {
  teamDid: string;
  user?: type_pb.TUserInfo;
};
export type TRequestTeamUserOptions = {
  enableConnectedAccount: boolean;
  includeTags: boolean;
  includeFederated: boolean;
};
export type TResponseUser = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  user?: type_pb.TUserInfo;
};
export type TRequestUsers = {
  teamDid: string;
  query?: type_pb.TUserQuery;
  sort?: type_pb.TUserSort;
  paging?: type_pb.TPaging;
  dids: string[];
};
export type TRequestUserSessions = {
  teamDid: string;
  query?: type_pb.TUserSessionQuery;
  sort?: type_pb.TUserSessionSort;
  paging?: type_pb.TPaging;
};
export type TResponseUserSessions = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TUserSession[];
  paging?: type_pb.TPaging;
};
export type TRequestUserSessionsCount = {
  teamDid: string;
  query?: type_pb.TUserSessionQuery;
};
export type TResponseUserSessionsCount = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  count: number;
};
export type TRequestLogoutUser = {
  teamDid: string;
  appPid: string;
  userDid: string;
  visitorId: string;
  remove: boolean;
};
export type TResponseGetUsersCount = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  count: number;
};
export type TResponseGetUsersCountPerRole = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  counts: type_pb.TKeyValue[];
};
export type TResponseUsers = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  users: type_pb.TUserInfo[];
  paging?: type_pb.TPaging;
};
export type TRequestIssuePassportToUser = {
  teamDid: string;
  userDid: string;
  role: string;
  display?: type_pb.TPassportDisplay;
  notify: boolean;
  notification: string;
};
export type TRequestSwitchProfile = {
  teamDid: string;
  userDid: string;
  profile?: type_pb.TUserProfile;
};
export type TRequestRevokeUserPassport = {
  teamDid: string;
  userDid: string;
  passportId: string;
};
export type TRequestAddBlockletStore = {
  teamDid: string;
  url: string;
  scope: string;
};
export type TRequestDeleteBlockletStore = {
  teamDid: string;
  url: string;
  projectId: string;
  scope: string;
};
export type TRequestGetAuditLogs = {
  paging?: type_pb.TPaging;
  scope: string;
  category: string;
  actionorcontent: string;
};
export type TResponseGetAuditLogs = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TAuditLog[];
  paging?: type_pb.TPaging;
};
export type TResponseGateway = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  gateway?: type_pb.TGateway;
};
export type TRequestBlockletRuntimeHistory = {
  did: string;
  hours: number;
};
export type TResponseNodeRuntimeHistory = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  history: type_pb.TNodeHistoryItem[];
};
export type TRequestNodeRuntimeHistory = {
  hours: number;
};
export type TBlockletHistoryItemList = {
  key: string;
  value: type_pb.TBlockletHistoryItem[];
};
export type TResponseBlockletRuntimeHistory = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  historyList: TBlockletHistoryItemList[];
};
export type TRequestMigrateApplicationToStructV2 = {
  did: string;
  appSk: string;
};
export type TRequestAddBlockletSpaceGateway = {
  did: string;
  spaceGateway?: type_pb.TSpaceGateway;
};
export type TRequestDeleteBlockletSpaceGateway = {
  did: string;
  spacegatewaydid: string;
};
export type TRequestUpdateBlockletSpaceGateway = {
  did: string;
  where?: type_pb.TSpaceGateway;
  spaceGateway?: type_pb.TSpaceGateway;
};
export type TResponseGetBlockletSpaceGateways = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  spaceGateways: type_pb.TSpaceGateway[];
};
export type TRequestUpdateAutoBackup = {
  did: string;
  autoBackup?: type_pb.TAutoBackup;
};
export type TRequestGetBlockletBackups = {
  did: string;
  startTime: string;
  endTime: string;
};
export type TResponseGetBlockletBackups = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  backups: type_pb.TBackup[];
};
export type TRequestUpdateAutoCheckUpdate = {
  did: string;
  autoCheckUpdate?: type_pb.TAutoCheckUpdate;
};
export type TRequestBlockletSettings = {
  did: string;
  enableSessionHardening: boolean;
  invite?: type_pb.TInviteSettings;
  gateway?: type_pb.TBlockletGateway;
  aigne?: type_pb.TAigneConfig;
  org?: type_pb.TOrgSettings;
  subService?: type_pb.TSubServiceConfig;
};
export type TRequestGetLauncherSession = {
  launcherSessionId: string;
  launcherUrl: string;
};
export type TResponseGetLauncherSession = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  error: string;
  launcherSession?: Record<string, any>;
};
export type TRequestLaunchBlockletByLauncher = {
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
};
export type TResponseLaunchBlockletByLauncher = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: Record<string, any>;
};
export type TRequestLaunchBlockletWithoutWallet = {
  blockletMetaUrl: string;
  title: string;
  description: string;
  onlyRequired: boolean;
  type: string;
  storeUrl: string;
};
export type TResponseLaunchBlockletWithoutWallet = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: Record<string, any>;
};
export type TRequestUpdateAppSessionConfig = {
  did: string;
  config?: type_pb.TSessionConfig;
};
export type TRequestGetTrafficInsights = {
  did: string;
  startDate: string;
  endDate: string;
  paging?: type_pb.TPaging;
};
export type TResponseGetTrafficInsights = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  list: type_pb.TTrafficInsight[];
  paging?: type_pb.TPaging;
};
export type TRequestClearCache = {
  teamDid: string;
  pattern: string;
};
export type TResponseClearCache = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  removed: string[];
};
export type TRequestTag = {
  teamDid: string;
  tag?: type_pb.TTag;
  moveTo: number;
};
export type TResponseTag = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  tag?: type_pb.TTag;
};
export type TRequestTagging = {
  teamDid: string;
  tagging?: type_pb.TTagging;
};
export type TResponseTagging = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  tagging: type_pb.TTagging[];
};
export type TRequestTags = {
  teamDid: string;
  paging?: type_pb.TPaging;
};
export type TResponseTags = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  tags: type_pb.TTag[];
  paging?: type_pb.TPaging;
};
export type TRequestProject = {
  did: string;
  projectid: string;
  messageid: string;
};
export type TResponseGetProject = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  project?: type_pb.TProject;
};
export type TRequestGetProjects = {
  did: string;
  paging?: type_pb.TPaging;
  componentDid: string;
  tenantScope: string;
};
export type TResponseGetProjects = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  projects: type_pb.TProject[];
  paging?: type_pb.TPaging;
};
export type TRequestCreateProject = {
  did: string;
  type: enum_pb.PublishTypeMap[keyof enum_pb.PublishTypeMap];
  blockletDid: string;
  blockletTitle: string;
  componentDid: string;
  tenantScope: string;
};
export type TResponseProject = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  project?: type_pb.TProject;
};
export type TRequestUpdateProject = {
  did: string;
  projectid: string;
  blockletTitle: string;
  blockletDescription: string;
  blockletIntroduction: string;
  autoUpload: boolean;
  possibleSameStore: boolean;
  blockletSupport: string;
  blockletCommunity: string;
  blockletHomepage: string;
};
export type TRequestRelease = {
  did: string;
  projectId: string;
  releaseId: string;
};
export type TResponseGetRelease = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  release?: type_pb.TRelease;
};
export type TRequestGetReleases = {
  did: string;
  projectid: string;
  paging?: type_pb.TPaging;
};
export type TResponseGetReleases = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  releases: type_pb.TRelease[];
  paging?: type_pb.TPaging;
};
export type TRequestCreateRelease = {
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
  blockletDocker?: type_pb.TBlockletDocker;
  blockletSingleton: boolean;
};
export type TResponseRelease = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  release?: type_pb.TRelease;
};
export type TRequestConnectToStore = {
  did: string;
  storeId: string;
  storeUrl: string;
  storeName: string;
  projectId: string;
};
export type TResponseConnectToStore = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  url: string;
};
export type TRequestDisconnectFromStore = {
  did: string;
  storeId: string;
  projectId: string;
  storeScope: string;
};
export type TResponseDisconnectFromStore = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
};
export type TRequestConnectByStudio = {
  did: string;
  storeId: string;
  storeUrl: string;
  storeName: string;
  blockletTitle: string;
  type: string;
  tenantScope: string;
  componentDid: string;
  messageId: string;
};
export type TResponseConnectByStudio = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  url: string;
};
export type TRequestPublishToStore = {
  did: string;
  projectId: string;
  releaseId: string;
  type: string;
  storeId: string;
};
export type TResponsePublishToStore = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  url: string;
};
export type TRequestGetSelectedResources = {
  did: string;
  projectId: string;
  releaseId: string;
  componentDid: string;
};
export type TResponseGetSelectedResources = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  resources: string[];
};
export type TRequestUpdateSelectedResources = {
  did: string;
  projectId: string;
  releaseId: string;
  componentDid: string;
  resources: string[];
};
export type TResponseBlockletSecurityRule = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  securityRule?: type_pb.TBlockletSecurityRule;
};
export type TResponseBlockletSecurityRules = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  securityRules: type_pb.TBlockletSecurityRule[];
  paging?: type_pb.TPaging;
};
export type TRequestGetBlockletSecurityRule = {
  did: string;
  id: string;
};
export type TRequestGetBlockletSecurityRules = {
  did: string;
  paging?: type_pb.TPaging;
  query?: type_pb.TBlockletSecurityRuleQuery;
  includeDisabled: boolean;
};
export type TRequestAddBlockletSecurityRule = {
  did: string;
  data?: type_pb.TBlockletSecurityRule;
};
export type TRequestUpdateBlockletSecurityRule = {
  did: string;
  data?: type_pb.TBlockletSecurityRule;
};
export type TRequestDeleteBlockletSecurityRule = {
  did: string;
  id: string;
};
export type TResponseBlockletResponseHeaderPolicy = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  responseHeaderPolicy?: type_pb.TBlockletResponseHeaderPolicy;
};
export type TResponseBlockletResponseHeaderPolicies = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  responseHeaderPolicies: type_pb.TBlockletResponseHeaderPolicy[];
  paging?: type_pb.TPaging;
};
export type TRequestGetBlockletResponseHeaderPolicy = {
  did: string;
  id: string;
};
export type TRequestGetBlockletResponseHeaderPolicies = {
  did: string;
  paging?: type_pb.TPaging;
  query?: type_pb.TBlockletResponseHeaderPolicyQuery;
};
export type TRequestAddBlockletResponseHeaderPolicy = {
  did: string;
  data?: type_pb.TBlockletResponseHeaderPolicy;
};
export type TRequestUpdateBlockletResponseHeaderPolicy = {
  did: string;
  data?: type_pb.TBlockletResponseHeaderPolicy;
};
export type TRequestDeleteBlockletResponseHeaderPolicy = {
  did: string;
  id: string;
};
export type TResponseBlockletAccessPolicy = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  accessPolicy?: type_pb.TBlockletAccessPolicy;
};
export type TResponseBlockletAccessPolicies = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  accessPolicies: type_pb.TBlockletAccessPolicy[];
  paging?: type_pb.TPaging;
};
export type TRequestGetBlockletAccessPolicy = {
  did: string;
  id: string;
};
export type TRequestGetBlockletAccessPolicies = {
  did: string;
  paging?: type_pb.TPaging;
  query?: type_pb.TBlockletAccessPolicyQuery;
};
export type TRequestAddBlockletAccessPolicy = {
  did: string;
  data?: type_pb.TBlockletAccessPolicy;
};
export type TRequestUpdateBlockletAccessPolicy = {
  did: string;
  data?: type_pb.TBlockletAccessPolicy;
};
export type TRequestDeleteBlockletAccessPolicy = {
  did: string;
  id: string;
};
export type TRequestRotateSessionKey = {
  teamDid: string;
  sessionId: string;
};
export type TRequestConfigVault = {
  teamDid: string;
  vaultDid: string;
  sessionId: string;
};
export type TResponseConfigVault = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  sessionId: string;
};
export type TRequestGetWebhookEndpoints = {
  teamDid: string;
  paging?: type_pb.TPaging;
};
export type TResponseGetWebhookEndpoints = {
  list: type_pb.TWebhookEndpointWithUserInfo[];
  paging?: type_pb.TPaging;
};
export type TRequestCreateWebhookEndpoint = {
  teamDid: string;
  input?: type_pb.TWebhookEndpointState;
};
export type TResponseCreateWebhookEndpoint = {
  data?: type_pb.TWebhookEndpointState;
};
export type TRequestGetWebhookEndpoint = {
  teamDid: string;
  id: string;
};
export type TResponseGetWebhookEndpoint = {
  data?: type_pb.TWebhookEndpointWithUserInfo;
};
export type TRequestUpdateWebhookEndpoint = {
  teamDid: string;
  id: string;
  data?: type_pb.TWebhookEndpointState;
};
export type TResponseUpdateWebhookEndpoint = {
  data?: type_pb.TWebhookEndpointState;
};
export type TRequestDeleteWebhookEndpoint = {
  teamDid: string;
  id: string;
};
export type TResponseDeleteWebhookEndpoint = {
  data?: type_pb.TWebhookEndpointState;
};
export type TRequestAttemptId = {
  eventId: string;
  webhookId: string;
};
export type TRequestGetWebhookAttempts = {
  teamDid: string;
  input?: TRequestAttemptId;
  paging?: type_pb.TPaging;
};
export type TRequestAttempt = {
  eventId: string;
  webhookId: string;
  attemptId: string;
  teamDid: string;
};
export type TRequestUpdateWebHookState = {
  id: string;
  url: string;
  enabled: boolean;
  consecutiveFailures: number;
};
export type TResponseGetWebhookAttempts = {
  list: type_pb.TWebhookAttemptWithEndpointEventState[];
  paging?: type_pb.TPaging;
};
export type TResponseGetWebhookAttempt = {
  data?: type_pb.TWebhookAttemptState;
};
export type TRequestRegenerateWebhookEndpointSecret = {
  teamDid: string;
  id: string;
};
export type TResponseRegenerateWebhookEndpointSecret = {
  secret: string;
};
export type TRequestGetBlockletBackupSummary = {
  did: string;
  startTime: string;
  endTime: string;
};
export type TBackupSummaryItem = {
  date: string;
  successCount: number;
  errorCount: number;
};
export type TResponseGetBlockletBackupSummary = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  summary: TBackupSummaryItem[];
};
export type TResponseGetPassportCountPerRole = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  counts: type_pb.TKeyValue[];
};
export type TRequestPassport = {
  teamDid: string;
  query?: type_pb.TPassportQuery;
  paging?: type_pb.TPaging;
};
export type TResponsePassport = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  passports: type_pb.TPassport[];
  paging?: type_pb.TPaging;
};
export type TRequestPassportLog = {
  teamDid: string;
  query?: type_pb.TPassportLogQuery;
  paging?: type_pb.TPaging;
};
export type TResponsePassportLog = {
  passportlogs: type_pb.TPassportLogState[];
  paging?: type_pb.TPaging;
};
export type TRequestRelatedPassports = {
  teamDid: string;
  passportId: string;
  paging?: type_pb.TPaging;
};
export type TBlockletUsers = {
  users: number;
  approvedUsers: number;
};
export type TBlockletPassport = {
  passports: number;
  activePassports: number;
};
export type TBlockletTraffic = {
  totalRequests: number;
  failedRequests: number;
};
export type TBlockletIntegrations = {
  webhooks: number;
  accessKeys: number;
  oauthApps: number;
};
export type TBlockletStudio = {
  blocklets: number;
  releases: number;
};
export type TResponseBlockletInfo = {
  user?: TBlockletUsers;
  passport?: TBlockletPassport;
  backup?: type_pb.TBackup;
  appruntimeinfo?: type_pb.TRuntimeInfo;
  traffic?: TBlockletTraffic;
  integrations?: TBlockletIntegrations;
  studio?: TBlockletStudio;
};
export type TRequestAddUploadEndpoint = {
  teamDid: string;
  url: string;
  scope: string;
};
export type TRequestDeleteUploadEndpoint = {
  teamDid: string;
  did: string;
  scope: string;
  projectId: string;
};
export type TRequestConnectToEndpoint = {
  did: string;
  endpointId: string;
  projectId: string;
};
export type TRequestConnectToAigne = {
  did: string;
  baseUrl: string;
  provider: string;
  model: string;
};
export type TRequestDisconnectToAigne = {
  did: string;
  url: string;
  key: string;
};
export type TRequestVerifyAigneConnection = {
  did: string;
};
export type TResponseConnectToEndpoint = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  url: string;
};
export type TRequestDisconnectFromEndpoint = {
  did: string;
  endpointId: string;
  projectId: string;
};
export type TRequestPublishToEndpoint = {
  did: string;
  endpointId: string;
  projectId: string;
  releaseId: string;
};
export type TResponsePublishToEndpoint = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  url: string;
};
export type TRequestDomainDNS = {
  teamDid: string;
  domain: string;
};
export type TResponseDomainDNS = {
  isDnsResolved: boolean;
  hasCname: boolean;
  isCnameMatch: boolean;
  error: string;
};
export type TResponseOAuthClients = {
  list: type_pb.TOauthClient[];
};
export type TRequestDeleteOAuthClient = {
  teamDid: string;
  clientId: string;
};
export type TRequestOAuthClient = {
  teamDid: string;
  input?: type_pb.TOauthClient;
};
export type TResponseOAuthClient = {
  data?: type_pb.TOauthClient;
};
export type TRequestGetOrgsOptions = {
  includeMembers: boolean;
  includePassports: boolean;
};
export type TRequestGetOrgs = {
  teamDid: string;
  org?: type_pb.TOrg;
  paging?: type_pb.TPaging;
  type: enum_pb.OrgQueryTypeMap[keyof enum_pb.OrgQueryTypeMap];
  userDid: string;
  options?: TRequestGetOrgsOptions;
};
export type TResponseGetOrgs = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  orgs: type_pb.TOrg[];
  paging?: type_pb.TPaging;
};
export type TRequestGetOrg = {
  teamDid: string;
  id: string;
};
export type TResponseGetOrg = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  org?: type_pb.TOrg;
};
export type TRequestGetOrgData = {
  teamDid: string;
  orgId: string;
  paging?: type_pb.TPaging;
};
export type TRequestCreateOrg = {
  teamDid: string;
  name: string;
  description: string;
  ownerDid: string;
  deferPassport: boolean;
};
export type TRequestUpdateOrg = {
  teamDid: string;
  org?: type_pb.TOrg;
};
export type TRequestInvitableUsers = {
  teamDid: string;
  id: string;
  query?: type_pb.TUserQuery;
};
export type TRequestGetOrgMember = {
  teamDid: string;
  orgId: string;
  userDid: string;
};
export type TResponseOrgUsers = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  users: type_pb.TUserOrg[];
  paging?: type_pb.TPaging;
};
export type TRequestInviteMembersToOrg = {
  teamDid: string;
  orgId: string;
  userDids: string[];
  role: string;
  inviteType: string;
  email: string;
};
export type TInviteResult = {
  successDids: string[];
  failedDids: string[];
  invitelink: string;
};
export type TResponseInviteMembersToOrg = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: TInviteResult;
};
export type TRequestGetOrgResource = {
  teamDid: string;
  orgId: string;
  resourceId: string;
};
export type TResponseGetOrgResource = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data: type_pb.TOrgResources[];
};
export type TRequestAddOrgResource = {
  teamDid: string;
  orgId: string;
  resourceIds: string[];
  type: string;
  metadata?: Record<string, any>;
};
export type TRequestMigrateOrgResource = {
  teamDid: string;
  from: string;
  to: string;
  resourceIds: string[];
};
export type TOrgResourceResult = {
  success: string[];
  failed: string[];
};
export type TResponseOrgResourceOperation = {
  code: enum_pb.StatusCodeMap[keyof enum_pb.StatusCodeMap];
  data?: TOrgResourceResult;
};
