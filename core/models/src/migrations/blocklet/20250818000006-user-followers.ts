import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'user_followers', models.UserFollowers.GENESIS_ATTRIBUTES);

  await safeAddIndex(context, 'user_followers', ['userDid', 'followerDid'], {
    unique: true,
  });
  await safeAddIndex(context, 'user_followers', ['userDid']);
  await safeAddIndex(context, 'user_followers', ['followerDid']);
  await safeAddIndex(context, 'user_followers', ['createdAt']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('user_followers', ['userDid', 'followerDid']);
  await context.removeIndex('user_followers', ['userDid']);
  await context.removeIndex('user_followers', ['followerDid']);
  await context.removeIndex('user_followers', ['createdAt']);

  await dropTableIfExists(context, 'user_followers');
};
