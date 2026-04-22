import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'users', 'generation', {
    type: DataTypes.SMALLINT,
    defaultValue: 0,
  });
  await context.sequelize.query('UPDATE users SET generation=0');
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'users', 'generation');
};
