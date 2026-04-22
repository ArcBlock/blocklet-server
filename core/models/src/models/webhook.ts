import { TWebHook } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type WebHookState = TWebHook & {
  id: string;
};

export function createWebHookModel(): DynamicModel<WebHookState> {
  return class WebHook extends Model<WebHookState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      type: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      params: {
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
        },
        {
          sequelize,
          modelName: 'WebHook',
          tableName: 'webhooks',
          timestamps: true,
        }
      );
    }
  };
}
