import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'projects', 'autoUpload', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await addColumnIfNotExists(context, 'projects', 'possibleSameStore', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'projects', 'autoUpload');
  await removeColumnIfExists(context, 'projects', 'possibleSameStore');
};
