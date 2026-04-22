// Storage for event hub messages
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type MessageState = {
  id: string;
  event: string;
  data: object;
  createdAt: Date;
  updatedAt: Date;
  expiredAt: Date;
};

export function createMessageModel(): DynamicModel<MessageState> {
  return class Message extends Model<MessageState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      did: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      event: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
      },
      data: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          expiredAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Message',
          indexes: [{ fields: ['did'] }],
          tableName: 'messages',
          timestamps: true,
        }
      );
    }
  };
}
