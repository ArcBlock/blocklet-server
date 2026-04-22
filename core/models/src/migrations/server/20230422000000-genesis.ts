import type { QueryInterface } from 'sequelize';
import { getServerModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getServerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'access_keys', models.AccessKey.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'audit_logs', models.AuditLog.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'backups', models.Backup.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'blocklet_extras', models.BlockletExtra.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'blocklets', models.Blocklet.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'caches', models.Cache.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'jobs', models.Job.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'migrations', models.Migration.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'notifications', models.Notification.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'permissions', models.Rbac.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'servers', models.Server.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'sessions', models.Session.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'sites', models.Site.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'users', models.User.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'passports', models.Passport.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'connected_accounts', models.ConnectedAccount.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'webhooks', models.WebHook.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'access_keys');
  await dropTableIfExists(context, 'audit_logs');
  await dropTableIfExists(context, 'blocklet_extras');
  await dropTableIfExists(context, 'blocklets');
  await dropTableIfExists(context, 'caches');
  await dropTableIfExists(context, 'jobs');
  await dropTableIfExists(context, 'migrations');
  await dropTableIfExists(context, 'notifications');
  await dropTableIfExists(context, 'permissions');
  await dropTableIfExists(context, 'servers');
  await dropTableIfExists(context, 'sessions');
  await dropTableIfExists(context, 'sites');
  await dropTableIfExists(context, 'users');
  await dropTableIfExists(context, 'passports');
  await dropTableIfExists(context, 'connected_accounts');
  await dropTableIfExists(context, 'webhooks');
  await dropTableIfExists(context, 'backups');
};
