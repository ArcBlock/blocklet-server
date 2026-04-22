import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, safeAddIndex } from '../../migrate';

const createNotificationMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'messages', 'expiredAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await safeAddIndex(context, 'messages', ['expiredAt'], { name: 'messages_expiredAt_index' });
  },
  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'messages', 'expiredAt');
    try {
      await context.removeIndex('messages', 'messages_expiredAt_index');
    } catch (error) {
      // Index may not exist
    }
  },
});

export const { up, down } = createNotificationMigration();
