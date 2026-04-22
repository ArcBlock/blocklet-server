import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

const createOrgMigration = () => ({
  // eslint-disable-next-line import/prefer-default-export
  up: async ({ context }: { context: QueryInterface }) => {
    await createTableIfNotExists(context, 'orgs', models.Org.GENESIS_ATTRIBUTES);

    await safeAddIndex(context, 'orgs', ['ownerDid']);
  },

  down: async ({ context }: { context: QueryInterface }) => {
    await context.removeIndex('orgs', ['ownerDid']);

    await dropTableIfExists(context, 'orgs');
  },
});

export default createOrgMigration;
