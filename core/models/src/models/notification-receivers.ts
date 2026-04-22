import { DataTypes, Model } from 'sequelize';
import { TNotificationReceiver } from '@abtnode/types';
import { NOTIFICATION_SEND_STATUS } from '@abtnode/constant';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type NotificationReceiversState = Omit<TNotificationReceiver & {}, 'notification' | 'user'> & {};

export function createNotificationReceiversModel(): DynamicModel<NotificationReceiversState> {
  return class NotificationReceivers extends Model<NotificationReceiversState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      notificationId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
      },
      receiver: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      readAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      walletSendStatus: {
        type: DataTypes.INTEGER,
        defaultValue: NOTIFICATION_SEND_STATUS.PENDING,
        validate: {
          isIn: [Object.values(NOTIFICATION_SEND_STATUS)],
        },
      },
      walletSendAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      pushKitSendStatus: {
        type: DataTypes.INTEGER,
        defaultValue: NOTIFICATION_SEND_STATUS.PENDING,
        validate: {
          isIn: [Object.values(NOTIFICATION_SEND_STATUS)],
        },
      },
      pushKitSendAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      emailSendStatus: {
        type: DataTypes.INTEGER,
        defaultValue: NOTIFICATION_SEND_STATUS.PENDING,
        validate: {
          isIn: [Object.values(NOTIFICATION_SEND_STATUS)],
        },
      },
      emailSendAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
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
            defaultValue: {},
          },
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
        },
        {
          sequelize,
          modelName: 'NotificationReceivers',
          indexes: [{ fields: ['notificationId'] }, { fields: ['receiver'] }],
          tableName: 'notification_receivers',
          timestamps: true,
          updatedAt: false,
        }
      );
    }

    public static associate(models: any) {
      NotificationReceivers.belongsTo(models.Notification, {
        foreignKey: 'notificationId',
        as: 'notification',
      });
      NotificationReceivers.belongsTo(models.User, {
        foreignKey: 'receiver',
        as: 'receiverUser',
      });
    }
  };
}
