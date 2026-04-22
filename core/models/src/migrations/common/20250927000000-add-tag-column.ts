import { QueryInterface, DataTypes } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges, safeAddIndex } from '../../migrate';

const up = async ({ context }: { context: QueryInterface }) => {
  await safeApplyColumnChanges(context, {
    tags: [
      {
        name: 'slug',
        field: {
          type: DataTypes.STRING(128),
          allowNull: true,
        },
      },
      {
        name: 'type',
        field: {
          type: DataTypes.STRING(128),
          allowNull: true,
        },
      },
      {
        name: 'componentDid',
        field: {
          type: DataTypes.STRING(120),
          allowNull: true,
        },
      },
      {
        name: 'parentId',
        field: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        name: 'createdBy',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
      {
        name: 'updatedBy',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
    ],
  });

  await safeAddIndex(context, 'tags', ['slug'], { unique: true });
};

const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'tags', 'slug');
  await removeColumnIfExists(context, 'tags', 'type');
  await removeColumnIfExists(context, 'tags', 'componentDid');
  await removeColumnIfExists(context, 'tags', 'parentId');
  await removeColumnIfExists(context, 'tags', 'createdBy');
  await removeColumnIfExists(context, 'tags', 'updatedBy');
};

const createTagMigration = () => ({ up, down });

export default createTagMigration;
