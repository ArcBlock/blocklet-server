import { DataTypes, QueryInterface } from 'sequelize';
import { safeAddIndex, addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

const columnsToAdd = () => ({
  orgId: {
    type: DataTypes.STRING(80),
    allowNull: true,
    references: {
      model: 'orgs',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
});

const createRbacMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    const promises = [];
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
      promises.push(addColumnIfNotExists(context, 'permissions', columnName, columnDefinition));
    }
    await Promise.all(promises);

    // 添加 orgId 索引
    await safeAddIndex(context, 'permissions', ['orgId'], {
      name: 'permissions_orgId_index',
    });

    // 添加 (orgId, name) 复合索引
    await safeAddIndex(context, 'permissions', ['orgId', 'name'], {
      name: 'permissions_orgId_name_index',
    });
  },

  down: async ({ context }: { context: QueryInterface }) => {
    await context.removeIndex('permissions', ['orgId', 'name']);
    await context.removeIndex('permissions', ['orgId']);
    const promises = [];
    for (const [columnName] of Object.entries(columnsToAdd())) {
      promises.push(removeColumnIfExists(context, 'permissions', columnName));
    }
    await Promise.all(promises);
  },
});

export default createRbacMigration;
