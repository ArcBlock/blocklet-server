/* eslint-disable prefer-destructuring */
import { Sequelize, type QueryInterface } from 'sequelize';
import { LiteralUnion } from 'type-fest';

import { createMessageModel } from './message';
import { createAccountModel } from './account';
import { createCertificateModel } from './certificate';
import { createHttpChallengeModel } from './http-challenge';
import { createUserModel } from './user';
import { createPassportModel } from './passport';
import { createPassportLogModel } from './passport-log';
import { createConnectedAccountModel } from './connected-account';
import { createSessionModel } from './session';
import { createRbacModel } from './rbac';
import { createAccessKeyModel } from './access-key';
import { createAuditLogModel } from './audit-log';
import { createBlockletExtraModel } from './blocklet-extra';
import { createBlockletModel } from './blocklet';
import { createBlockletChildModel } from './blocklet-child';
import { createCacheModel } from './cache';
import { createJobModel } from './job';
import { createMigrationModel } from './migration';
import { createNotificationModel } from './notification';
import { createNotificationReceiversModel } from './notification-receivers';
import { createServerModel } from './server';
import { createSiteModel } from './site';
import { createWebHookModel } from './webhook';
import { createConnectionModel } from './connection';
import { createBackupModel } from './backup';
import { createTrafficInsightModel } from './traffic-insight';
import { createRuntimeInsightModel } from './runtime-insight';
import { createTagModel } from './tag';
import { createTaggingModel } from './tagging';
import { createProjectModel } from './project';
import { createReleaseModel } from './release';
import { createUserSessionModel } from './user-session';
import { createConnectionV2Model } from './connection-v2';
import { createVerifyCodeModel } from './verify-code';
import { createSecurityRuleModel } from './security-rule';
import { createAccessPolicyModel } from './access-policy';
import { createResponseHeaderPolicyModel } from './response-header-policy';
import { createBlacklistModel } from './blacklist';

import { createWebhookEndpointModel } from './webhook-endpoint';
import { createWebhookAttemptModel } from './webhook-attempt';
import { createWebhookEventModel } from './webhook-event';
import { createOauthClientModel } from './oauth-client';
import { createOauthCodeModel } from './oauth-code';
import { createUserFollowersModel } from './user-followers';
import { createUserOrgsModel } from './user-orgs';
import { createOrgsModel } from './orgs';
import { createOrgResourceModel } from './org-resource';
import { createPostgresDatabase, dbPathToPostgresUrl } from '../util';

export * from './message';
export * from './account';
export * from './certificate';
export * from './http-challenge';
export * from './user';
export * from './user-session';
export * from './passport';
export * from './passport-log';
export * from './connected-account';
export * from './session';
export * from './rbac';
export * from './access-key';
export * from './audit-log';
export * from './blocklet-extra';
export * from './blocklet';
export * from './blocklet-child';
export * from './cache';
export * from './job';
export * from './migration';
export * from './notification';
export * from './server';
export * from './site';
export * from './webhook';
export * from './connection';
export * from './connection-v2';
export * from './backup';
export * from './traffic-insight';
export * from './runtime-insight';
export * from './tag';
export * from './tagging';
export * from './verify-code';
export * from './access-policy';
export * from './response-header-policy';
export * from './security-rule';
export * from './blacklist';

export * from './webhook-endpoint';
export * from './webhook-event';
export * from './webhook-attempt';

export * from './oauth-client';
export * from './oauth-code';
export * from './user-followers';
export * from './orgs';
export * from './org-resource';
export * from './user-orgs';

const logEnabled =
  !process.env.DISABLE_SQLITE_LOG &&
  (process.env.DEBUG === '@abtnode/models' || ['production', 'test'].includes(process.env.NODE_ENV) === false);

export const sequelizeInstances = new Map<string, Sequelize>();

export function createSequelize(dbPath: string, inputConfig: Record<string, any> = {}) {
  if (sequelizeInstances.has(dbPath)) {
    return sequelizeInstances.get(dbPath);
  }

  const config = {
    benchmark: logEnabled,
    logging: logEnabled,
    ...inputConfig,
  };

  let sequelize: Sequelize;

  const connectUrl = process.env.ABT_NODE_POSTGRES_URL;

  if (dbPath.endsWith(':memory:')) {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      ...config,
    });
  } else if (connectUrl?.startsWith('postgres')) {
    const postgresUrl = dbPathToPostgresUrl(dbPath, connectUrl);
    sequelize = new Sequelize(postgresUrl, {
      dialect: 'postgres',
      // 缩小每个 Sequelize 实例的连接池大小, 以免多个 Sequelize 实例的导致连接池占用过多
      pool: { max: 2, min: 0, idle: 10000, evict: 10000 },
      hooks: {
        beforeConnect: async () => {
          await createPostgresDatabase(dbPath, config.logging);
        },
      },
      ...config,
    });
  } else {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: dbPath,
      pool: { max: 1, min: 0, idle: 10000, evict: 10000 },
      retry: {
        match: [/SQLITE_BUSY/, /database is locked/],
        backoffBase: 200,
        backoffExponent: 1.1,
        backoffJitter: 100,
        max: 15, // 最糟糕情况下, 第 15 次重试最大时长大概 7 秒
      } as any,
      ...config,
    });
    const pragmas = async () => {
      await sequelize.query('pragma journal_mode = WAL;');
      await sequelize.query('pragma wal_autocheckpoint = 5000;');
      await sequelize.query('pragma busy_timeout = 5000;');
      await sequelize.query('pragma synchronous = normal;');
      await sequelize.query('pragma journal_size_limit = 67108864;');

      // 把页缓存扩大到 6000 页（默认 2000～4000），可显著提升热点数据命中率
      if (process.env.ABT_NODE_SQLITE_LARGE_CACHE) {
        await sequelize.query('PRAGMA cache_size = 6000;');
      }

      // ANALYZE（统计） + AUTO_INDEX（自动索引创建） + 其他内部清理
      // 若版本低于 3.14 会报错
      try {
        await sequelize.query('PRAGMA optimize;');
      } catch (err) {
        console.error('PRAGMA optimize failed', err);
      }
    };
    pragmas().catch((err) => {
      console.error('PRAGMA optimize failed', err);
    });
  }
  sequelizeInstances.set(dbPath, sequelize);

  return sequelizeInstances.get(dbPath);
}

export async function destroySequelize(dbPath: string) {
  const sequelize = sequelizeInstances.get(dbPath);
  // 这里应该先删除再 close，否删除先 close 在删除，在 close 过程中如果发起 createSequelize 会返回一个已经关闭的实例
  if (sequelize) {
    sequelizeInstances.delete(dbPath);
    try {
      await sequelize.close();
    } catch (error) {
      console.error(`Failed to close Sequelize instance for ${dbPath}:`, error);
    }
  }
}

export function getServiceModels() {
  const models = {
    Message: createMessageModel(),
  };

  return models;
}

export function getCertificateManagerModels() {
  const models = {
    Account: createAccountModel(),
    Certificate: createCertificateModel(),
    HttpChallenge: createHttpChallengeModel(),
    Job: createJobModel(),
  };

  return models;
}

export function getBlockletModels() {
  const models = {
    User: createUserModel(),
    UserSession: createUserSessionModel(),
    Passport: createPassportModel(),
    PassportLog: createPassportLogModel(),
    ConnectedAccount: createConnectedAccountModel(),
    Session: createSessionModel(),
    Rbac: createRbacModel(),
    Tag: createTagModel(),
    Tagging: createTaggingModel(),
    Project: createProjectModel(),
    Release: createReleaseModel(),
    Notification: createNotificationModel(),
    NotificationReceivers: createNotificationReceiversModel(),
    VerifyCode: createVerifyCodeModel(),
    SecurityRule: createSecurityRuleModel(),
    AccessPolicy: createAccessPolicyModel(),
    ResponseHeaderPolicy: createResponseHeaderPolicyModel(),

    WebhookEndpoint: createWebhookEndpointModel(),
    WebhookAttempt: createWebhookAttemptModel(),
    WebhookEvent: createWebhookEventModel(),

    OauthClient: createOauthClientModel(),
    OauthCode: createOauthCodeModel(),
    AccessKey: createAccessKeyModel(),
    UserFollowers: createUserFollowersModel(), // 用户关注关系仅存在于 service 层
    UserOrg: createUserOrgsModel(),
    Org: createOrgsModel(),
    OrgResource: createOrgResourceModel(),
    AuditLog: createAuditLogModel(),
  };

  return models;
}

export function getServerModels() {
  const models = {
    AccessKey: createAccessKeyModel(),
    AuditLog: createAuditLogModel(),
    BlockletExtra: createBlockletExtraModel(),
    Blocklet: createBlockletModel(),
    BlockletChild: createBlockletChildModel(),
    Cache: createCacheModel(),
    Job: createJobModel(),
    Migration: createMigrationModel(),
    Notification: createNotificationModel(),
    NotificationReceivers: createNotificationReceiversModel(),
    Rbac: createRbacModel(),
    Server: createServerModel(),
    Session: createSessionModel(),
    Site: createSiteModel(),
    User: createUserModel(),
    UserSession: createUserSessionModel(),
    Passport: createPassportModel(),
    PassportLog: createPassportLogModel(),
    ConnectedAccount: createConnectedAccountModel(),
    WebHook: createWebHookModel(),
    Backup: createBackupModel(),
    TrafficInsight: createTrafficInsightModel(),
    RuntimeInsight: createRuntimeInsightModel(),
    Tag: createTagModel(),
    Tagging: createTaggingModel(),
    Blacklist: createBlacklistModel(),
    UserOrg: createUserOrgsModel(),
    Org: createOrgsModel(),
    OrgResource: createOrgResourceModel(),
  };

  return models;
}

export function getConnectModels() {
  const models = {
    Connection: createConnectionModel(),
    ConnectionV2: createConnectionV2Model(),
  };

  return models;
}

export function setupModels(models: any, sequelize: Sequelize) {
  Object.keys(models).forEach((x) => {
    models[x].initialize(sequelize);
  });
  Object.keys(models).forEach((x) => {
    if (typeof models[x].associate === 'function') {
      models[x].associate(models);
    }
  });
}

type TableName = LiteralUnion<'users', string>;
export async function existsColumn(
  context: QueryInterface,
  tableName: TableName,
  columnName: string
): Promise<boolean> {
  const columnsDescription = await context.describeTable(tableName);
  return columnName in columnsDescription;
}

// 定期清理 SQLite 内存
export async function cleanupSqliteMemory(sequelize: Sequelize, dbPath: string) {
  try {
    if (sequelize.getDialect() !== 'sqlite') {
      return;
    }

    // 检查连接状态
    const [results] = await sequelize.query('SELECT 1');
    if (!results || results.length === 0) {
      return;
    }

    // 重置内存使用统计
    await sequelize.query('PRAGMA shrink_memory;');
  } catch (err) {
    // 如果是连接错误，说明连接已经断开
    if (err.name === 'SequelizeConnectionError' || (err?.message && /closed!/.test(err.message))) {
      return;
    }
    console.error('Failed to cleanup SQLite memory', dbPath, err);
  }
}

// 启动全局清理定时器
setInterval(
  async () => {
    const cleanupPromises = Array.from(sequelizeInstances.entries())
      .filter(([dbPath]) => !dbPath.endsWith(':memory:'))
      .map(([dbPath, sequelize]) => cleanupSqliteMemory(sequelize, dbPath));

    await Promise.all(cleanupPromises);
  },
  60 * 1000 * 10
);
