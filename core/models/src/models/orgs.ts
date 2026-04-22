import { DataTypes, Model } from 'sequelize';
import { TOrg } from '@abtnode/types';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type OrgsState = Omit<TOrg, 'members' | 'owner' | 'membersCount' | 'passports' | 'metadata'>;

export function createOrgsModel(): DynamicModel<OrgsState> {
  return class Org extends Model<OrgsState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        index: true,
        defaultValue: generateId,
      },
      name: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ownerDid: {
        type: DataTypes.STRING(80),
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
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
        index: true,
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
          avatar: {
            type: DataTypes.STRING(255),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Org',
          tableName: 'orgs',
          timestamps: false, // 使用自定义的 createdAt
          indexes: [{ fields: ['ownerDid'] }],
        }
      );
    }

    public static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'ownerDid',
        targetKey: 'did',
        onDelete: 'CASCADE',
        as: 'owner',
      });

      this.hasMany(models.UserOrg, {
        foreignKey: 'orgId',
        sourceKey: 'id',
        onDelete: 'CASCADE',
        as: 'userOrgs',
      });

      // 组织的成员（多对多关系）
      this.belongsToMany(models.User, {
        through: models.UserOrg,
        foreignKey: 'orgId',
        otherKey: 'userDid',
        as: 'members',
      });

      // 组织的角色权限
      this.hasMany(models.Rbac, {
        foreignKey: 'orgId',
        sourceKey: 'id',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        as: 'permissions',
      });
    }
  };
}
