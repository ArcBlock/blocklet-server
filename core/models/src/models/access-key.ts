import { TAccessKey } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type AccessKeyState = TAccessKey;

export function createAccessKeyModel(): DynamicModel<AccessKeyState> {
  return class AccessKey extends Model<AccessKeyState> {
    // CAUTION: DO NOT EDIT THIS
    public static readonly GENESIS_ATTRIBUTES = {
      accessKeyId: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        unique: true,
      },
      accessKeyPublic: {
        type: DataTypes.STRING(256),
      },
      passport: {
        type: DataTypes.STRING(16),
      },
      remark: {
        type: DataTypes.STRING(128),
      },
      createdBy: {
        type: DataTypes.STRING(128),
      },
      updatedBy: {
        type: DataTypes.STRING(128),
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          authType: {
            type: DataTypes.ENUM('simple', 'signature'),
            defaultValue: 'signature',
          },
          componentDid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          resourceType: {
            type: DataTypes.STRING(128),
            allowNull: true,
          },
          resourceId: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          expireAt: {
            type: DataTypes.DATE,
            allowNull: true,
          },
          createdVia: {
            type: DataTypes.ENUM('sdk', 'web', 'connect'),
            defaultValue: 'web',
          },
        },
        {
          sequelize,
          modelName: 'AccessKey',
          tableName: 'access_keys',
          timestamps: true,
        }
      );
    }
  };
}
