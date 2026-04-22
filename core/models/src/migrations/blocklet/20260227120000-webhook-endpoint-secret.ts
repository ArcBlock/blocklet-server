import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

const createMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'webhook_endpoints', 'secret', {
      type: DataTypes.STRING(256),
      allowNull: true,
    });
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'webhook_endpoints', 'secret');
  },
});
export const { up, down } = createMigration();
