import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'releases', 'blockletResourceType', {
    type: DataTypes.ENUM('resource', 'pack', ''),
    defaultValue: '',
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'releases', 'blockletResourceType');
};
