import { QueryInterface } from 'sequelize';

const createCleanupMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    // truncate all messages that may cause join channel error
    const dialect = context.sequelize.getDialect();
    if (dialect === 'postgres') {
      await context.sequelize.query('TRUNCATE TABLE messages');
    } else {
      // SQLite doesn't support TRUNCATE, use DELETE instead
      await context.sequelize.query('DELETE FROM messages');
    }
  },
  down: async () => {
    // do nothing
  },
});

export const { up, down } = createCleanupMigration();
