import type { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'messages', ['did']);
};

// eslint-disable-next-line
export const down = async ({ context }: { context: QueryInterface }) => { };
