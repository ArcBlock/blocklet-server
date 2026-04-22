import { QueryInterface } from 'sequelize';

const createNotificationReceiversMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    // 定义要创建的索引
    const indexes = [
      { fields: ['createdAt'], name: 'notification_receivers_createdAt_index' },
      { fields: ['notificationId'], name: 'notification_receivers_notificationId_index' },
      { fields: ['receiver'], name: 'notification_receivers_receiver_index' },
      { fields: ['walletSendStatus'], name: 'notification_receivers_walletSendStatus_index' },
      { fields: ['emailSendStatus'], name: 'notification_receivers_emailSendStatus_index' },
      { fields: ['pushKitSendStatus'], name: 'notification_receivers_pushKitSendStatus_index' },
      { fields: ['email'], name: 'notification_receivers_email_index' },
      { fields: ['deviceId'], name: 'notification_receivers_deviceId_index' },
      { fields: ['webhookUrls'], name: 'notification_receivers_webhookUrls_index' },
    ];

    // 获取现有索引
    const tableIndexes = await context.showIndex('notification_receivers');
    const existingIndexNames = Object.values(tableIndexes).map((index: any) => index.name);

    // 创建不存在的索引
    for (const index of indexes) {
      if (!existingIndexNames.includes(index.name)) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await context.addIndex('notification_receivers', index.fields, {
            name: index.name,
          });
        } catch (error) {
          console.error(error);
        }
      }
    }
  },

  down: async ({ context }: { context: QueryInterface }) => {
    // 获取现有索引
    const tableIndexes = await context.showIndex('notification_receivers');
    const existingIndexNames = Object.values(tableIndexes).map((index: any) => index.name);

    // 定义要删除的索引名称
    const indexNames = [
      'notification_receivers_createdAt_index',
      'notification_receivers_notificationId_index',
      'notification_receivers_receiver_index',
      'notification_receivers_walletSendStatus_index',
      'notification_receivers_emailSendStatus_index',
      'notification_receivers_pushKitSendStatus_index',
      'notification_receivers_email_index',
      'notification_receivers_deviceId_index',
      'notification_receivers_webhookUrls_index',
    ];

    // 只删除存在的索引
    for (const indexName of indexNames) {
      if (existingIndexNames.includes(indexName)) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await context.removeIndex('notification_receivers', indexName);
        } catch (error) {
          console.error(error);
        }
      }
    }
  },
});

export default createNotificationReceiversMigration;
