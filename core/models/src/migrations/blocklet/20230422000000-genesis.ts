import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'permissions', models.Rbac.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'sessions', models.Session.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'users', models.User.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'passports', models.Passport.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'connected_accounts', models.ConnectedAccount.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'permissions');
  await dropTableIfExists(context, 'sessions');
  await dropTableIfExists(context, 'users');
  await dropTableIfExists(context, 'passports');
  await dropTableIfExists(context, 'connected_accounts');
};
