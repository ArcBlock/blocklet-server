import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'releases', 'blockletHomepage', {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'releases', 'blockletSupport', {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'releases', 'blockletCommunity', {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'releases', 'blockletHomepage');
  await removeColumnIfExists(context, 'releases', 'blockletSupport');
  await removeColumnIfExists(context, 'releases', 'blockletCommunity');
};
