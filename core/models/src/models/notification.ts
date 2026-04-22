import { TNotification } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

// 一条消息可以发送给多个用户，所以需要有 receivers 字段。
// 但是在 model 中不能将 receivers 定义在数据表中。只用于数据返回
export type NotificationState = Omit<TNotification & {}, 'receivers'>;

export function createNotificationModel(): DynamicModel<NotificationState> {
  return class Notification extends Model<NotificationState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      sender: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      receiver: {
        type: DataTypes.STRING(80),
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      action: {
        type: DataTypes.STRING(255),
      },
      entityType: {
        type: DataTypes.STRING(32),
      },
      entityId: {
        type: DataTypes.STRING(80),
      },
      severity: {
        type: DataTypes.ENUM('info', 'success', 'error', 'warning'),
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
          /* 新增字段 */
          attachments: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          blocks: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          actions: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          componentDid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          source: {
            type: DataTypes.ENUM('system', 'component', ''),
            allowNull: true,
            defaultValue: 'system',
          },
          type: {
            type: DataTypes.ENUM('notification', 'connect', 'feed', 'hi', 'passthrough', ''),
            allowNull: false,
            defaultValue: 'notification',
          },
          data: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          feedType: {
            type: DataTypes.ENUM('graphic', 'data-tracker', ''),
            allowNull: true,
          },
          activity: {
            type: JSONOrJSONB(),
            defaultValue: null,
          },
          options: {
            type: JSONOrJSONB(),
            defaultValue: null,
          },
        },
        {
          sequelize,
          modelName: 'Notification',
          indexes: [
            { fields: ['sender'] },
            { fields: ['receiver'] },
            { fields: ['componentDid'] },
            { fields: ['severity'] },
          ],
          tableName: 'notifications',
          timestamps: true,
          updatedAt: false,
        }
      );
    }

    public static associate(models: any) {
      Notification.hasMany(models.NotificationReceivers, {
        foreignKey: 'notificationId',
        as: 'receivers',
      });
    }
  };
}
