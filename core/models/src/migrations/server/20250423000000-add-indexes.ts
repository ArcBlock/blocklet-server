import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'audit_logs', ['action']);
  await safeAddIndex(context, 'backups', ['createdAt']);
  await safeAddIndex(context, 'blocklets', ['updatedAt']);
  await safeAddIndex(context, 'blocklets', ['installedAt']);
  await safeAddIndex(context, 'connected_accounts', ['pk']);
  await safeAddIndex(context, 'connected_accounts', ['firstLoginAt']);
  await safeAddIndex(context, 'connected_accounts', ['lastLoginAt']);
  await safeAddIndex(context, 'notification_receivers', ['readAt']);
  await safeAddIndex(context, 'notifications', ['entityId']);
  await safeAddIndex(context, 'notifications', ['sender']);
  await safeAddIndex(context, 'passport_logs', ['createdAt']);
  await safeAddIndex(context, 'passports', ['issuanceDate']);
  await safeAddIndex(context, 'sessions', ['createdAt']);
  await safeAddIndex(context, 'users', ['pk']);
  await safeAddIndex(context, 'users', ['createdAt']);
  await safeAddIndex(context, 'webhooks', ['createdAt']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('audit_logs', ['action']);
  await context.removeIndex('backups', ['createdAt']);
  await context.removeIndex('blocklets', ['updatedAt']);
  await context.removeIndex('blocklets', ['installedAt']);
  await context.removeIndex('connected_accounts', ['pk']);
  await context.removeIndex('connected_accounts', ['firstLoginAt']);
  await context.removeIndex('connected_accounts', ['lastLoginAt']);
  await context.removeIndex('notification_receivers', ['readAt']);
  await context.removeIndex('notifications', ['entityId']);
  await context.removeIndex('notifications', ['sender']);
  await context.removeIndex('passport_logs', ['createdAt']);
  await context.removeIndex('passports', ['issuanceDate']);
  await context.removeIndex('sessions', ['createdAt']);
  await context.removeIndex('users', ['pk']);
  await context.removeIndex('users', ['createdAt']);
  await context.removeIndex('webhooks', ['createdAt']);
};
