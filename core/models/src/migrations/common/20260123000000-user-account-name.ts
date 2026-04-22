import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, safeAddIndex } from '../../migrate';

const createUserMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'users', 'name', {
      type: DataTypes.STRING(32),
      allowNull: true,
    });
    await safeAddIndex(context, 'users', ['name'], { name: 'users_name_index', unique: true });
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'users', 'name');
    try {
      await context.removeIndex('users', 'users_name_index');
    } catch (error) {
      // Index may not exist
    }
  },
});

export default createUserMigration;
