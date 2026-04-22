import type { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

// Add missing fields for paid blocklets

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'blocklets', 'tokens', { type: JSONOrJSONB() });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'blocklets', 'tokens');
};
