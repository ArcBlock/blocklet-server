import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, changeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

const columnsToAdd = () => {
  return {
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    webhookUrls: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  };
};

const createNotificationReceiversMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await changeColumnIfExists(context, 'notification_receivers', 'webhook', {
      type: JSONOrJSONB(),
      defaultValue: {},
    });
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await addColumnIfNotExists(context, 'notification_receivers', columnName, columnDefinition);
    }
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await changeColumnIfExists(context, 'notification_receivers', 'webhook', {
      type: JSONOrJSONB(),
      defaultValue: [],
    });

    for (const [columnName] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await removeColumnIfExists(context, 'notification_receivers', columnName);
    }
  },
});

export default createNotificationReceiversMigration;
