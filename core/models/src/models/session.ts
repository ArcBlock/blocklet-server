// Storage for multi-step conversations or long running tasks
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type SessionState = {
  id: string;
  type: string;
  key: string;
  __data: any;
  challenge: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createSessionModel(): DynamicModel<SessionState> {
  return class Session extends Model<SessionState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        defaultValue: generateId,
      },
      type: {
        type: DataTypes.STRING(64),
        index: true,
        allowNull: true,
      },
      key: {
        type: DataTypes.STRING(64),
        index: true,
      },
      __data: {
        type: JSONOrJSONB(),
        allowNull: false,
        defaultValue: {},
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          challenge: {
            type: DataTypes.STRING(64),
          },
        },
        {
          sequelize,
          indexes: [{ fields: ['type'] }, { fields: ['key'] }],
          modelName: 'Session',
          tableName: 'sessions',
          timestamps: true,
        }
      );
    }
  };
}
