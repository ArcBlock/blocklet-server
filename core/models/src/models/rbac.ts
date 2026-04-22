import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type RbacState = {
  id: string;
  name: string;
  title: string;
  description: string;
  extra: any;
  type: string;
  grants: string[];
  createdAt: Date;
  updatedAt: Date;
  orgId: string; // 关联到 orgs 表的 id 字段，当 org 删除时级联删除
};

export function createRbacModel(): DynamicModel<RbacState> {
  return class Rbac extends Model<RbacState> {
    // CAUTION: do not edit this
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      name: {
        type: DataTypes.STRING(64),
        allowNull: false,
        index: true,
      },
      title: {
        type: DataTypes.STRING(64),
      },
      description: {
        type: DataTypes.STRING(255),
      },
      extra: {
        type: JSONOrJSONB(),
      },
      type: {
        type: DataTypes.STRING(16),
        allowNull: false,
        index: true,
      },
      grants: {
        type: JSONOrJSONB(),
        allowNull: false,
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
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          orgId: {
            type: DataTypes.STRING(80),
            allowNull: true,
            references: {
              model: 'orgs',
              key: 'id',
            },
            onDelete: 'CASCADE',
          },
        },
        {
          sequelize,
          indexes: [
            { fields: ['name'] },
            { fields: ['orgId'] },
            { fields: ['orgId', 'name'] }, // 复合索引，提高按组织查询角色的性能
          ],
          modelName: 'Rbac',
          tableName: 'permissions',
          timestamps: true,
        }
      );
    }

    public static associate(models: any): void {
      this.belongsTo(models.Org, {
        foreignKey: 'orgId',
        targetKey: 'id',
        onDelete: 'CASCADE',
        as: 'org',
      });
    }
  };
}
