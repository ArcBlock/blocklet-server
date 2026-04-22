import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'servers', 'sessionSalt', {
    type: DataTypes.STRING,
    defaultValue: '',
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'servers', 'sessionSalt');
};
