// A simple persistent key-value storage
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type CacheState = {
  key: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
};

export function createCacheModel(): DynamicModel<CacheState> {
  return class Cache extends Model<CacheState> {
    public static readonly GENESIS_ATTRIBUTES = {
      key: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        defaultValue: generateId,
      },
      value: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      createdAt: {
        type: JSONOrJSONB(),
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
          modelName: 'Cache',
          tableName: 'caches',
          timestamps: true,
        }
      );
    }
  };
}
