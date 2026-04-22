// Storage for runtime insights: from monitor
import type { TNodeHistoryItem } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type RuntimeInsightState = TNodeHistoryItem & {
  id: number;
  did: string;
};

export function createRuntimeInsightModel(): DynamicModel<RuntimeInsightState> {
  return class RuntimeInsight extends Model<RuntimeInsightState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      did: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      date: {
        type: DataTypes.BIGINT,
        allowNull: false,
        get() {
          return Number(this.getDataValue('date'));
        },
      },
      cpu: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      mem: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      daemonMem: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      serviceMem: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
      hubMem: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
        },
        {
          sequelize,
          modelName: 'RuntimeInsight',
          indexes: [{ fields: ['did', 'date'] }],
          tableName: 'runtime_insights',
          timestamps: false,
        }
      );
    }
  };
}
