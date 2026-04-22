// Storage for multi-queue job storage
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type AccountState = {
  id: string;
  directoryUrl: string;
  private_key: object;
  account: object;
  maintainer_email: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createAccountModel(): DynamicModel<AccountState> {
  return class Account extends Model<AccountState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      directoryUrl: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      private_key: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      account: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      maintainer_email: {
        type: DataTypes.STRING(255),
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
          modelName: 'Account',
          tableName: 'accounts',
          timestamps: true,
        }
      );
    }
  };
}
