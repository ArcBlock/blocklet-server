import type { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'audit_logs', ['scope', 'category']);
  await safeAddIndex(context, 'audit_logs', ['scope', 'actor']);
  await safeAddIndex(context, 'audit_logs', ['category']);
  await safeAddIndex(context, 'backups', ['appPid']);
  await safeAddIndex(context, 'blocklets', ['appDid']);
  await safeAddIndex(context, 'blocklets', ['appPid']);
  await safeAddIndex(context, 'jobs', ['queue']);
  await safeAddIndex(context, 'notifications', ['sender']);
  await safeAddIndex(context, 'notifications', ['receiver']);

  await safeAddIndex(context, 'users', ['approved']);
  await safeAddIndex(context, 'users', ['fullName']);
  await safeAddIndex(context, 'users', ['email']);
  await safeAddIndex(context, 'connected_accounts', ['userDid']);
  await safeAddIndex(context, 'passports', ['userDid']);
  await safeAddIndex(context, 'passports', ['name', 'status', 'userDid']);
  await safeAddIndex(context, 'permissions', ['name']);
  await safeAddIndex(context, 'permissions', ['type']);
  await safeAddIndex(context, 'sessions', ['type']);
  await safeAddIndex(context, 'sessions', ['key']);
};

// eslint-disable-next-line
export const down = async ({ context }: { context: QueryInterface }) => { };
