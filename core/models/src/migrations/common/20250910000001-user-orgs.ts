import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

const createUserOrgMigration = () => ({
  // eslint-disable-next-line import/prefer-default-export
  up: async ({ context }: { context: QueryInterface }) => {
    await createTableIfNotExists(context, 'user_orgs', models.UserOrg.GENESIS_ATTRIBUTES);

    await safeAddIndex(context, 'user_orgs', ['orgId']);
    await safeAddIndex(context, 'user_orgs', ['userDid']);
    await safeAddIndex(context, 'user_orgs', ['orgId', 'userDid'], {
      unique: true,
    });
  },

  down: async ({ context }: { context: QueryInterface }) => {
    await context.removeIndex('user_orgs', ['orgId']);
    await context.removeIndex('user_orgs', ['userDid']);
    await context.removeIndex('user_orgs', ['orgId', 'userDid']);

    await dropTableIfExists(context, 'user_orgs');
  },
});

export default createUserOrgMigration;
