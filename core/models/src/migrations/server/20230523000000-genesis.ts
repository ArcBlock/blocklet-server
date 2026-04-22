import { DataTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'sites', 'port', { type: DataTypes.INTEGER });
  await context.bulkUpdate('sites', { port: 8088 }, { domain: '127.0.0.1' });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'sites', 'port');
};
