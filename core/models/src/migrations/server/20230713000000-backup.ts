import { DataTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'backups', 'updatedAt', {
    type: DataTypes.DATE,
    defaultValue: null,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'backups', 'updatedAt', {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  });
};
