import { TPassport } from '@abtnode/types';
import type { LiteralUnion } from 'type-fest';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type PassportState = Omit<TPassport, 'parentDid' | 'source'> & {
  firstLoginAt: Date;
  lastLoginAt: Date;
  lastLoginIp: string;
  scope: LiteralUnion<'passport' | 'kyc', string>;
  parentDid: string;
  source: 'invite' | 'recover' | 'trusted' | 'issue';
};

export function createPassportModel(): DynamicModel<PassportState> {
  return class Passport extends Model<PassportState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(74),
        primaryKey: true,
        allowNull: false,
      },
      userDid: {
        type: DataTypes.STRING(80),
        index: true,
        references: {
          model: 'users',
          key: 'did',
        },
      },
      type: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      issuer: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      specVersion: {
        type: DataTypes.STRING(16),
        defaultValue: '1.0.0',
      },
      name: {
        type: DataTypes.STRING(32),
        index: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      endpoint: {
        type: DataTypes.STRING(512),
      },
      status: {
        type: DataTypes.STRING(16),
        index: true,
        defaultValue: 'valid',
      },
      // used to store passport/kyc sub types: owner/admin/member/email/phone
      role: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      firstLoginAt: {
        type: DataTypes.DATE,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
      },
      lastLoginIp: {
        type: DataTypes.STRING,
      },
      issuanceDate: {
        type: DataTypes.DATE,
      },
      expirationDate: {
        type: DataTypes.DATE,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          scope: {
            type: DataTypes.ENUM('passport', 'kyc'),
            defaultValue: 'passport',
          },
          display: {
            type: JSONOrJSONB(),
            allowNull: true,
          },
          parentDid: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          source: {
            type: DataTypes.ENUM('invite', 'recover', 'trusted', 'issue', ''),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Passport',
          tableName: 'passports',
          indexes: [{ fields: ['name', 'status', 'userDid'] }, { fields: ['userDid'] }],
          timestamps: false,
        }
      );
    }

    public static associate(models) {
      Passport.belongsTo(models.User, {
        foreignKey: 'userDid',
        as: 'user',
      });

      Passport.hasMany(models.PassportLog, {
        foreignKey: 'passportId',
        as: 'logs',
        onDelete: 'CASCADE',
      });

      Passport.hasMany(models.Passport, {
        foreignKey: 'parentDid',
        as: 'children',
        onDelete: 'CASCADE',
      });

      Passport.belongsTo(models.Passport, {
        foreignKey: 'parentDid',
        as: 'parent',
      });
    }
  };
}
