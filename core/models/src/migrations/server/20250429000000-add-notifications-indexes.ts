import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await safeAddIndex(context, 'notification_receivers', ['receiver', 'read', 'notificationId']);
  await safeAddIndex(context, 'notification_receivers', ['receiver', 'notificationId']);
}

export async function down({ context }: { context: QueryInterface }) {
  await context.removeIndex('notification_receivers', ['receiver', 'read', 'notificationId']);
  await context.removeIndex('notification_receivers', ['receiver', 'notificationId']);
}
