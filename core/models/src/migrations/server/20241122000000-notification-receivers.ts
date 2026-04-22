import { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists } from '../../migrate';

const models = getBlockletModels();

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'notification_receivers', models.NotificationReceivers.GENESIS_ATTRIBUTES);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'notification_receivers');
};
