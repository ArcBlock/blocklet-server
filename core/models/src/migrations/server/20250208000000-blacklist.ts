import type { QueryInterface } from 'sequelize';
import { getServerModels } from '../../models';
import { createTableIfNotExists, safeAddIndex } from '../../migrate';

const models = getServerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'blacklists', models.Blacklist.GENESIS_ATTRIBUTES);
  await safeAddIndex(context, 'blacklists', ['scope', 'expiresAt']);
  await safeAddIndex(context, 'blacklists', ['scope', 'key']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.dropTable('blacklists');
};
