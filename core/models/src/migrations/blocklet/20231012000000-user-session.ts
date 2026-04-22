import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'user_sessions', models.UserSession.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'user_sessions');
};
