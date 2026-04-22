import type { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

// Add missing fields for servers from launcher

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'servers', 'launcher', { type: JSONOrJSONB() });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'servers', 'launcher');
};
