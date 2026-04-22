// Storage for multi-queue job storage
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type BlacklistState = {
  id: number;
  scope: string;
  key: string;
  expiresAt: number;
  createdAt: Date;
  updatedAt: Date;
};

export function createBlacklistModel(): DynamicModel<BlacklistState> {
  return class Blacklist extends Model<BlacklistState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      scope: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      key: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.BIGINT,
        get() {
          return Number(this.getDataValue('expiresAt'));
        },
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
          indexes: [{ fields: ['scope', 'expiresAt'] }, { fields: ['scope', 'key'] }],
          modelName: 'Blacklist',
          tableName: 'blacklists',
          timestamps: true,
        }
      );
    }
  };
}
