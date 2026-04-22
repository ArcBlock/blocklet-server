import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'tags', models.Tag.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'tagging', models.Tagging.GENESIS_ATTRIBUTES);
  await safeAddIndex(context, 'tags', ['title'], { unique: true });
  await safeAddIndex(context, 'tagging', ['tagId', 'taggableId'], { unique: true });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'tags');
  await dropTableIfExists(context, 'tagging');
};
