/* eslint-disable @typescript-eslint/indent */
import { TBlockletState } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { generateId, JSONOrJSONB } from '../util';

export type BlockletState = Omit<
  TBlockletState,
  | 'port'
  | 'configs'
  | 'trustedFactories'
  | 'trustedPassports'
  | 'enablePassportIssuance'
  | 'dynamic'
  | 'mountPoint'
  | 'controller'
  | 'optionalComponents'
  | 'enableDocker'
  | 'enableDockerNetwork'
  | 'children'
> & {
  tokens: Record<string, any>;
  appEk?: string;
};

export function createBlockletModel(): DynamicModel<BlockletState> {
  return class Blocklet extends Model<BlockletState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      appDid: {
        type: DataTypes.STRING(80),
        index: true,
        allowNull: true,
      },
      appPid: {
        type: DataTypes.STRING(80),
        index: true,
        allowNull: true,
      },
      mode: {
        type: DataTypes.STRING(16),
      },
      meta: {
        type: JSONOrJSONB(),
      },
      status: {
        type: DataTypes.INTEGER,
      },
      source: {
        type: DataTypes.INTEGER,
      },
      bundleSource: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      port: {
        type: DataTypes.INTEGER,
      },
      ports: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      deployedFrom: {
        type: DataTypes.STRING(512),
      },
      environments: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
      migratedFrom: {
        type: JSONOrJSONB(),
        defaultValue: [],
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
      installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      stoppedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      externalSk: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      externalSkSource: {
        type: DataTypes.STRING(64),
      },
      structVersion: {
        type: DataTypes.STRING(16),
      },
      // TODO: deprecate this
      structV1Did: {
        type: DataTypes.STRING(128),
        defaultValue: '',
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          tokens: {
            type: JSONOrJSONB(),
          },
          vaults: {
            type: JSONOrJSONB(),
            defaultValue: [],
          },
          appEk: {
            type: DataTypes.STRING(256),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Blocklet',
          tableName: 'blocklets',
          indexes: [{ fields: ['appDid'] }, { fields: ['appPid'] }],
          timestamps: true,
        }
      );
    }
  };
}
