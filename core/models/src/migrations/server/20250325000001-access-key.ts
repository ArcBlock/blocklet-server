import { DataTypes, QueryInterface } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
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

  await context.bulkUpdate('access_keys', { createdVia: 'web' }, { createdVia: null });

  await context.bulkUpdate('access_keys', { authType: 'signature' }, { authType: null });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'access_keys', 'authType');
  await removeColumnIfExists(context, 'access_keys', 'componentDid');
  await removeColumnIfExists(context, 'access_keys', 'createdVia');
  await removeColumnIfExists(context, 'access_keys', 'resourceType');
  await removeColumnIfExists(context, 'access_keys', 'resourceId');
};
