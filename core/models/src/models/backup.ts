import { TBackup } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { generateId, JSONOrJSONB } from '../util';

export type BackupState = TBackup & {
  id: string;
};

export function createBackupModel(): DynamicModel<BackupState> {
  return class Backup extends Model<BackupState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      appPid: {
        type: DataTypes.STRING(80),
        index: true,
      },
      userDid: {
        type: DataTypes.STRING(80),
        index: true,
      },
      strategy: {
        type: DataTypes.SMALLINT,
        defaultValue: 0,
        unsigned: true,
      },
      sourceUrl: {
        type: DataTypes.STRING(512),
        defaultValue: '',
      },
      target: {
        type: DataTypes.STRING(16),
        defaultValue: 'Spaces',
      },
      targetUrl: {
        type: DataTypes.STRING(512),
        defaultValue: '',
      },
      status: {
        type: DataTypes.SMALLINT,
        unsigned: true,
      },
      message: {
        type: DataTypes.TEXT,
        defaultValue: '',
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
      metadata: {
        type: JSONOrJSONB(),
        allowNull: true,
        defaultValue: {},
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          targetName: {
            type: DataTypes.STRING(256),
            defaultValue: '',
          },
          progress: {
            type: DataTypes.FLOAT,
          },
        },
        {
          sequelize,
          modelName: 'Backup',
          tableName: 'backups',
          indexes: [{ fields: ['appPid'] }],
          // note: 备份的过程中，updatedAt 不需要填充默认值
          timestamps: false,
        }
      );
    }
  };
}
