const path = require('path');
const { createSequelize, createStateFactory, getServerModels, setupModels } = require('@abtnode/models');
const logger = require('@abtnode/logger')('@abtnode/core:states');

const NodeState = require('./node');
const BlockletState = require('./blocklet');
const BlockletChildState = require('./blocklet-child');
const NotificationState = require('./notification');
const SiteState = require('./site');
const AccessKeyState = require('./access-key');
const WebhookState = require('./webhook');
const MigrationState = require('./migration');
const SessionState = require('./session');
const ExtrasState = require('./blocklet-extras');
const CacheState = require('./cache');
const AuditLogState = require('./audit-log');
const JobState = require('./job');
const BackupState = require('./backup');
const TrafficInsightState = require('./traffic-insight');
const RuntimeInsightState = require('./runtime-insight');
const BlacklistState = require('./blacklist');
const OrgState = require('./org');

const { getDbFilePath } = require('../util');

const models = getServerModels();

const init = (dataDirs, config = {}) => {
  const dbPath = getDbFilePath(path.join(dataDirs.core, 'server.db'));
  const sequelize = createSequelize(dbPath);
  setupModels(models, sequelize);
  logger.info(`Init server states in ${dbPath}`);

  const notificationState = new NotificationState(models.Notification, config, models);

  const nodeState = new NodeState(models.Server, config, dataDirs, notificationState);
  const blockletChildState = new BlockletChildState(models.BlockletChild, config);
  const blockletState = new BlockletState(models.Blocklet, { ...config, BlockletChildState: blockletChildState });
  const siteState = new SiteState(models.Site, config);
  const accessKeyState = new AccessKeyState(models.AccessKey, config);
  const webhookState = new WebhookState(models.WebHook, config);
  const migrationState = new MigrationState(models.Migration, config);
  const sessionState = new SessionState(models.Session, config);
  const extrasState = new ExtrasState(models.BlockletExtra, config);
  const cacheState = new CacheState(models.Cache, config);
  const auditLogState = new AuditLogState(models.AuditLog, config);
  const jobState = new JobState(models.Job, config);
  const backupState = new BackupState(models.Backup, config);
  const trafficInsight = new TrafficInsightState(models.TrafficInsight, config);
  const runtimeInsight = new RuntimeInsightState(models.RuntimeInsight, { ...config, maxPageSize: 8640 });
  const blacklistState = new BlacklistState(models.Blacklist, config);
  const orgState = new OrgState(models.Org, config, models);

  return {
    node: nodeState,
    blocklet: blockletState,
    blockletChild: blockletChildState,
    notification: notificationState,
    site: siteState,
    accessKey: accessKeyState,
    webhook: webhookState,
    migration: migrationState,
    session: sessionState,
    blockletExtras: extrasState,
    cache: cacheState,
    auditLog: auditLogState,
    job: jobState,
    backup: backupState,
    trafficInsight,
    runtimeInsight,
    blacklist: blacklistState,
    org: orgState,
  };
};

module.exports = createStateFactory(init, models);
