import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'connected_accounts', 'userInfo', {
    type: JSONOrJSONB(),
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'connected_accounts', 'extra', {
    type: JSONOrJSONB(),
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'connected_accounts', 'userInfo');
  await removeColumnIfExists(context, 'connected_accounts', 'extra');
};
