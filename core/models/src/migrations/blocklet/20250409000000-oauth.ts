import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

export async function up({ context }: { context: QueryInterface }) {
  await createTableIfNotExists(context, 'oauth_clients', models.OauthClient.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'oauth_codes', models.OauthCode.GENESIS_ATTRIBUTES);

  // Add indexes
  await safeAddIndex(context, 'oauth_codes', ['code']);
  await safeAddIndex(context, 'oauth_codes', ['clientId']);
  await safeAddIndex(context, 'oauth_codes', ['userDid']);
  await safeAddIndex(context, 'oauth_codes', ['expiresAt']);
}

export async function down({ context }: { context: QueryInterface }) {
  await dropTableIfExists(context, 'oauth_codes');
  await dropTableIfExists(context, 'oauth_clients');
}
