import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

/**
 * Add environments column to blocklet_children table
 * This column stores environment variables for child blocklets
 */
export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'blocklet_children', 'environments', {
    type: JSONOrJSONB(),
    defaultValue: [],
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'blocklet_children', 'environments');
};
