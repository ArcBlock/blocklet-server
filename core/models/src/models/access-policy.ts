import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type AccessPolicyState = {
  id: string;
  name: string;
  description?: string;
  roles: string[] | null;
  reverse: boolean;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function createAccessPolicyModel(): DynamicModel<AccessPolicyState> {
  return class AccessPolicy extends Model<AccessPolicyState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(256),
        allowNull: true,
      },
      // 该设计覆盖了原来定义的几种情况
      // 1. owner-only -> 设置 roles: ['owner']
      // 2. invite-only -> 设置 roles: [], reverse: true
      // 3. 公开 -> 设置 roles: null, reverse: false
      // 4. 指定角色 -> 设置 roles: ['admin', 'member'], reverse: false
      // FIXME: 需要考虑兼容这种情况的实现方案
      // 5. login-only
      roles: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      reverse: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isProtected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
          modelName: 'AccessPolicy',
          tableName: 'access_policies',
          timestamps: true,
        }
      );
    }
  };
}
