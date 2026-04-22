import { DataTypes, Model } from 'sequelize';
import { TConnectEndpoint } from '@abtnode/types';
import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

type ProjectType = 'resource' | 'pack';

export interface ConnectedStore {
  storeId: string;
  storeName: string;
  storeUrl: string;
  accessToken: string;
  developerDid: string;
  developerEmail: string;
  developerName: string;
}

export type ProjectState = {
  id: string;
  type: ProjectType;
  blockletDid?: string;
  blockletVersion?: string;
  blockletTitle?: string;
  blockletDescription?: string;
  blockletLogo?: string;
  blockletIntroduction?: string;
  blockletScreenshots?: string[];
  createdAt: Date;
  updatedAt: Date;
  componentDid?: string;
  lastReleaseId?: string;
  lastReleaseFiles?: string;
  connectedStores?: ConnectedStore[];
  tenantScope?: string;
  createdBy?: string;
  messageId?: string;
  autoUpload?: boolean;
  possibleSameStore?: boolean;
  connectedEndpoints?: TConnectEndpoint[];
};

export function createProjectModel(): DynamicModel<ProjectState> {
  return class Project extends Model<ProjectState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.STRING(64),
        primaryKey: true,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(16),
      },
      blockletDid: {
        type: DataTypes.STRING(80),
        unique: true,
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
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      componentDid: {
        type: DataTypes.STRING(80),
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          lastReleaseId: {
            type: DataTypes.STRING(80),
          },
          lastReleaseFiles: {
            type: JSONOrJSONB(),
          },
          connectedStores: {
            type: JSONOrJSONB(),
            defaultValue: [],
          },
          tenantScope: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          createdBy: {
            type: DataTypes.STRING(128),
            allowNull: true,
          },
          messageId: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          autoUpload: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          possibleSameStore: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
          },
          connectedEndpoints: {
            type: JSONOrJSONB(),
            defaultValue: [],
          },
        },
        {
          sequelize,
          modelName: 'Project',
          tableName: 'projects',
          timestamps: true,
        }
      );
    }
  };
}
