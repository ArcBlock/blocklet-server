import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'response_header_policies', models.ResponseHeaderPolicy.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'access_policies', models.AccessPolicy.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'security_rules', models.SecurityRule.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'security_rules');
  await dropTableIfExists(context, 'access_policies');
  await dropTableIfExists(context, 'response_header_policies');
};
