import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type OauthCodeState = {
  id: number;
  code: string;
  challenge: string;
  scopes: string[];
  clientId: string;
  userDid: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function createOauthCodeModel(): DynamicModel<OauthCodeState> {
  return class OauthCode extends Model<OauthCodeState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING(256),
        allowNull: false,
        unique: true,
      },
      challenge: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      scopes: {
        type: JSONOrJSONB(),
        allowNull: false,
      },
      clientId: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      userDid: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(this.GENESIS_ATTRIBUTES, {
        sequelize,
        modelName: 'OauthCode',
        tableName: 'oauth_codes',
        timestamps: true,
        indexes: [
          { fields: ['code'] },
          { fields: ['clientId'] },
          { fields: ['userDid'] },
          { fields: ['expiresAt'] },
          { fields: ['userDid', 'clientId'] },
        ],
      });
    }

    public static associate(models): void {
      OauthCode.belongsTo(models.OauthClient, {
        foreignKey: 'clientId',
        targetKey: 'clientId',
        as: 'client',
      });
      OauthCode.belongsTo(models.User, {
        foreignKey: 'userDid',
        targetKey: 'did',
        as: 'user',
      });
    }
  };
}
