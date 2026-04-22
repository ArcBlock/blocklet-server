import { TRoutingSite } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type SiteState = TRoutingSite & {
  id: string;
  port: number;
  createdAt: Date;
  updatedAt: Date;
};

export function createSiteModel(): DynamicModel<SiteState> {
  return class Site extends Model<SiteState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      domain: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      domainAliases: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
      name: {
        type: DataTypes.STRING(32),
      },
      isProtected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      rules: {
        type: JSONOrJSONB(),
        defaultValue: [],
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
      corsAllowedOrigins: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          // This column is added in migration script
          port: {
            type: DataTypes.INTEGER,
          },
        },
        {
          sequelize,
          modelName: 'Site',
          tableName: 'sites',
          timestamps: true,
        }
      );
    }
  };
}
