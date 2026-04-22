import { DataTypes, QueryInterface } from 'sequelize';
import { existsColumn } from '../../models';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  if (!(await existsColumn(context, 'users', 'phone'))) {
    await addColumnIfNotExists(context, 'users', 'phone', {
      type: DataTypes.STRING(36),
      allowNull: true,
    });
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  if (await existsColumn(context, 'users', 'phone')) {
    await removeColumnIfExists(context, 'users', 'phone');
  }
};
