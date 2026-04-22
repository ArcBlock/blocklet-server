import { TAuditLog } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type AuditLogState = TAuditLog & {
  updatedAt: Date;
  extra: any;
};

export function createAuditLogModel(): DynamicModel<AuditLogState> {
  return class AuditLog extends Model<AuditLogState> {
    // CAUTION: DO NOT EDIT THIS
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      scope: {
        type: DataTypes.STRING(64),
        allowNull: false,
        index: true,
      },
      action: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(64),
        allowNull: false,
        index: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      actor: {
        type: JSONOrJSONB(),
        allowNull: false,
        index: true,
      },
      extra: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      env: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      ip: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      ua: {
        type: DataTypes.STRING(512),
        allowNull: true,
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
          componentDid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'AuditLog',
          tableName: 'audit_logs',
          indexes: [
            { fields: ['scope', 'category'] },
            { fields: ['scope', 'actor'] },
            { fields: ['category'] },
            { fields: ['scope', 'category', 'createdAt'] },
          ],
          timestamps: true,
        }
      );
    }
  };
}
