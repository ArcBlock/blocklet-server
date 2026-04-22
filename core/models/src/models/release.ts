import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';
import { generateRandomString, JSONOrJSONB } from '../util';

type ReleaseStatus = 'draft' | 'published';

export type ReleaseState = {
  id: string;
  projectId: string;
  blockletVersion: string;
  blockletTitle?: string;
  blockletDescription?: string;
  blockletSupport?: string;
  blockletCommunity?: string;
  blockletHomepage?: string;
  blockletRepository?: string;
  blockletLogo?: string;
  blockletIntroduction?: string;
  blockletScreenshots?: string[];
  blockletComponents?: { did: string; required: boolean }[];
  blockletResourceType?: string;
  blockletVideos?: string[];
  note: string;
  files: string;
  createdAt: Date;
  updatedAt: Date;
  status: ReleaseStatus;
  publishedStoreIds?: string[];
  uploadedResource?: string;
  blockletDocker?: {
    dockerImage: string;
    dockerArgs: (string[] | string)[];
    dockerEnvs: string[];
  };
  contentType?: string;
  blockletSingleton?: boolean;
};

export function createReleaseModel(): DynamicModel<ReleaseState> {
  return class Release extends Model<ReleaseState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        defaultValue: generateRandomString,
      },
      projectId: {
        type: DataTypes.STRING(64),
      },
      note: {
        type: DataTypes.STRING(64),
      },
      files: {
        type: JSONOrJSONB(),
      },
      blockletVersion: {
        type: DataTypes.STRING(64),
      },
      blockletTitle: {
        type: DataTypes.STRING(64),
      },
      blockletDescription: {
        type: DataTypes.STRING(256),
      },
      blockletLogo: {
        type: DataTypes.STRING(64),
      },
      blockletIntroduction: {
        type: DataTypes.STRING,
      },
      blockletScreenshots: {
        type: JSONOrJSONB(),
      },
      blockletComponents: {
        type: JSONOrJSONB(),
      },
      status: {
        type: DataTypes.STRING(16),
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
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          publishedStoreIds: {
            type: JSONOrJSONB(),
          },
          uploadedResource: {
            type: DataTypes.STRING,
            allowNull: true,
          },
          blockletResourceType: {
            type: DataTypes.ENUM('resource', 'pack', ''),
            defaultValue: '',
          },
          blockletSupport: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: true,
          },
          blockletCommunity: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: true,
          },
          blockletHomepage: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: true,
          },
          blockletRepository: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: true,
          },
          blockletVideos: {
            type: JSONOrJSONB(),
            defaultValue: [],
            allowNull: true,
          },
          blockletDocker: {
            type: JSONOrJSONB(),
            defaultValue: {
              dockerImage: '',
              dockerArgs: [],
              dockerEnvs: [],
            },
            allowNull: true,
          },
          contentType: {
            type: DataTypes.STRING(255),
            defaultValue: '',
            allowNull: true,
          },
          blockletSingleton: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Release',
          tableName: 'releases',
          timestamps: true,
        }
      );
    }
  };
}
