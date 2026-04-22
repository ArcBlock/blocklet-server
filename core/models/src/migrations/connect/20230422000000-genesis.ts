import type { QueryInterface } from 'sequelize';
import { getConnectModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getConnectModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'connections', models.Connection.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'connections');
};
