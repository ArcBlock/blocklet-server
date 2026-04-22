import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'users', 'emailVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
  await addColumnIfNotExists(context, 'users', 'phoneVerified', { type: DataTypes.BOOLEAN, defaultValue: false });
  await context.bulkUpdate('users', { emailVerified: false, phoneVerified: false }, {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'users', 'emailVerified');
  await removeColumnIfExists(context, 'users', 'phoneVerified');
};
