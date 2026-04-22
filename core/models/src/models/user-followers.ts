import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type UserFollowersState = {
  userDid: string; // 被关注的用户 DID
  followerDid: string; // 关注者 DID - follower_did 关注 user_did
  createdAt: Date;
};

export function createUserFollowersModel(): DynamicModel<UserFollowersState> {
  return class UserFollowers extends Model<UserFollowersState> {
    public static readonly GENESIS_ATTRIBUTES = {
      userDid: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        index: true,
        references: {
          model: 'users',
          key: 'did',
        },
        onDelete: 'CASCADE',
      },
      followerDid: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        allowNull: false,
        index: true,
        references: {
          model: 'users',
          key: 'did',
        },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
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
          modelName: 'UserFollowers',
          tableName: 'user_followers',
          timestamps: false, // 使用自定义的 createdAt
        }
      );
    }

    public static associate(models: any): void {
      // 被关注的用户
      UserFollowers.belongsTo(models.User, {
        foreignKey: 'userDid',
        targetKey: 'did',
        onDelete: 'CASCADE',
        as: 'user',
      });

      // 关注者
      UserFollowers.belongsTo(models.User, {
        foreignKey: 'followerDid',
        targetKey: 'did',
        onDelete: 'CASCADE',
        as: 'follower',
      });
    }
  };
}
