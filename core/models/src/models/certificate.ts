// Storage for multi-queue job storage
import { DataTypes, Model } from 'sequelize';
import { TCertificate } from '@abtnode/types';
import { generateId, JSONOrJSONB } from '../util';
import { DynamicModel } from '../types';

export type CertificateState = Omit<TCertificate, 'name' | 'matchedSites'> & {
  privateKey: string;
  public: boolean;
  name: string;
};

export function createCertificateModel(): DynamicModel<CertificateState> {
  return class Certificate extends Model<CertificateState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(80),
        primaryKey: true,
        defaultValue: generateId,
      },
      domain: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false,
      },
      privateKey: {
        type: DataTypes.TEXT,
      },
      certificate: {
        type: DataTypes.TEXT,
      },
      isProtected: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      source: {
        type: DataTypes.STRING(32),
      },
      meta: {
        type: JSONOrJSONB(),
        defaultValue: {},
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
          status: {
            type: DataTypes.STRING,
          },
          name: {
            type: DataTypes.STRING(64),
          },
        },
        {
          sequelize,
          indexes: [{ fields: ['domain', 'id'] }],
          modelName: 'Certificate',
          tableName: 'certificates',
          timestamps: true,
        }
      );
    }
  };
}
