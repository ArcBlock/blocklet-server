import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'user_sessions', ['status', 'visitorId']);
  await safeAddIndex(context, 'user_sessions', ['status', 'userDid', 'visitorId', 'appPid']);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const down = async ({ context }: { context: QueryInterface }) => {};
