import { TUserInfo } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';

import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type UserState = Omit<
TUserInfo,
| 'passports'
| 'connectedAccounts'
| 'source'
| 'extraConfigs'
| 'tags'
| 'userSessions'
| 'userSessionsCount'
| 'isFollowing'
> & {
  passkeyCount: number;
}; // prettier-ignore

export function createUserModel(): DynamicModel<UserState> {
  return class User extends Model<UserState> {
    public static readonly GENESIS_ATTRIBUTES = {
      did: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        unique: true,
      },
      pk: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      fullName: {
        type: DataTypes.STRING(128),
      },
      email: {
        type: DataTypes.STRING(128),
      },
      avatar: {
        type: DataTypes.STRING(60000),
      },
      role: {
        type: DataTypes.STRING(64),
      },
      remark: {
        type: DataTypes.STRING(128),
        defaultValue: '',
      },
      sourceProvider: {
        type: DataTypes.STRING(32),
      },
      locale: {
        type: DataTypes.STRING(8),
        defaultValue: 'en',
      },
      approved: {
        type: DataTypes.BOOLEAN,
        index: true,
        defaultValue: true,
      },
      // app extended
      extra: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      firstLoginAt: {
        type: DataTypes.DATE,
        index: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        index: true,
      },
      lastLoginIp: {
        type: DataTypes.STRING,
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
          // Which app belongs to, null means itself, valued means federated group master
          sourceAppPid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          didSpace: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          url: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: '',
          },
          phone: {
            type: DataTypes.STRING(36),
            allowNull: true,
          },
          inviter: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          generation: {
            type: DataTypes.SMALLINT,
            defaultValue: 0,
          },
          emailVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          phoneVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          passkeyCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
          },
          metadata: {
            type: JSONOrJSONB(),
            defaultValue: {},
          },
          address: {
            type: JSONOrJSONB(),
            defaultValue: {},
          },
          name: {
            type: DataTypes.STRING(32),
            allowNull: true,
          },
          // federated user created by which app
          createdByAppPid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'User',
          tableName: 'users',
          timestamps: true,
          indexes: [{ fields: ['approved'] }, { fields: ['email'] }, { fields: ['fullName'] }],
        }
      );
    }

    public static associate(models) {
      User.hasMany(models.UserSession, {
        foreignKey: 'userDid',
        sourceKey: 'did',
        onDelete: 'CASCADE',
        as: 'userSessions',
      });
      User.hasMany(models.Passport, {
        foreignKey: 'userDid',
        onDelete: 'CASCADE',
        as: 'passports',
      });
      User.hasMany(models.ConnectedAccount, {
        foreignKey: 'userDid',
        onDelete: 'CASCADE',
        as: 'connectedAccounts',
      });
      User.hasMany(models.NotificationReceivers, {
        foreignKey: 'receiver',
        as: 'notificationReceivers',
      });
      User.belongsToMany(models.Tag, {
        through: {
          model: models.Tagging,
          scope: {
            taggableType: 'user',
          },
        },
        constraints: false,
        foreignKey: 'taggableId',
        otherKey: 'tagId',
        as: 'tags',
      });

      // 仅当 UserFollowers 模型存在时才建立关注关系，该关系不应存在于 server 中
      if (models.UserFollowers) {
        // 用户的关注者（谁关注了这个用户）
        User.hasMany(models.UserFollowers, {
          foreignKey: 'userDid',
          sourceKey: 'did',
          onDelete: 'CASCADE',
          as: 'followers', // 外键 userDid 关联到 User 表的 did 字段，级联删除
        });

        // 用户关注的人（这个用户关注了谁）
        User.hasMany(models.UserFollowers, {
          foreignKey: 'followerDid',
          sourceKey: 'did',
          onDelete: 'CASCADE',
          as: 'following', // 外键 followerDid 关联到 User 表的 did 字段，级联删除
        });
      }
      // 谁创建了 org
      User.hasMany(models.Org, {
        foreignKey: 'ownerDid',
        sourceKey: 'did',
        onDelete: 'CASCADE',
        as: 'orgs',
      });
      // 谁加入了 org
      User.hasMany(models.UserOrg, {
        foreignKey: 'userDid',
        sourceKey: 'did',
        onDelete: 'CASCADE',
        as: 'userOrgs',
      });

      // 用户所属的组织（多对多关系）
      User.belongsToMany(models.Org, {
        through: models.UserOrg,
        foreignKey: 'userDid',
        otherKey: 'orgId',
        as: 'organizations',
      });
    }
  };
}
