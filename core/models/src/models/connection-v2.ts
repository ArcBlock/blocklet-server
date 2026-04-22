// Storage for did-connect sessions
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type ConnectionV2State = {
  appInfo: any;
  approveResults: any[];
  approveUrl?: string;
  authUrl: string;
  autoConnect: boolean;
  challenge: string;
  connectUrl?: string;
  currentConnected?: {
    didwallet: any;
    userDid: string;
    userPk: string;
  } | null;
  currentStep: number;
  error?: string;
  forceConnected: boolean;
  onlyConnect: boolean;
  previousConnected?: {
    didwallet: 'ios' | 'android' | 'web' | '';
    userDid: string;
    userPk: string;
  } | null;
  requestedClaims: any;
  responseClaims: any;
  sessionId: string;
  status: string;
  strategy: string | 'default' | 'smart';
  timeout: {
    app: number;
    relay: number;
    wallet: number;
  };
  updaterPk: string;
  withinSession: boolean;
  [key: string]: any;
};

export function createConnectionV2Model(): DynamicModel<ConnectionV2State> {
  return class ConnectionV2 extends Model<ConnectionV2State> {
    public static readonly GENESIS_ATTRIBUTES = {
      appInfo: {
        type: JSONOrJSONB(),
      },
      approvedResults: {
        type: JSONOrJSONB(),
      },
      approveUrl: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      authUrl: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      autoConnect: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
      challenge: {
        type: DataTypes.STRING(32),
      },
      connectUrl: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      currentConnected: {
        type: JSONOrJSONB(),
      },
      currentStep: {
        type: DataTypes.INTEGER,
      },
      error: {
        type: DataTypes.TEXT,
        defaultValue: '',
      },
      forceConnected: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
      onlyConnect: {
        type: DataTypes.BOOLEAN,
        default: false,
      },
      previousConnected: {
        type: JSONOrJSONB(),
      },
      requestedClaims: {
        type: JSONOrJSONB(),
      },
      responseClaims: {
        type: JSONOrJSONB(),
      },
      sessionId: {
        type: DataTypes.STRING(80),
        primaryKey: true,
      },
      status: {
        type: DataTypes.STRING(16),
        index: true,
      },
      strategy: {
        type: DataTypes.STRING(16),
      },
      timeout: {
        type: JSONOrJSONB(),
      },
      updaterPk: {
        type: DataTypes.STRING(512),
      },
      withinSession: {
        type: DataTypes.BOOLEAN,
        default: false,
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
        },
        {
          sequelize,
          modelName: 'ConnectionV2',
          tableName: 'connections_v2',
          timestamps: true,
        }
      );
    }
  };
}
