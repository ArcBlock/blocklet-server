import { DataTypes, Model } from 'sequelize';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type HttpChallengeState = {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createHttpChallengeModel(): DynamicModel<HttpChallengeState> {
  return class HttpChallenge extends Model<HttpChallengeState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(86),
        primaryKey: true,
        defaultValue: generateId,
      },
      key: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING(512),
        allowNull: false,
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
          modelName: 'HttpChallenge',
          tableName: 'http_challenges',
          timestamps: true,
        }
      );
    }
  };
}
