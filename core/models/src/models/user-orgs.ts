import { DataTypes, Model } from 'sequelize';
import { TUserOrg } from '@abtnode/types';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type UserOrgsState = Omit<TUserOrg, 'metadata'>;

export function createUserOrgsModel(): DynamicModel<UserOrgsState> {
  return class UserOrg extends Model<UserOrgsState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      orgId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
        references: {
          model: 'orgs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      userDid: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
        references: {
          model: 'users',
          key: 'did',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('active', 'inviting', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        index: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
        },
        {
          sequelize,
          modelName: 'UserOrgs',
          tableName: 'user_orgs',
          timestamps: false, // 使用自定义的 createdAt/updatedAt
          indexes: [
            { fields: ['orgId'] },
            { fields: ['userDid'] },
            { fields: ['orgId', 'userDid'], unique: true }, // 防止重复关联
            { fields: ['status'] },
          ],
        }
      );
    }

    public static associate(models): void {
      this.belongsTo(models.Org, {
        foreignKey: 'orgId',
        targetKey: 'id',
        onDelete: 'CASCADE',
        as: 'org',
      });

      // 关联到用户
      this.belongsTo(models.User, {
        foreignKey: 'userDid',
        targetKey: 'did',
        onDelete: 'CASCADE',
        as: 'user',
      });
    }
  };
}
