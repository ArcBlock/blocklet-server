import { DataTypes, Model } from 'sequelize';
import { OAUTH_SCOPES } from '@abtnode/constant';
import { TOauthClient } from '@abtnode/types';

import { DynamicModel } from '../types';
import { JSONOrJSONB } from '../util';

export type OauthClientState = Omit<TOauthClient, 'createdUser'> & {
  id: number;
};

export function createOauthClientModel(): DynamicModel<OauthClientState> {
  return class OauthClient extends Model<OauthClientState> {
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      redirectUris: {
        type: JSONOrJSONB(),
        allowNull: false,
        defaultValue: [],
      },
      tokenEndpointAuthMethod: {
        type: DataTypes.STRING(255),
      },
      grantTypes: {
        type: JSONOrJSONB(),
        allowNull: false,
        defaultValue: ['authorization_code', 'refresh_token'],
        validate: {
          isValidGrants(value) {
            if (!Array.isArray(value)) {
              throw new Error('Grants must be an array');
            }
            const validGrants = ['authorization_code', 'client_credentials', 'refresh_token'];
            const invalidGrants = value.filter((grant) => !validGrants.includes(grant));
            if (invalidGrants.length > 0) {
              throw new Error(`Invalid grants: ${invalidGrants.join(', ')}`);
            }
          },
        },
      },
      responseTypes: {
        type: JSONOrJSONB(),
        allowNull: false,
        defaultValue: [],
      },
      clientName: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      clientUri: {
        type: DataTypes.STRING(512),
      },
      logoUri: {
        type: DataTypes.STRING(512),
      },
      scope: {
        type: DataTypes.STRING(512), // Increased length for multiple scopes
        allowNull: false,
        defaultValue: 'profile:read',
        validate: {
          isValidScopes(value: string) {
            if (typeof value !== 'string') {
              throw new Error('Scope must be a space-separated string');
            }
            const scopes = value.split(' ').filter(Boolean);
            const validScopes = Object.keys(OAUTH_SCOPES);
            const invalidScopes = scopes.filter((scope) => !validScopes.includes(scope));
            if (invalidScopes.length > 0) {
              throw new Error(`Invalid scopes: ${invalidScopes.join(', ')}`);
            }
          },
        },
        comment: 'Space-separated scope string following OAuth2 spec',
      },
      contacts: {
        type: JSONOrJSONB(),
        allowNull: true,
        defaultValue: [],
      },
      tosUri: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      policyUri: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      jwksUri: {
        type: DataTypes.STRING(512),
        allowNull: true,
      },
      jwks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      softwareId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      softwareVersion: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientId: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      clientSecret: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientIdIssuedAt: {
        type: DataTypes.BIGINT,
        defaultValue: null,
        get() {
          return Number(this.getDataValue('clientIdIssuedAt'));
        },
      },
      clientSecretExpiresAt: {
        type: DataTypes.BIGINT,
        allowNull: true,
        get() {
          return Number(this.getDataValue('clientSecretExpiresAt'));
        },
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
          createdBy: {
            type: DataTypes.STRING(128),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'OauthClient',
          tableName: 'oauth_clients',
          createdAt: 'clientIdIssuedAt',
          updatedAt: 'updatedAt',
          timestamps: true,
          indexes: [{ fields: ['clientId'] }],
        }
      );
    }

    public static associate(): void {}
  };
}
