import type { LiteralUnion } from 'type-fest';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type VerifyCodeState = {
  id: number;
  code: string;
  subject: string;
  digest: string;
  scope: LiteralUnion<'email' | 'phone', string>;
  verified: boolean;
  verifiedAt?: Date;
  expired: boolean;
  expiredAt?: Date;
  sent: boolean;
  sentAt?: Date;
  issued: boolean;
  issuedAt?: Date;
  createdAt: string;
  updatedAt: string;
  purpose: LiteralUnion<'login' | 'kyc', string>;
};

export function createVerifyCodeModel(): DynamicModel<VerifyCodeState> {
  return class VerifyCode extends Model<VerifyCodeState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(8),
        index: true,
        unique: true,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(255),
        index: true,
        allowNull: false,
      },
      digest: {
        type: DataTypes.STRING(128),
        index: true,
        allowNull: false,
      },
      scope: {
        type: DataTypes.ENUM('email', 'phone'),
        allowNull: false,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verifiedAt: {
        type: DataTypes.DATE,
      },
      expired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      expiredAt: {
        type: DataTypes.DATE,
      },
      sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      sentAt: {
        type: DataTypes.DATE,
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
          issued: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
          },
          issuedAt: {
            type: DataTypes.DATE,
          },
          purpose: {
            type: DataTypes.ENUM('login', 'kyc'),
            allowNull: true,
            defaultValue: 'kyc',
          },
        },
        {
          sequelize,
          modelName: 'VerifyCode',
          tableName: 'verify_codes',
          timestamps: true,
        }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static associate(models) {}
  };
}
