import { DataTypes, QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeApplyColumnChanges } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'access_keys', models.AccessKey.GENESIS_ATTRIBUTES);

  await safeApplyColumnChanges(context, {
    access_keys: [
      {
        name: 'authType',
        field: {
          type: DataTypes.ENUM('simple', 'signature'),
          defaultValue: 'signature',
        },
      },
      {
        name: 'componentDid',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
      {
        name: 'createdVia',
        field: {
          type: DataTypes.ENUM('sdk', 'web', 'connect'),
          defaultValue: 'web',
        },
      },
      {
        name: 'resourceType',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
      {
        name: 'resourceId',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
      {
        name: 'expireAt',
        field: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
    ],
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'access_keys');
};
