import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

const createUserMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'users', 'createdByAppPid', {
      type: DataTypes.STRING(80),
      allowNull: true,
    });
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'users', 'createdByAppPid');
  },
});
export const { up, down } = createUserMigration();
