import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type PassportLogAction = 'issue' | 'revoke' | 'approve' | 'recover' | 'login' | 'expired' | 'used';

export interface PassportLogState {
  id: number;
  passportId: string;
  action: PassportLogAction;
  operatorIp: string;
  operatorUa: string;
  operatorDid: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export function createPassportLogModel(): DynamicModel<PassportLogState> {
  return class PassportLog extends Model<PassportLogState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      passportId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        references: {
          model: 'passports',
          key: 'id',
          onDelete: 'CASCADE',
        },
      },
      action: {
        type: DataTypes.ENUM('issue', 'revoke', 'approve', 'recover', 'login', 'expired', 'used'),
        allowNull: false,
      },
      operatorIp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      operatorUa: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      operatorDid: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      metadata: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
        },
        {
          sequelize,
          modelName: 'PassportLog',
          tableName: 'passport_logs',
          indexes: [{ fields: ['passportId'] }, { fields: ['action'] }, { fields: ['operatorDid'] }],
          timestamps: true,
          createdAt: true,
          updatedAt: false,
        }
      );
    }

    public static associate(models) {
      PassportLog.belongsTo(models.Passport, {
        foreignKey: 'passportId',
        as: 'passport',
      });
    }
  };
}
