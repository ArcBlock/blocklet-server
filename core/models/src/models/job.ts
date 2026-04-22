// Storage for multi-queue job storage
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type JobState = {
  id: string;
  queue: string;
  job: Record<string, any>;
  entityId?: string;
  retryCount: number;
  willRunAt: number;
  delay: number;
  processingBy?: string;
  processingAt?: number;
  cancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function createJobModel(): DynamicModel<JobState> {
  return class Job extends Model<JobState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      queue: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      job: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      retryCount: {
        type: DataTypes.INTEGER,
      },
      delay: {
        type: DataTypes.BIGINT,
        get() {
          return Number(this.getDataValue('delay'));
        },
      },
      willRunAt: {
        type: DataTypes.BIGINT,
        get() {
          return Number(this.getDataValue('willRunAt'));
        },
      },
      cancelled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
          processingBy: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          processingAt: {
            type: DataTypes.BIGINT,
            get() {
              return Number(this.getDataValue('processingAt'));
            },
            allowNull: true,
          },
          entityId: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          indexes: [{ fields: ['queue'] }, { fields: ['entityId'] }],
          modelName: 'Job',
          tableName: 'jobs',
          timestamps: true,
        }
      );
    }
  };
}
