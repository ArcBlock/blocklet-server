import type { QueryInterface } from 'sequelize';
import { getServerModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getServerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'runtime_insights', models.RuntimeInsight.GENESIS_ATTRIBUTES);
  await safeAddIndex(context, 'runtime_insights', ['did', 'date'], { unique: true });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'runtime_insights');
};
