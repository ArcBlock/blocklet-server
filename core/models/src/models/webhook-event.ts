import { TWebhookEventState } from '@abtnode/types';
import { CreationOptional, DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type WebhookEventState = Omit<TWebhookEventState, 'id'> & {
  id: CreationOptional<string>;
};

export function createWebhookEventModel(): DynamicModel<WebhookEventState> {
  return class WebhookEvent extends Model<WebhookEventState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        defaultValue: generateId,
      },
      type: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      source: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      apiVersion: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      objectType: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      objectId: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      data: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      request: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      pendingWebhooks: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      metadata: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(this.GENESIS_ATTRIBUTES, {
        sequelize,
        modelName: 'WebhookEvent',
        tableName: 'webhook_events',
      });
    }

    public static associate(models: any) {
      this.hasMany(models.WebhookAttempt, {
        sourceKey: 'id',
        foreignKey: 'eventId',
        as: 'webhookAttempts',
      });
    }
  };
}
