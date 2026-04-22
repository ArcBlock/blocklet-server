// package: abt_node
// file: type.proto
import * as enum_pb from './enum_pb';
export type TNodeState = {
  did: string;
  pk: string;
  version: string;
  name: string;
  description: string;
  port: string;
  initialized: boolean;
  nodeOwner?: TWalletInfo;
  createdAt: number;
  startedAt: number;
  initializedAt: number;
  mode: string;
  routing?: TNodeRouting;
  environments: TConfigEntry[];
  uptime: number;
  autoUpgrade: boolean;
  nextVersion: string;
  upgradeSessionId: string;
  registerUrl: string;
  enableWelcomePage: boolean;
  webWalletUrl: string;
  blockletRegistryList: TBlockletStore[];
  ownerNft?: TOwnerNft;
  diskAlertThreshold: number;
  trustedPassports: TTrustedPassport[];
  launcher?: TLauncherInfo;
  enablePassportIssuance: boolean;
  didRegistry: string;
  didDomain: string;
  status: number;
  trustedFactories: TTrustedFactory[];
  enableBetaRelease: boolean;
  runtimeConfig?: TNodeRuntimeConfig;
  nftDomainUrl: string;
  enableFileSystemIsolation: boolean;
  enableDocker: boolean;
  isDockerInstalled: boolean;
  enableDockerNetwork: boolean;
  enableSessionHardening: boolean;
  sessionSalt: string;
};
export type TOwnerNft = {
  did: string;
  holder: string;
  issuer: string;
  launcherSessionId: string;
};
export type TNodeRouting = {
  provider: string;
  snapshotHash: string;
  adminPath: string;
  requestLimit?: TRequestLimit;
  cacheEnabled: boolean;
  blockPolicy?: TBlockPolicy;
  proxyPolicy?: TProxyPolicy;
  wafPolicy?: TWAFPolicy;
};
export type TNodeInfo = {
  name: string;
  description: string;
  autoUpgrade: boolean;
  enableWelcomePage: boolean;
  registerUrl: string;
  webWalletUrl: string;
  blockletRegistryList: TBlockletStore[];
  diskAlertThreshold: number;
  enableBetaRelease: boolean;
  nftDomainUrl: string;
  enableFileSystemIsolation: boolean;
  enableDocker: boolean;
  isDockerInstalled: boolean;
  enableDockerNetwork: boolean;
  enableSessionHardening: boolean;
};
export type TConnectedStore = {
  storeId: string;
  storeName: string;
  storeUrl: string;
  accessToken: string;
  developerDid: string;
  developerEmail: string;
  developerName: string;
  scope: string;
};
export type TBlockletStore = {
  name: string;
  description: string;
  url: string;
  logoUrl: string;
  maintainer: string;
  cdnUrl: string;
  pb_protected: boolean;
  id: string;
  scope: string;
};
export type TNodeEnvInfo = {
  ip?: TIPInfo;
  os: string;
  location: string;
  docker: boolean;
  image: boolean;
  blockletEngines: TBlockletEngine[];
  gitpod: boolean;
  disk?: TDiskInfo;
  dbProvider: string;
  routerProvider: string;
};
export type TNodeHistoryItem = {
  date: number;
  cpu: number;
  mem: number;
  daemonMem: number;
  serviceMem: number;
  hubMem: number;
};
export type TChildConfig = {
  name: string;
  mountPoint: string;
  required: boolean;
};
export type TBlockletDockerMeta = {
  image: string;
  shell: string;
  runBaseScript: boolean;
  installNodeModules: boolean;
};
export type TBlockletMeta = {
  did: string;
  name: string;
  version: string;
  description: string;
  interfaces: TBlockletMetaInterface[];
  author?: TBlockletMetaPerson;
  main: string;
  stats?: TBlockletStats;
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
  dist?: TBlockletDist;
  maintainers: TBlockletMetaPerson[];
  contributors: TBlockletMetaPerson[];
  repository?: TBlockletRepository;
  payment?: TBlockletPayment;
  nftFactory: string;
  lastPublishedAt: number;
  capabilities?: TBlockletCapabilities;
  components: TChildConfig[];
  environments: TEnvironment[];
  requirements?: TRequirement;
  bundleDid: string;
  bundleName: string;
  navigation: Record<string, any>[];
  resources: string[];
  resource?: TBlockletResource;
  engine?: Record<string, any>;
  owner?: TBlockletMetaOwner;
  docker?: TBlockletDockerMeta;
  events: TBlockletEvent[];
};
export type TBlockletEvent = {
  type: string;
  description: string;
};
export type TSimpleBlockletMeta = {
  did: string;
  name: string;
  version: string;
  description: string;
  title: string;
  bundleDid: string;
  bundleName: string;
};
export type TOptionalDependencies = {
  parentDid: string;
  parentName: string;
  parentTitle: string;
  mountPoint: string;
  required: boolean;
};
export type TOptionalComponentState = {
  logoUrl: string;
  dependencies: TOptionalDependencies[];
  meta?: TBlockletMeta;
  bundleSource?: Record<string, any>;
};
export type TBlockletRepository = {
  type: string;
  url: string;
};
export type TBlockletCapabilities = {
  clusterMode: boolean;
  component: boolean;
  navigation: boolean;
  didSpace: string;
  resourceExportApi: string;
};
export type TBlockletPayment = {
  price: TBlockletPaymentPrice[];
  share: TBlockletPaymentShare[];
};
export type TBlockletPaymentPrice = {
  address: string;
  value: string;
  symbol: string;
};
export type TBlockletPaymentShare = {
  address: string;
  name: string;
  value: string;
};
export type TBlockletMetaInterface = {
  type: string;
  name: string;
  path: string;
  prefix: string;
  protocol: string;
  port?: Record<string, any>;
  services: TBlockletMetaService[];
  cacheable: string[];
  pageGroups: string[];
};
export type TBlockletMetaPerson = {
  name: string;
  email: string;
  url: string;
};
export type TBlockletMetaOwner = {
  avatar: string;
  did: string;
  email: string;
  fullname: string;
};
export type TBlockletDist = {
  tarball: string;
  integrity: string;
};
export type TUpdateList = {
  id: string;
  meta?: TBlockletMeta;
};
export type TBlockletPreUpdateInfo = {
  updateId: string;
  updateList: TUpdateList[];
};
export type TBlockletStats = {
  downloads: number;
  star: number;
  purchases: number;
};
export type TBlockletEngine = {
  name: string;
  displayName: string;
  description: string;
  version: string;
  available: boolean;
  visible: boolean;
  logo: string;
};
export type TBlockletExposeService = {
  protocol: string;
  port: number;
  upstreamPort: number;
};
export type TBlockletControllerStatus = {
  value: number;
  reason: string;
};
export type TBlockletController = {
  id: string;
  nftId: string;
  nftOwner: string;
  chainHost: string;
  expireDate: number;
  consumedAt: string;
  launcherUrl: string;
  launcherSessionId: string;
  ownerDid: string;
  status?: TBlockletControllerStatus;
};
export type TBlockletMigrateRecord = {
  appSk: string;
  appDid: string;
  at: string;
};
export type TBlockletVaultRecord = {
  pk: string;
  did: string;
  at: number;
  sig: string;
  approverSig: string;
  approverDid: string;
  approverPk: string;
};
export type TBlockletState = {
  meta?: TBlockletMeta;
  status: enum_pb.BlockletStatusMap[keyof enum_pb.BlockletStatusMap];
  createdAt: number;
  installedAt: number;
  startedAt: number;
  pausedAt: number;
  stoppedAt: number;
  updatedAt: number;
  environments: TConfigEntry[];
  configs: TConfigEntry[];
  diskInfo?: TDiskInfo;
  runtimeInfo?: TRuntimeInfo;
  appRuntimeInfo?: TRuntimeInfo;
  source: enum_pb.BlockletSourceMap[keyof enum_pb.BlockletSourceMap];
  deployedFrom: string;
  bundleSource?: Record<string, any>;
  port: number;
  engine?: TBlockletEngine;
  mode: string;
  ports?: Record<string, any>;
  children: TComponentState[];
  optionalComponents: TOptionalComponentState[];
  trustedPassports: TTrustedPassport[];
  trustedFactories: TTrustedFactory[];
  enablePassportIssuance: boolean;
  dynamic: boolean;
  mountPoint: string;
  settings?: TBlockletSettings;
  appDid: string;
  site?: TRoutingSite;
  controller?: TBlockletController;
  migratedFrom: TBlockletMigrateRecord[];
  appPid: string;
  externalSk: boolean;
  externalSkSource: string;
  structVersion: string;
  enableDocker: boolean;
  enableDockerNetwork: boolean;
  vaults: TBlockletVaultRecord[];
};
export type TBlockletExtra = {
  did: string;
  appDid: string;
  meta?: TSimpleBlockletMeta;
  configs: TConfigEntry[];
  children: TChildExtraConfigs[];
  settings?: TBlockletSettings;
};
export type TChildExtraConfigs = {
  did: string;
  configs: TConfigEntry[];
};
export type TComponentState = {
  meta?: TBlockletMeta;
  status: enum_pb.BlockletStatusMap[keyof enum_pb.BlockletStatusMap];
  createdAt: number;
  installedAt: number;
  startedAt: number;
  pausedAt: number;
  stoppedAt: number;
  environments: TConfigEntry[];
  configs: TConfigEntry[];
  diskInfo?: TDiskInfo;
  runtimeInfo?: TRuntimeInfo;
  source: enum_pb.BlockletSourceMap[keyof enum_pb.BlockletSourceMap];
  deployedFrom: string;
  bundleSource?: Record<string, any>;
  port: number;
  engine?: TBlockletEngine;
  mode: string;
  ports?: Record<string, any>;
  children: TComponentState[];
  dynamic: boolean;
  mountPoint: string;
  dependents: TDependent[];
  required: boolean;
  appRuntimeInfo?: TRuntimeInfo;
  greenStatus: enum_pb.BlockletStatusMap[keyof enum_pb.BlockletStatusMap];
};
export type TSimpleBlockletState = {
  meta?: TSimpleBlockletMeta;
  status: enum_pb.BlockletStatusMap[keyof enum_pb.BlockletStatusMap];
  deployedFrom: string;
  mountPoint: string;
  deletedAt: number;
};
export type TConnectEndpoint = {
  id: string;
  scope: string;
  url: string;
  endpoint: string;
  pb_protected: boolean;
  appName: string;
  appDescription: string;
};
export type TBlockletSettings = {
  initialized: boolean;
  enablePassportIssuance: boolean;
  trustedPassports: TTrustedPassport[];
  whoCanAccess: string;
  owner?: TWalletInfo;
  children: TSimpleBlockletState[];
  publicToStore: boolean;
  storeList: TBlockletStore[];
  navigations: TConfigNavigation[];
  authentication?: Record<string, any>;
  trustedFactories: TTrustedFactory[];
  notification?: Record<string, any>;
  session?: TSessionConfig;
  federated?: TFederatedConfig;
  autoCheckUpdate?: TAutoCheckUpdate;
  autoBackup?: TAutoBackup;
  invite?: TInviteSettings;
  theme?: Record<string, any>;
  endpointList: TConnectEndpoint[];
  gateway?: TGateway;
  enableSessionHardening: boolean;
  aigne?: TAigneConfig;
  org?: TOrgSettings;
  didConnect?: Record<string, any>;
  oauth?: Record<string, any>;
  actionConfig?: Record<string, any>;
  subService?: TSubServiceConfig;
};
export type TBlockletMetaService = {
  name: string;
  config?: Record<string, any>;
};
export type TBlockletVersion = {
  version: string;
  publishedAt: number;
};
export type TBlockletBackupState = {
  appDid: string;
  appPid: string;
  name: string;
  createdAt: number;
};
export type TBlockletDiff = {
  hasBlocklet: boolean;
  version: string;
  addSet: string[];
  changeSet: string[];
  deleteSet: string[];
};
export type TConfigEntry = {
  key: string;
  value: string;
  required: boolean;
  description: string;
  validation: string;
  secure: boolean;
  custom: boolean;
  shared: boolean;
};
export type TConfigNavigation = {
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
  pb_private: boolean;
};
export type TEnvironment = {
  name: string;
  description: string;
  pb_default: string;
  required: boolean;
  secure: boolean;
  validation: string;
  shared: boolean;
};
export type TRequirement = {
  server: string;
  os?: Record<string, any>;
  cpu?: Record<string, any>;
  fuels: TFuel[];
  aigne: boolean;
};
export type TFuel = {
  endpoint: string;
  address: string;
  value: string;
  reason: string;
};
export type TWalletInfo = {
  did: string;
  pk: string;
};
export type TDiskInfo = {
  app: number;
  data: number;
  log: number;
  cache: number;
  blocklets: number;
};
export type TRuntimeInfo = {
  pid: string;
  port: string;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  runningDocker: boolean;
  cpus?: Record<string, any>;
};
export type THashFile = {
  file: string;
  hash: string;
};
export type TBlockletHistoryItem = {
  date: number;
  cpu: number;
  mem: number;
};
export type TTUTM = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
};
export type TNotificationAttachment = {
  data?: Record<string, any>;
  fields?: Record<string, any>;
  type: enum_pb.NotificationAttachmentTypeMap[keyof enum_pb.NotificationAttachmentTypeMap];
};
export type TNotificationAction = {
  bgcolor: string;
  color: string;
  link: string;
  name: string;
  title: string;
  utm?: TTUTM;
};
export type TStatistics = {
  total: number;
  pending: number;
  success: number;
  failed: number;
};
export type TWebhookStatistics = {
  total: number;
  pending: string[];
  success: string[];
  failed: string[];
};
export type TNotificationStatistics = {
  total: number;
  wallet?: TStatistics;
  push?: TStatistics;
  email?: TStatistics;
  webhook?: TWebhookStatistics;
};
export type TNotificationActivity = {
  type: NotificationActivity.ActivityTypeEnumMap[keyof NotificationActivity.ActivityTypeEnumMap];
  actor: string;
  target?: Record<string, any>;
  meta?: Record<string, any>;
};
export interface ActivityTypeEnumMap {
  COMMENT: 0;
  LIKE: 1;
  FOLLOW: 2;
  TIPS: 3;
  MENTION: 4;
  ASSIGN: 5;
  UN_ASSIGN: 6;
}
export type TNotification = {
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
  severity: Notification.NotificationSeverityMap[keyof Notification.NotificationSeverityMap];
  source: Notification.NotificationSourceMap[keyof Notification.NotificationSourceMap];
  attachments: TNotificationAttachment[];
  blocks: TNotificationAttachment[];
  actions: TNotificationAction[];
  componentDid: string;
  type: Notification.NotificationTypeMap[keyof Notification.NotificationTypeMap];
  receivers: TNotificationReceiver[];
  data?: Record<string, any>;
  feedType: string;
  statistics?: TNotificationStatistics;
  activity?: TNotificationActivity;
  actorInfo?: TUserInfo;
  options?: Record<string, any>;
  utm?: TTUTM;
};
export interface NotificationSourceMap {
  SYSTEM: 0;
  COMPONENT: 1;
}
export interface NotificationTypeMap {
  NOTIFICATION: 0;
  CONNECT: 1;
  FEED: 2;
  HI: 3;
  PASSTHROUGH: 4;
}
export interface NotificationSeverityMap {
  INFO: 0;
  SUCCESS: 1;
  ERROR: 2;
  WARNING: 3;
}
export type TNotificationSendRecord = {
  sendStatus: number;
  sendAt: number;
  failedReason: string;
};
export type TNotificationReceiver = {
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
  receiverUser?: TUserInfo;
  walletSendFailedReason: string;
  walletSendRecord: TNotificationSendRecord[];
  pushKitSendFailedReason: string;
  pushKitSendRecord: TNotificationSendRecord[];
  emailSendFailedReason: string;
  emailSendRecord: TNotificationSendRecord[];
  webhook?: Record<string, any>;
  email: string;
  webhookUrls: string;
  deviceId: string;
};
export type TRoutingRuleResponse = {
  status: number;
  contentType: string;
  body: string;
};
export type TRoutingRuleTo = {
  port: number;
  type: enum_pb.BackendServiceTypeMap[keyof enum_pb.BackendServiceTypeMap];
  did: string;
  url: string;
  redirectCode: number;
  interfaceName: string;
  componentId: string;
  pageGroup: string;
  response?: TRoutingRuleResponse;
};
export type TRoutingRuleFrom = {
  pathPrefix: string;
  header: TRoutingRuleHeader[];
};
export type TRoutingRule = {
  id: string;
  from?: TRoutingRuleFrom;
  to?: TRoutingRuleTo;
  isProtected: boolean;
};
export type TRoutingSite = {
  id: string;
  domain: string;
  domainAliases: Record<string, any>[];
  rules: TRoutingRule[];
  isProtected: boolean;
  corsAllowedOrigins: string[];
};
export type TRoutingRuleHeader = {
  key: string;
  value: string;
  type: enum_pb.HeaderMatchTypeMap[keyof enum_pb.HeaderMatchTypeMap];
};
export type TRoutingProvider = {
  name: string;
  description: string;
  running: boolean;
  available: boolean;
  error: string;
};
export type TCertificate = {
  name: string;
  domain: string;
  id: string;
  meta?: TCertificateMeta;
  matchedSites: TMatchedSites[];
  createdAt: number;
  updatedAt: number;
  isProtected: boolean;
  source: string;
  status: string;
};
export type TCertificateMeta = {
  issuer?: TCertificateIssuer;
  sans: string[];
  validFrom: number;
  validTo: number;
  fingerprintAlg: string;
  fingerprint: string;
  validityPeriod: number;
};
export type TMatchedSites = {
  id: string;
  domain: string;
};
export type TCertificateIssuer = {
  countryName: string;
  organizationName: string;
  commonName: string;
};
export type TAccessKey = {
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
};
export type TCreateAccessKey = {
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
};
export type TWebHookSender = {
  type: enum_pb.SenderTypeMap[keyof enum_pb.SenderTypeMap];
  title: string;
  description: string;
  params: TWebHookParam[];
};
export type TWebHook = {
  type: enum_pb.SenderTypeMap[keyof enum_pb.SenderTypeMap];
  id: string;
  params: TWebHookParam[];
  createdAt: number;
  updatedAt: number;
};
export type TWebHookParam = {
  name: string;
  description: string;
  required: boolean;
  defaultValue: string;
  value: string;
  type: string;
  enabled: boolean;
  consecutiveFailures: number;
};
export type TTag = {
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
};
export type TTagging = {
  tagId: number;
  taggableType: string;
  taggableIds: string[];
};
export type TTeam = {
  teamDid: string;
  paging?: TPaging;
};
export type TInviteInfo = {
  inviteId: string;
  role: string;
  remark: string;
  expireDate: string;
  inviter?: TUserInfo;
  teamDid: string;
  interfaceName: string;
  display?: TPassportDisplay;
  orgId: string;
  inviteUserDids: string[];
};
export type TConnectedAccountInfo = {
  name: string;
  picture: string;
  email: string;
  emailVerified: boolean;
  sub: string;
  extraData?: Record<string, any>;
};
export type TConnectedAccount = {
  provider: string;
  did: string;
  pk: string;
  id: string;
  lastLoginAt: number;
  userInfo?: TConnectedAccountInfo;
  extra?: Record<string, any>;
};
export type TUserMetadataLink = {
  url: string;
  favicon: string;
};
export type TUserMetadataStatus = {
  label: string;
  icon: string;
  duration: string;
  dateRange: number[];
};
export type TUserPhoneInfo = {
  country: string;
  phoneNumber: string;
};
export type TUserMetadata = {
  bio: string;
  location: string;
  timezone: string;
  cover: string;
  links: TUserMetadataLink[];
  status?: TUserMetadataStatus;
  phone?: TUserPhoneInfo;
};
export type TUserAddress = {
  country: string;
  province: string;
  city: string;
  postalCode: string;
  line1: string;
  line2: string;
};
export type TSimpleUserInfo = {
  did: string;
  avatar: string;
  fullName: string;
};
export type TUserInfo = {
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
  passports: TPassport[];
  firstLoginAt: number;
  lastLoginAt: number;
  remark: string;
  lastLoginIp: string;
  sourceProvider: string;
  sourceAppPid: string;
  connectedAccounts: TConnectedAccount[];
  extra?: Record<string, any>;
  tags: TTag[];
  didSpace?: Record<string, any>;
  userSessions: TUserSession[];
  url: string;
  phone: string;
  inviter: string;
  generation: number;
  emailVerified: boolean;
  phoneVerified: boolean;
  metadata?: TUserMetadata;
  address?: TUserAddress;
  userSessionsCount: number;
  isFollowing: boolean;
  name: string;
  createdByAppPid: string;
};
export type TUserProfile = {
  did: string;
  avatar: string;
  fullName: string;
  email: string;
};
export type TRelationshipType = {
  type: enum_pb.UserRelationTypeMap[keyof enum_pb.UserRelationTypeMap];
  userDid: string;
};
export type TUserQuery = {
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
};
export type TUserSort = {
  updatedAt: number;
  createdAt: number;
  lastLoginAt: number;
};
export type TUserSessionSort = {
  updatedAt: number;
  createdAt: number;
};
export type TUserSessionQuery = {
  userDid: string;
  visitorId: string;
  appPid: string;
  status: string;
  includeUser: boolean;
  createdByAppPid: string;
};
export type TUserSession = {
  id: string;
  visitorId: string;
  appPid: string;
  userDid: string;
  ua: string;
  passportId: string;
  status: string;
  lastLoginIp: string;
  extra?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  createdByAppPid: string;
};
export type TBlockletQuery = {};
export type TRole = {
  name: string;
  description: string;
  grants: string[];
  title: string;
  isProtected: boolean;
  extra?: Record<string, any>;
  orgId: string;
};
export type TRoleAcquire = {
  pay: string;
  exchange: string;
  invite: boolean;
  transfer: boolean;
  request: boolean;
};
export type TRoleUpdate = {
  name: string;
  title: string;
  description: string;
  extra: string;
};
export type TPermission = {
  name: string;
  description: string;
  isProtected: boolean;
};
export type TPassportDisplay = {
  type: string;
  content: string;
};
export type TIssuer = {
  id: string;
  name: string;
  pk: string;
};
export type TPassportIssuanceInfo = {
  id: string;
  name: string;
  title: string;
  expireDate: string;
  teamDid: string;
  ownerDid: string;
  display?: TPassportDisplay;
};
export type TTrustedPassport = {
  issuerDid: string;
  remark: string;
  mappings: TTrustedPassportMapping[];
};
export type TTrustedFactory = {
  holderDid: string;
  issuerDid: string;
  factoryAddress: string;
  remark: string;
  passport?: TTrustedPassportMappingTo;
};
export type TTrustedPassportMapping = {
  from?: TTrustedPassportMappingFrom;
  to?: TTrustedPassportMappingTo;
};
export type TTrustedPassportMappingFrom = {
  passport: string;
};
export type TTrustedPassportMappingTo = {
  role: string;
  ttl: string;
  ttlPolicy: string;
};
export type TIPInfo = {
  internalV4: string;
  externalV4: string;
  internalV6: string;
  externalV6: string;
};
export type TLauncherInfo = {
  did: string;
  type: string;
  provider: string;
  url: string;
  tag: string;
  chainHost: string;
};
export type TPaging = {
  total: number;
  pageSize: number;
  pageCount: number;
  page: number;
};
export type TSort = {
  field: string;
  direction: string;
};
export type TAuditLogActor = {
  did: string;
  role: string;
  fullName: string;
  avatar: string;
  source: string;
};
export type TAuditLogEnvItem = {
  name: string;
  version: string;
};
export type TAuditLogEnv = {
  browser?: TAuditLogEnvItem;
  os?: TAuditLogEnvItem;
};
export type TAuditLog = {
  id: string;
  scope: string;
  category: string;
  action: string;
  content: string;
  actor?: TAuditLogActor;
  env?: TAuditLogEnv;
  createdAt: number;
  ip: string;
  ua: string;
  componentDid: string;
};
export type TRequestLimit = {
  enabled: boolean;
  global: number;
  burstFactor: number;
  burstDelay: number;
  rate: number;
  methods: string[];
};
export type TAutoBlockPolicy = {
  enabled: boolean;
  windowSize: number;
  windowQuota: number;
  blockDuration: number;
  statusCodes: number[];
};
export type TBlockPolicy = {
  enabled: boolean;
  blacklist: string[];
  autoBlocking?: TAutoBlockPolicy;
};
export type TProxyPolicy = {
  enabled: boolean;
  trustRecursive: boolean;
  trustedProxies: string[];
  realIpHeader: string;
};
export type TWAFPolicy = {
  enabled: boolean;
  mode: string;
  inboundAnomalyScoreThreshold: number;
  outboundAnomalyScoreThreshold: number;
  logLevel: number;
};
export type TGateway = {
  requestLimit?: TRequestLimit;
  blockPolicy?: TBlockPolicy;
  proxyPolicy?: TProxyPolicy;
  cacheEnabled: boolean;
  wafPolicy?: TWAFPolicy;
};
export type TBlockletGateway = {
  requestLimit?: TRequestLimit;
  blockPolicy?: TBlockPolicy;
  proxyPolicy?: TProxyPolicy;
  cacheEnabled: boolean;
  wafPolicy?: TWAFPolicy;
  teamDid: string;
};
export type TAigneConfig = {
  provider: string;
  model: string;
  key: string;
  url: string;
  accessKeyId: string;
  secretAccessKey: string;
  validationResult: string;
};
export type TDelegationState = {
  delegated: boolean;
};
export type TKeyValue = {
  key: string;
  value?: Record<string, any>;
};
export type TDownloadToken = {
  did: string;
  token: string;
};
export type TDependent = {
  id: string;
  required: boolean;
};
export type TMigration = {
  script: string;
  version: string;
  executedAt: number;
  createdAt: number;
  updatedAt: number;
};
export type TSpaceGateway = {
  name: string;
  url: string;
  pb_protected: string;
  endpoint: string;
  did: string;
};
export type TBackup = {
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
  metadata?: Record<string, any>;
};
export type TAutoBackup = {
  enabled: boolean;
};
export type TAutoCheckUpdate = {
  enabled: boolean;
};
export type TInviteSettings = {
  enabled: boolean;
};
export type TOrgSettings = {
  enabled: boolean;
  maxMemberPerOrg: number;
  maxOrgPerUser: number;
};
export type TSubServiceConfig = {
  enabled: boolean;
  domain: string;
  staticRoot: string;
};
export type TLoginEmailSettings = {
  enabled: boolean;
  requireVerified: boolean;
  requireUnique: boolean;
  trustOauthProviders: boolean;
  enableDomainBlackList: boolean;
  domainBlackList: string[];
  enableDomainWhiteList: boolean;
  domainWhiteList: string[];
  trustedIssuers: TIssuer[];
};
export type TLoginPhoneSettings = {
  enabled: boolean;
  requireVerified: boolean;
  requireUnique: boolean;
  trustedIssuers: TIssuer[];
  enableRegionBlackList: boolean;
  regionBlackList: string[];
  enableRegionWhiteList: boolean;
  regionWhiteList: string[];
};
export type TSessionConfig = {
  cacheTtl: number;
  ttl: number;
  email?: TLoginEmailSettings;
  phone?: TLoginPhoneSettings;
  salt: string;
  enableBlacklist: boolean;
};
export type TFederatedConfigDetail = {
  appId: string;
  appPid: string;
  delegation: string;
  isMaster: boolean;
  autoLogin: boolean;
};
export type TFederatedConfigSite = {
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
};
export type TFederatedConfig = {
  config?: TFederatedConfigDetail;
  sites: TFederatedConfigSite[];
};
export type TTrafficInsight = {
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
};
export type TNodeRuntimeConfig = {
  blockletMaxMemoryLimit: number;
  daemonMaxMemoryLimit: number;
};
export type TConnectedEndpoint = {
  endpointId: string;
  accessKeyId: string;
  accessKeySecret: string;
  expireId: string;
  developerDid: string;
  developerName: string;
  developerEmail: string;
  createdBy: string;
};
export type TProject = {
  id: string;
  type: enum_pb.PublishTypeMap[keyof enum_pb.PublishTypeMap];
  blockletDid: string;
  blockletVersion: string;
  blockletTitle: string;
  blockletDescription: string;
  blockletLogo: string;
  blockletIntroduction: string;
  blockletScreenshots: string[];
  createdAt: string;
  updatedAt: string;
  componentdid: string;
  lastReleaseId: string;
  lastReleaseFiles: string[];
  connectedStores: TConnectedStore[];
  tenantScope: string;
  createdBy: string;
  autoUpload: boolean;
  possibleSameStore: boolean;
  connectedEndpoints: TConnectedEndpoint[];
};
export type TRelease = {
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
  status: enum_pb.ReleaseStatusMap[keyof enum_pb.ReleaseStatusMap];
  createdAt: string;
  updatedAt: string;
  blockletComponents: TReleaseComponent[];
  publishedStoreIds: string[];
  uploadedResource: string;
  blockletResourceType: string;
  blockletSupport: string;
  blockletCommunity: string;
  blockletHomepage: string;
  blockletVideos: string[];
  blockletRepository: string;
  contentType: string;
  blockletDocker?: TBlockletDocker;
  blockletSingleton: boolean;
};
export type TBlockletResource = {
  exportApi: string;
  types: TBlockletResourceType[];
  bundles: TBlockletResourceBundle[];
};
export type TBlockletResourceType = {
  type: string;
  description: string;
};
export type TBlockletResourceBundle = {
  did: string;
  type: string;
  pb_public: boolean;
};
export type TReleaseComponent = {
  did: string;
  required: boolean;
};
export type TBlockletSecurityRuleQuery = {
  search: string;
};
export type TBlockletResponseHeaderPolicyQuery = {
  search: string;
};
export type TBlockletAccessPolicyQuery = {
  search: string;
};
export type TBlockletResponseHeaderPolicy = {
  id: string;
  name: string;
  description: string;
  securityHeader: string;
  cors: string;
  customHeader: string;
  removeHeader: string;
  isProtected: boolean;
};
export type TBlockletAccessPolicy = {
  id: string;
  name: string;
  description: string;
  roles?: Record<string, any>;
  reverse: boolean;
  isProtected: boolean;
};
export type TBlockletSecurityRule = {
  id: string;
  pathPattern: string;
  componentDid: string;
  priority: number;
  responseHeaderPolicyId: string;
  accessPolicyId: string;
  enabled: boolean;
  remark: string;
  accessPolicy?: TBlockletAccessPolicy;
  responseHeaderPolicy?: TBlockletResponseHeaderPolicy;
};
export type TDockerRunKeyValuePair = {
  key: string;
  value: string;
  path: string;
  type: string;
  name: string;
  prefix: string;
  protocol: string;
  proxyBehavior: string;
};
export type TDockerEnvKeyValuePair = {
  key: string;
  value: string;
  description: string;
  secure: boolean;
  shared: boolean;
  required: boolean;
  custom: string;
};
export type TBlockletDocker = {
  dockerImage: string;
  dockerArgs: TDockerRunKeyValuePair[];
  dockerEnvs: TDockerEnvKeyValuePair[];
  dockerCommand: string;
};
export type TEnableEvent = {
  type: string;
  source: string;
};
export type TWebhookEndpointState = {
  id: string;
  apiVersion: string;
  url: string;
  description: string;
  enabledEvents: TEnableEvent[];
  metadata?: Record<string, any>;
  status: string;
  createdAt: number;
  updatedAt: number;
  secret: string;
};
export type TWebhookEndpointWithUserInfo = {
  id: string;
  apiVersion: string;
  url: string;
  description: string;
  enabledEvents: TEnableEvent[];
  metadata?: Record<string, any>;
  status: string;
  createdAt: number;
  updatedAt: number;
  createUser?: TUserInfo;
  updateUser?: TUserInfo;
  secret: string;
};
export type TWebhookAttemptState = {
  id: string;
  eventId: string;
  webhookId: string;
  status: string;
  responseStatus: number;
  responseBody?: Record<string, any>;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  triggeredBy: string;
  triggeredFrom: string;
};
export type TWebhookEventState = {
  id: string;
  type: string;
  apiVersion: string;
  data?: Record<string, any>;
  objectType: string;
  objectId: string;
  request?: Record<string, any>;
  pendingWebhooks: number;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  source: string;
};
export type TWebhookAttemptWithEndpointEventState = {
  id: string;
  eventId: string;
  webhookId: string;
  status: string;
  responseStatus: number;
  responseBody?: Record<string, any>;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
  endpoint?: TWebhookEndpointState;
  event?: TWebhookEventState;
  triggeredBy: string;
  triggeredFrom: string;
};
export type TPassportQuery = {
  role: string;
  search: string;
  status: string;
};
export type TPassportLogQuery = {
  passportId: string;
};
export type TPassportLogState = {
  id: number;
  passportId: string;
  action: string;
  operatorIp: string;
  operatorUa: string;
  operatorDid: string;
  metadata?: Record<string, any>;
  createdAt: number;
};
export type TBaseUserInfo = {
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
};
export type TPassport = {
  id: string;
  name: string;
  title: string;
  issuer?: TIssuer;
  type: string[];
  issuanceDate: number;
  expirationDate: number;
  status: string;
  role: string;
  lastLoginAt: number;
  scope: string;
  display?: TPassportDisplay;
  source: string;
  parentDid: string;
  userDid: string;
  user?: TBaseUserInfo;
};
export type TOauthClient = {
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
  createUser?: TUserInfo;
};
export type TOrg = {
  id: string;
  name: string;
  description: string;
  ownerDid: string;
  createdAt: number;
  updatedAt: number;
  members: TUserOrg[];
  owner?: TUserInfo;
  membersCount: number;
  passports: TPassport[];
  metadata?: Record<string, any>;
  avatar: string;
};
export type TUserOrg = {
  id: string;
  orgId: string;
  userDid: string;
  status: enum_pb.OrgUserStatusMap[keyof enum_pb.OrgUserStatusMap];
  createdAt: number;
  updatedAt: number;
  user?: TUserInfo;
  metadata?: Record<string, any>;
};
export type TOrgResources = {
  id: string;
  orgId: string;
  resourceId: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
};
