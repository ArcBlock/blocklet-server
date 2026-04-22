import { DataTypes, Model } from 'sequelize';
import { generateId } from '../util';
import { DynamicModel } from '../types';

export type SecurityRuleState = {
  id: string;
  pathPattern: string;
  componentDid?: string;
  priority: number;
  responseHeaderPolicyId?: string;
  accessPolicyId?: string;
  enabled: boolean;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createSecurityRuleModel(): DynamicModel<SecurityRuleState> {
  class SecurityRule extends Model<SecurityRuleState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      pathPattern: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      componentDid: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      responseHeaderPolicyId: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      accessPolicyId: {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      remark: {
        type: DataTypes.STRING(256),
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
          modelName: 'SecurityRule',
          tableName: 'security_rules',
          timestamps: true,
          hooks: {
            beforeCreate: async (instance: SecurityRule) => {
              const maxPriority: number = await SecurityRule.max('priority');
              // @ts-ignore
              instance.priority = (maxPriority || 0) + 1;
            },
          },
        }
      );
    }

    public static associate(models) {
      SecurityRule.hasOne(models.AccessPolicy, {
        foreignKey: 'id',
        sourceKey: 'accessPolicyId',
        onDelete: 'CASCADE',
        as: 'accessPolicy',
      });
      SecurityRule.hasOne(models.ResponseHeaderPolicy, {
        foreignKey: 'id',
        sourceKey: 'responseHeaderPolicyId',
        onDelete: 'CASCADE',
        as: 'responseHeaderPolicy',
      });
    }
  }
  return SecurityRule;
}
