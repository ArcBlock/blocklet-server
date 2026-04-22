import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'projects', models.Project.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'releases', models.Release.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'projects');
  await dropTableIfExists(context, 'releases');
};
