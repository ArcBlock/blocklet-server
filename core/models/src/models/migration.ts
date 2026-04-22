import { TMigration } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type MigrationState = TMigration & {
  id: string;
};

export function createMigrationModel(): DynamicModel<MigrationState> {
  return class Migration extends Model<MigrationState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      script: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      executedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        index: true,
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
          modelName: 'Migration',
          tableName: 'migrations',
          timestamps: true,
        }
      );
    }
  };
}
