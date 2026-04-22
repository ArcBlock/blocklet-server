import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'releases', 'uploadedResource', {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'releases', 'uploadedResource');
};
