import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await safeAddIndex(context, 'user_sessions', ['updatedAt']);
  await safeAddIndex(context, 'user_sessions', ['createdAt']);
  await safeAddIndex(context, 'sessions', ['createdAt']);
  await safeAddIndex(context, 'permissions', ['createdAt']);
  await safeAddIndex(context, 'users', ['pk']);
  await safeAddIndex(context, 'users', ['createdAt']);
  await safeAddIndex(context, 'notifications', ['entityId']);
  await safeAddIndex(context, 'notification_receivers', ['readAt']);
  await safeAddIndex(context, 'connected_accounts', ['pk']);
  await safeAddIndex(context, 'connected_accounts', ['firstLoginAt']);
  await safeAddIndex(context, 'connected_accounts', ['lastLoginAt']);
  await safeAddIndex(context, 'passport_logs', ['createdAt']);
  await safeAddIndex(context, 'passports', ['issuanceDate']);
  await safeAddIndex(context, 'verify_codes', ['createdAt']);
  await safeAddIndex(context, 'verify_codes', ['subject']);
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex('user_sessions', ['updatedAt']);
  await context.removeIndex('user_sessions', ['createdAt']);
  await context.removeIndex('sessions', ['createdAt']);
  await context.removeIndex('permissions', ['createdAt']);
  await context.removeIndex('users', ['pk']);
  await context.removeIndex('users', ['createdAt']);
  await context.removeIndex('notifications', ['entityId']);
  await context.removeIndex('notification_receivers', ['readAt']);
  await context.removeIndex('connected_accounts', ['pk']);
  await context.removeIndex('connected_accounts', ['firstLoginAt']);
  await context.removeIndex('connected_accounts', ['lastLoginAt']);
  await context.removeIndex('passport_logs', ['createdAt']);
  await context.removeIndex('passports', ['issuanceDate']);
  await context.removeIndex('verify_codes', ['createdAt']);
  await context.removeIndex('verify_codes', ['subject']);
}
