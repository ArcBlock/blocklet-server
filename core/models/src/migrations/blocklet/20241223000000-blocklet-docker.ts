import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'releases', 'blockletDocker', {
    type: JSONOrJSONB(),
    defaultValue: '',
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'releases', 'contentType', {
    type: DataTypes.STRING(255),
    defaultValue: '',
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'releases', 'blockletDocker');
  await removeColumnIfExists(context, 'releases', 'contentType');
};
