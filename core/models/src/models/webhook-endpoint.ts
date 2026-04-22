import { TWebhookEndpointState } from '@abtnode/types';

import { CreationOptional, DataTypes, Model } from 'sequelize';
import type { LiteralUnion } from 'type-fest';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type WebhookEndpointState = Omit<TWebhookEndpointState, 'id' | 'status'> & {
  id: CreationOptional<string>;
  status: LiteralUnion<'enabled' | 'disabled', string>;
  createdBy: string;
  updatedBy: string;
};

export function createWebhookEndpointModel(): DynamicModel<WebhookEndpointState> {
  return class WebhookEndpoint extends Model<WebhookEndpointState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        defaultValue: generateId,
      },
      apiVersion: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      enabledEvents: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      metadata: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('enabled', 'disabled'),
        allowNull: false,
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
      createdBy: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      updatedBy: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      secret: {
        type: DataTypes.STRING(256),
        allowNull: true,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(this.GENESIS_ATTRIBUTES, {
        sequelize,
        modelName: 'WebhookEndpoint',
        tableName: 'webhook_endpoints',
      });
    }

    public static associate(models: any) {
      this.hasMany(models.WebhookAttempt, {
        sourceKey: 'id',
        foreignKey: 'webhookId',
        as: 'attempts',
      });
    }
  };
}
