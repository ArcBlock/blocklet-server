import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'releases', 'blockletComponents', {
    type: JSONOrJSONB(),
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'releases', 'blockletComponents');
};
