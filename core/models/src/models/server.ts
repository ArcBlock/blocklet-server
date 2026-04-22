import { TNodeState } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type ServerState = Omit<TNodeState, 'environments' | 'uptime' | 'isDockerInstalled'> & {
  sk: string;
  runtimeConfig: Record<string, any>;
  launcher: Record<string, any>;
  customBlockletNumber: number;
  previousMode: Date;
  updatedAt: Date;
  slpDomain: string;
  isDockerInstalled?: boolean;
  registerInfo: Record<string, any>;
};

export function createServerModel(): DynamicModel<ServerState> {
  return class Server extends Model<ServerState, ServerState> {
    // CAUTION: do not edit this
    public static readonly GENESIS_ATTRIBUTES = {
      did: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        unique: true,
      },
      autoUpgrade: {
        type: DataTypes.BOOLEAN,
      },
      blockletRegistryList: {
        type: JSONOrJSONB(),
      },
      registerUrl: {
        type: DataTypes.STRING(255),
      },
      webWalletUrl: {
        type: DataTypes.STRING(255),
      },
      name: {
        type: DataTypes.STRING(64),
      },
      description: {
        type: DataTypes.STRING(255),
      },
      pk: {
        type: DataTypes.STRING(512),
      },
      sk: {
        type: DataTypes.STRING(512),
      },
      initialized: {
        type: DataTypes.BOOLEAN,
      },
      version: {
        type: DataTypes.STRING(64),
      },
      port: {
        type: DataTypes.INTEGER,
      },
      routing: {
        type: JSONOrJSONB(),
      },
      mode: {
        type: DataTypes.STRING(32),
      },
      enableWelcomePage: {
        type: DataTypes.BOOLEAN,
      },
      runtimeConfig: {
        type: JSONOrJSONB(),
      },
      ownerNft: {
        type: JSONOrJSONB(),
      },
      diskAlertThreshold: {
        type: DataTypes.INTEGER,
      },
      didRegistry: {
        type: DataTypes.STRING(255),
      },
      didDomain: {
        type: DataTypes.STRING(255),
      },
      enablePassportIssuance: {
        type: DataTypes.BOOLEAN,
      },
      trustedPassports: {
        type: JSONOrJSONB(),
      },
      trustedFactories: {
        type: JSONOrJSONB(),
      },
      customBlockletNumber: {
        type: DataTypes.INTEGER,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      nodeOwner: {
        type: JSONOrJSONB(),
      },
      startedAt: {
        type: DataTypes.DATE,
      },
      initializedAt: {
        type: DataTypes.DATE,
      },
      nextVersion: {
        type: DataTypes.STRING(64),
      },
      previousMode: {
        type: DataTypes.STRING(32),
      },
      status: {
        type: DataTypes.INTEGER,
      },
      enableBetaRelease: {
        type: DataTypes.BOOLEAN,
      },
      upgradeSessionId: {
        type: DataTypes.STRING(32),
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          launcher: {
            type: JSONOrJSONB(),
          },
          slpDomain: {
            type: DataTypes.STRING(255),
          },
          nftDomainUrl: {
            type: DataTypes.STRING(255),
          },
          enableFileSystemIsolation: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
          },
          enableDocker: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          enableDockerNetwork: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          enableSessionHardening: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          sessionSalt: {
            type: DataTypes.STRING(255),
            defaultValue: '',
          },
          registerInfo: {
            type: DataTypes.JSON,
          },
        },
        {
          sequelize,
          modelName: 'Server',
          tableName: 'servers',
          timestamps: true,
        }
      );
    }
  };
}
