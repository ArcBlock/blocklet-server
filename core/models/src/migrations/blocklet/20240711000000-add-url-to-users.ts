import { DataTypes, QueryInterface } from 'sequelize';
import { existsColumn } from '../../models';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  if (!(await existsColumn(context, 'users', 'url'))) {
    await addColumnIfNotExists(context, 'users', 'url', {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: '',
    });
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  if (await existsColumn(context, 'users', 'url')) {
    await removeColumnIfExists(context, 'users', 'url');
  }
};
