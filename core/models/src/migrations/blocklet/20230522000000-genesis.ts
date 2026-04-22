import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
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
