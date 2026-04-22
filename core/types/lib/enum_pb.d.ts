// package: abt_node
// file: enum.proto
export interface StatusCodeMap {
  OK: 0;
  BLOCKLET_NOT_FOUND: 1;
  BLOCKLET_NOT_PURCHASED: 2;
  FORBIDDEN: 403;
  INTERNAL: 500;
  TIMEOUT: 504;
}
export interface BlockletStatusMap {
  ADDED: 0;
  DOWNLOADING: 1;
  DOWNLOADED: 2;
  INSTALLING: 3;
  INSTALLED: 4;
  STARTING: 5;
  RUNNING: 6;
  STOPPING: 7;
  STOPPED: 8;
  ERROR: 9;
  UPGRADING: 10;
  RESTARTING: 11;
  CORRUPTED: 12;
  WAITING: 13;
  DELETED: 14;
  UNKNOWN: 15;
}
export interface BlockletSourceMap {
  REGISTRY: 0;
  LOCAL: 1;
  UPLOAD: 2;
  URL: 3;
  CUSTOM: 4;
}
export interface HeaderMatchTypeMap {
  EXACT: 0;
  PARTIAL: 1;
  REGEXP: 2;
}
export interface BackendServiceTypeMap {
  DAEMON: 0;
  BLOCKLET: 1;
  REDIRECT: 2;
  NONE: 3;
  GENERAL_PROXY: 4;
  DIRECT_RESPONSE: 5;
  REWRITE: 6;
  COMPONENT: 7;
}
export interface UploadMap {
  SCALAR: 0;
}
export interface SenderTypeMap {
  SLACK: 0;
  API: 1;
}
export interface BackupToMap {
  SPACES: 0;
  DISK: 1;
}
export interface PublishTypeMap {
  RESOURCE: 0;
  PACK: 1;
}
export interface ReleaseStatusMap {
  DRAFT: 0;
  PUBLISHED: 1;
}
export interface NotificationAttachmentTypeMap {
  ASSET: 0;
  VC: 1;
  TOKEN: 2;
  TEXT: 3;
  IMAGE: 4;
  DIVIDER: 5;
  TRANSACTION: 6;
  DAPP: 7;
  LINK: 8;
  SECTION: 9;
}
export interface NotificationSendStatusMap {
  PENDING: 0;
  SENT: 1;
  FAILED: 2;
}
export interface NotificationSendFailedReasonMap {
  USER_DISABLED: 0;
  CHANNEL_UNAVAILABLE: 1;
  CHANNEL_DISABLED: 2;
  NOT_ONLINE: 3;
}
export interface NotificationSendChannelMap {
  APP: 0;
  EMAIL: 1;
  PUSH: 2;
  WEBHOOK: 3;
}
export interface UserRelationTypeMap {
  FOLLOWING: 0;
  FOLLOWERS: 1;
}
export interface OrgUserStatusMap {
  ACTIVE: 0;
  INVITING: 1;
  INACTIVE: 2;
}
export interface OrgQueryTypeMap {
  OWNED: 0;
  JOINED: 1;
}
