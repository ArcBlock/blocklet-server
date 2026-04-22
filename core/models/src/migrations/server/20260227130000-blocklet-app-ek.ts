import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

const createMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'blocklets', 'appEk', {
      type: DataTypes.STRING(256),
      allowNull: true,
    });
    await addColumnIfNotExists(context, 'blocklet_children', 'appEk', {
      type: DataTypes.STRING(256),
      allowNull: true,
    });
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'blocklets', 'appEk');
    await removeColumnIfExists(context, 'blocklet_children', 'appEk');
  },
});
export const { up, down } = createMigration();
