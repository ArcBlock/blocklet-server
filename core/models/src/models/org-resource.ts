import { DataTypes, Model } from 'sequelize';
import { TOrgResources } from '@abtnode/types';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type OrgResourceState = TOrgResources;

export function createOrgResourceModel(): DynamicModel<OrgResourceState> {
  return class OrgResource extends Model<OrgResourceState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        unique: true,
        index: true,
        defaultValue: generateId,
      },
      orgId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        primaryKey: true,
        index: true,
        references: {
          model: 'orgs',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      resourceId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        primaryKey: true,
        index: true,
      },
      type: {
        type: DataTypes.STRING(128),
        allowNull: true,
        index: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
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
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
        },
        {
          sequelize,
          modelName: 'OrgResource',
          tableName: 'org_resources',
          timestamps: false,
          indexes: [{ fields: ['orgId'] }, { fields: ['resourceId'] }, { fields: ['type'] }],
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
