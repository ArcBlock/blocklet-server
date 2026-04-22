import { TBlockletController, TBlockletExtra } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type BlockletExtraState = TBlockletExtra & {
  createdAt: Date;
  updatedAt: Date;
  expiredAt: string;
  controller: TBlockletController;
};

export function createBlockletExtraModel(): DynamicModel<BlockletExtraState> {
  return class BlockletExtra extends Model<BlockletExtraState> {
    // CAUTION: DO NOT EDIT THIS
    public static readonly GENESIS_ATTRIBUTES = {
      did: {
        type: DataTypes.STRING(80),
        primaryKey: true,
      },
      appDid: {
        // 实际上它就是 appPid
        type: DataTypes.STRING(80),
        unique: true,
        index: true,
      },
      meta: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      controller: {
        type: JSONOrJSONB(),
      },
      configs: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
      children: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
      settings: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      expiredAt: {
        type: DataTypes.STRING(30),
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
        { ...this.GENESIS_ATTRIBUTES },
        {
          sequelize,
          modelName: 'BlockletExtra',
          tableName: 'blocklet_extras',
          timestamps: true,
        }
      );
    }
  };
}
