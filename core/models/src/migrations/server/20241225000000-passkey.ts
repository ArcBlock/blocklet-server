import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'connected_accounts', 'counter', {
    type: DataTypes.BIGINT,
    defaultValue: 0,
  });
  await addColumnIfNotExists(context, 'sessions', 'challenge', {
    type: DataTypes.STRING(64),
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'connected_accounts', 'counter');
  await removeColumnIfExists(context, 'sessions', 'challenge');
};
