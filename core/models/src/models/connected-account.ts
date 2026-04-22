import { TConnectedAccount } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type ConnectedAccountState = TConnectedAccount & {
  userDid: string;
  firstLoginAt: Date;
  lastLoginIp: string;
  counter: number;
};

export function createConnectedAccountModel(): DynamicModel<ConnectedAccountState> {
  return class ConnectedAccount extends Model<ConnectedAccountState> {
    public static readonly GENESIS_ATTRIBUTES = {
      did: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
      },
      pk: {
        type: DataTypes.STRING(512),
      },
      userDid: {
        type: DataTypes.STRING(80),
        index: true,
        references: {
          model: 'users',
          key: 'did',
        },
      },
      provider: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      id: {
        type: DataTypes.STRING(64),
      },
      firstLoginAt: {
        type: DataTypes.DATE,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
      },
      lastLoginIp: {
        type: DataTypes.STRING,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          userInfo: {
            type: JSONOrJSONB(),
          },
          extra: {
            type: JSONOrJSONB(),
          },
          counter: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
          },
        },
        {
          sequelize,
          modelName: 'ConnectedAccount',
          tableName: 'connected_accounts',
          indexes: [{ fields: ['userDid'] }],
          timestamps: false,
        }
      );
    }

    public static associate(models) {
      ConnectedAccount.belongsTo(models.User, {
        foreignKey: 'userDid',
        as: 'user',
      });
    }
  };
}
