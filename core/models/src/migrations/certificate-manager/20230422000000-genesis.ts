import type { QueryInterface } from 'sequelize';
import { getCertificateManagerModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getCertificateManagerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'accounts', models.Account.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'certificates', models.Certificate.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'http_challenges', models.HttpChallenge.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'jobs', models.Job.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'accounts');
  await dropTableIfExists(context, 'certificates');
  await dropTableIfExists(context, 'http_challenges');
  await dropTableIfExists(context, 'jobs');
};
