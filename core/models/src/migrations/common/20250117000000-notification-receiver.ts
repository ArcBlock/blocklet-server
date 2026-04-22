import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, changeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

const columnsToAdd = () => {
  return {
    walletSendFailedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    walletSendRecord: {
      type: JSONOrJSONB(),
      defaultValue: [],
    },
    pushKitSendFailedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pushKitSendRecord: {
      type: JSONOrJSONB(),
      defaultValue: [],
    },
    emailSendFailedReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    emailSendRecord: {
      type: JSONOrJSONB(),
      defaultValue: [],
    },
    webhook: {
      type: JSONOrJSONB(),
      defaultValue: [],
    },
  };
};

const createNotificationReceiversMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await changeColumnIfExists(context, 'notification_receivers', 'walletSendStatus', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isIn: [[0, 1, 2]],
      },
    });
    await changeColumnIfExists(context, 'notification_receivers', 'pushKitSendStatus', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isIn: [[0, 1, 2]],
      },
    });
    await changeColumnIfExists(context, 'notification_receivers', 'emailSendStatus', {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isIn: [[0, 1, 2]],
      },
    });
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await addColumnIfNotExists(context, 'notification_receivers', columnName, columnDefinition);
    }
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await changeColumnIfExists(context, 'notification_receivers', 'walletSendStatus', {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    });
    await changeColumnIfExists(context, 'notification_receivers', 'pushKitSendStatus', {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    });
    await changeColumnIfExists(context, 'notification_receivers', 'emailSendStatus', {
      type: DataTypes.SMALLINT,
      defaultValue: 0,
    });

    for (const [columnName] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await removeColumnIfExists(context, 'notification_receivers', columnName);
    }
  },
});

export default createNotificationReceiversMigration;
