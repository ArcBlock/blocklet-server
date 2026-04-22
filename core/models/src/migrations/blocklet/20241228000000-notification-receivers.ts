import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'notification_receivers', ['createdAt'], {
    name: 'notification_receivers_createdAt_index', // 索引名
  });
  await safeAddIndex(context, 'notification_receivers', ['notificationId'], {
    name: 'notification_receivers_notificationId_index', // 索引名
  });
  await safeAddIndex(context, 'notification_receivers', ['receiver'], {
    name: 'notification_receivers_receiver_index', // 索引名
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('notification_receivers', 'notification_receivers_createdAt_index');
  await context.removeIndex('notification_receivers', 'notification_receivers_notificationId_index');
  await context.removeIndex('notification_receivers', 'notification_receivers_receiver_index');
};
