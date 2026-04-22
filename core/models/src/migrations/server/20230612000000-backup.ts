import { DataTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'backups', 'targetName', { type: DataTypes.STRING(256), defaultValue: '' });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'backups', 'targetName');
};
