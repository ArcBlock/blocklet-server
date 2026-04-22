import type { QueryInterface } from 'sequelize';
import { getServiceModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getServiceModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'messages', models.Message.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'messages');
};
