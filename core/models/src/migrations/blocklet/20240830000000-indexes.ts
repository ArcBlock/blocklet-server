import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'users', ['lastLoginAt']);
  await safeAddIndex(context, 'users', ['inviter']);
  await safeAddIndex(context, 'tagging', ['taggableType', 'taggableId']);
  await safeAddIndex(context, 'user_sessions', ['userDid', 'status']);
  await safeAddIndex(context, 'notifications', ['createdAt']);
  await safeAddIndex(context, 'permissions', ['type', 'createdAt']);
  await safeAddIndex(context, 'projects', ['createdAt']);
  await safeAddIndex(context, 'projects', ['createdBy']);
  await safeAddIndex(context, 'projects', ['createdBy', 'createdAt']);
  await safeAddIndex(context, 'releases', ['createdAt']);
  await safeAddIndex(context, 'releases', ['projectId']);
  await safeAddIndex(context, 'releases', ['projectId', 'createdAt']);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const down = async ({ context }: { context: QueryInterface }) => {};
