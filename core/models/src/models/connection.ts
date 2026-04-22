// Storage for did-connect sessions
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type ConnectionState = {
  id: string;
  token: string;
  status: string;
  currentStep: number;
  mfaSupported: boolean;
  challenge: string;
  sharedKey: string;
  extraParams: Record<string, any>;
  appInfo: Record<string, any>;
  memberAppInfo: Record<string, any>;
  clientVersion: string;
  encryptionKey: string;
  connectedWallet: Record<string, string>;
  did: string;
  pk: string;
  mfaCode: number;
  appDid: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
};

export function createConnectionModel(): DynamicModel<ConnectionState> {
  return class Connection extends Model<ConnectionState> {
    public static readonly GENESIS_ATTRIBUTES = {
      token: {
        type: DataTypes.STRING(16),
        primaryKey: true,
      },
      status: {
        type: DataTypes.STRING(16),
        index: true,
      },
      currentStep: {
        type: DataTypes.INTEGER,
      },
      mfaSupported: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
      challenge: {
        type: DataTypes.STRING(32),
      },
      sharedKey: {
        type: DataTypes.STRING(32),
      },
      extraParams: {
        type: JSONOrJSONB(),
      },
      appInfo: {
        type: JSONOrJSONB(),
      },
      clientVersion: {
        type: DataTypes.STRING(8),
      },
      encryptionKey: {
        type: DataTypes.STRING(512),
      },
      connectedWallet: {
        type: JSONOrJSONB(),
      },
      did: {
        type: DataTypes.STRING(80),
      },
      pk: {
        type: DataTypes.STRING(512),
      },
      mfaCode: {
        type: DataTypes.INTEGER,
      },
      appDid: {
        type: DataTypes.STRING(80),
      },
      error: {
        type: DataTypes.STRING(256),
      },
      __extra: {
        type: JSONOrJSONB(),
        defaultValue: {},
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
          memberAppInfo: {
            type: JSONOrJSONB(),
          },
        },
        {
          sequelize,
          modelName: 'Connection',
          tableName: 'connections',
          timestamps: true,
        }
      );
    }
  };
}
