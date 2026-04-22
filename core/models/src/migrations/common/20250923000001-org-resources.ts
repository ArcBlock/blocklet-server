import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

const createOrgResourcesMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await createTableIfNotExists(context, 'org_resources', models.OrgResource.GENESIS_ATTRIBUTES);

    await safeAddIndex(context, 'org_resources', ['orgId', 'resourceId'], {
      unique: true,
    });
    await safeAddIndex(context, 'org_resources', ['orgId']);
    await safeAddIndex(context, 'org_resources', ['resourceId']);
    await safeAddIndex(context, 'org_resources', ['type']);
    await safeAddIndex(context, 'org_resources', ['createdAt']);
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await context.removeIndex('org_resources', ['orgId', 'resourceId']);
    await context.removeIndex('org_resources', ['orgId']);
    await context.removeIndex('org_resources', ['resourceId']);
    await context.removeIndex('org_resources', ['type']);
    await context.removeIndex('org_resources', ['createdAt']);

    await dropTableIfExists(context, 'org_resources');
  },
});

export default createOrgResourcesMigration;
