import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await safeAddIndex(context, 'notifications', ['createdAt'], {
    name: 'notifications_createdAt_index', // 索引名
  });
  await safeAddIndex(context, 'notifications', ['severity'], {
    name: 'notifications_severity_index', // 索引名
  });
  await safeAddIndex(context, 'notifications', ['componentDid'], {
    name: 'notifications_componentDid_index', // 索引名
  });
  await safeAddIndex(context, 'notifications', ['type'], {
    name: 'notifications_type_index', // 索引名
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('notifications', 'notifications_createdAt_index');
  await context.removeIndex('notifications', 'notifications_severity_index');
  await context.removeIndex('notifications', 'notifications_componentDid_index');
  await context.removeIndex('notifications', 'notifications_type_index');
};
