import { DataTypes, Model } from 'sequelize';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type ResponseHeaderPolicyState = {
  id: string;
  name: string;
  description?: string;
  cors?: any;
  securityHeader?: any;
  customHeader?: any;
  removeHeader?: any;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function createResponseHeaderPolicyModel(): DynamicModel<ResponseHeaderPolicyState> {
  return class ResponseHeaderPolicy extends Model<ResponseHeaderPolicyState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      name: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(256),
        allowNull: false,
      },
      cors: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      securityHeader: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      customHeader: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      removeHeader: {
        type: JSONOrJSONB(),
        allowNull: true,
      },
      isProtected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
          modelName: 'ResponseHeaderPolicy',
          tableName: 'response_header_policies',
          timestamps: true,
        }
      );
    }
  };
}
