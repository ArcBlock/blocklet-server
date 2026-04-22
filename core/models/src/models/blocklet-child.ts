import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { generateId, JSONOrJSONB } from '../util';

/**
 * Check if a date value is valid
 */
function isValidDate(value: any): boolean {
  if (value == null) {
    return true;
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    return !Number.isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Create a getter function for date fields that sanitizes invalid dates
 * and triggers async fix for the database record
 */
function createDateGetterWithAutoFix(fieldName: string) {
  return function dateGetter(this: any): Date | null {
    const rawValue = this.getDataValue(fieldName);

    // 只有不正确的值时才需要修复，正常情况下不影响性能
    if (isValidDate(rawValue)) {
      return rawValue;
    }

    const fixedDate = new Date();

    setTimeout(() => {
      try {
        const id = this.getDataValue('id');
        if (id) {
          this.update({ [fieldName]: fixedDate }, { hooks: false, silent: true }).catch(() => {
            // Silently ignore update errors
          });
        }
      } catch {
        // Silently ignore errors
      }
    });

    return fixedDate;
  };
}

export type BlockletChildState = {
  id: string;
  parentBlockletId: string;
  parentBlockletDid: string;
  childDid: string;
  mountPoint?: string;
  meta: Record<string, any>;
  bundleSource: Record<string, any>;
  source: number;
  deployedFrom: string;
  mode: string;
  status: number;
  ports: Record<string, number>;
  environments?: Array<{ key: string; value: any }>;
  installedAt: Date;
  startedAt?: Date;
  stoppedAt?: Date;
  pausedAt?: Date;
  operator?: string;
  inProgressStart?: number;
  greenStatus?: number;
  greenPorts?: Record<string, number>;
  appEk?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function createBlockletChildModel(): DynamicModel<BlockletChildState> {
  return class BlockletChild extends Model<BlockletChildState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      parentBlockletId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
      },
      parentBlockletDid: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
      },
      childDid: {
        type: DataTypes.STRING(80),
        allowNull: false,
        index: true,
      },
      mountPoint: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },
      meta: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      bundleSource: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      source: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      deployedFrom: {
        type: DataTypes.STRING(512),
        defaultValue: '',
      },
      mode: {
        type: DataTypes.STRING(16),
        defaultValue: 'production',
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ports: {
        type: JSONOrJSONB(),
        defaultValue: {},
      },
      environments: {
        type: JSONOrJSONB(),
        defaultValue: [],
      },
      installedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        get: createDateGetterWithAutoFix('installedAt'),
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        get: createDateGetterWithAutoFix('startedAt'),
      },
      stoppedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        get: createDateGetterWithAutoFix('stoppedAt'),
      },
      pausedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        get: createDateGetterWithAutoFix('pausedAt'),
      },
      operator: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      inProgressStart: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      greenStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      greenPorts: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
        get: createDateGetterWithAutoFix('createdAt'),
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
        get: createDateGetterWithAutoFix('updatedAt'),
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          appEk: {
            type: DataTypes.STRING(256),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'BlockletChild',
          tableName: 'blocklet_children',
          timestamps: true,
          indexes: [
            { fields: ['parentBlockletId'] },
            { fields: ['parentBlockletDid'] },
            { fields: ['childDid'] },
            { fields: ['status'] }, // For efficient GROUP BY COUNT in heartbeat
            { fields: ['parentBlockletId', 'status'] }, // Composite index for filtered aggregations
          ],
        }
      );
    }

    public static associate(models: any): void {
      // Associate with Blocklet model
      this.belongsTo(models.Blocklet, {
        foreignKey: 'parentBlockletId',
        as: 'parentBlocklet',
      });

      // Self-referential association for nested children
      this.hasMany(models.BlockletChild, {
        foreignKey: 'parentBlockletId',
        as: 'childBlocklets',
      });
    }
  };
}
