import { USER_SESSION_STATUS } from '@abtnode/constant';
import type { TUserSession } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type UserSessionState = TUserSession & {
  createdAt: Date;
  updatedAt: Date;
};

export function createUserSessionModel(): DynamicModel<UserSessionState> {
  return class UserSession extends Model<UserSessionState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        defaultValue: generateId,
      },
      visitorId: {
        type: DataTypes.STRING(80),
        index: true,
        allowNull: false,
        defaultValue: generateId,
      },
      // 标记当前 userSession 是哪个 blocklet 登录来创建的（常用于统一登录中，master 会记录 member 的 userSession，供其他成员站点使用快捷登录）
      appPid: {
        type: DataTypes.STRING(80),
        index: true,
      },
      userDid: {
        type: DataTypes.STRING(64),
        index: true,
        allowNull: false,
        references: {
          model: 'users',
          key: 'did',
        },
      },
      // 需要记录的是当前登录的设备到底是啥，而不是使用了哪个钱包
      // 所在实际的登录操作中，不会去记录 UA，而是在首次加载 /session 请求时才记录
      ua: {
        type: DataTypes.STRING(512),
      },
      passportId: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      status: {
        // disabled | USER_SESSION_STATUS.ONLINE | USER_SESSION_STATUS.OFFLINE | USER_SESSION_STATUS.EXPIRED
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: USER_SESSION_STATUS.ONLINE,
      },
      lastLoginIp: {
        type: DataTypes.STRING(128),
      },
      extra: {
        type: JSONOrJSONB(),
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          // federated user created by which app
          createdByAppPid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          indexes: [{ fields: ['visitorId'] }, { fields: ['userDid'] }],
          modelName: 'UserSession',
          tableName: 'user_sessions',
          timestamps: true,
        }
      );
    }

    public static associate(models) {
      UserSession.belongsTo(models.User, {
        foreignKey: 'userDid',
        targetKey: 'did',
        as: 'user',
      });
    }
  };
}
