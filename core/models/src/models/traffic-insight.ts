// Storage for traffic insights: from access log
import type { TTrafficInsight } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type TrafficInsightState = TTrafficInsight & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createTrafficInsightModel(): DynamicModel<TrafficInsightState> {
  return class TrafficInsight extends Model<TrafficInsightState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: generateId,
      },
      did: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      date: {
        type: DataTypes.STRING(10),
        allowNull: false,
        index: true,
      },
      totalRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      validRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      failedRequests: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      generationTime: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
        get() {
          return Number(this.getDataValue('generationTime'));
        },
      },
      uniqueVisitors: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      uniqueFiles: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      excludedHits: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      uniqueReferrers: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      uniqueNotFound: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      uniqueStaticFiles: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      logSize: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      bandwidth: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
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
          modelName: 'TrafficInsight',
          indexes: [{ fields: ['did', 'date'], unique: true }],
          tableName: 'traffic_insights',
          timestamps: true,
        }
      );
    }
  };
}
