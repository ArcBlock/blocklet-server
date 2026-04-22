import { TWebhookAttemptState } from '@abtnode/types';

import { CreationOptional, DataTypes, Model } from 'sequelize';
import type { LiteralUnion } from 'type-fest';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type WebhookAttemptState = Omit<TWebhookAttemptState, 'id' | 'status'> & {
  id: CreationOptional<string>;
  status: LiteralUnion<'enabled' | 'disabled', string>;
};

export function createWebhookAttemptModel(): DynamicModel<WebhookAttemptState> {
  return class WebhookAttempt extends Model<WebhookAttemptState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        defaultValue: generateId,
      },

      eventId: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      webhookId: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM('enabled', 'disabled'),
        allowNull: false,
      },
      responseStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      responseBody: {
        type: JSONOrJSONB(),
        allowNull: false,
      },

      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          triggeredBy: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          triggeredFrom: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'WebhookAttempt',
          tableName: 'webhook_attempts',
        }
      );
    }

    public static associate(models: any) {
      this.hasOne(models.WebhookEndpoint, {
        sourceKey: 'webhookId',
        foreignKey: 'id',
        as: 'endpoint',
      });
      this.hasOne(models.WebhookEvent, {
        sourceKey: 'eventId',
        foreignKey: 'id',
        as: 'event',
      });
    }
  };
}
