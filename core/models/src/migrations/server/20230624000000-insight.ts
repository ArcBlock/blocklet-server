import type { QueryInterface } from 'sequelize';
import { getServerModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getServerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'traffic_insights', models.TrafficInsight.GENESIS_ATTRIBUTES);
  await safeAddIndex(context, 'traffic_insights', ['did', 'date'], { unique: true });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'traffic_insights');
};
