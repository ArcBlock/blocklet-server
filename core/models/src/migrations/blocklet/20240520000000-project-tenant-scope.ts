import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'projects', 'tenantScope', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'projects', 'createdBy', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'projects', 'messageId', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'projects', 'tenantScope');
  await removeColumnIfExists(context, 'projects', 'createdBy');
  await removeColumnIfExists(context, 'projects', 'messageId');
};
