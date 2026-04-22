import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

const columnsToAdd = () => {
  return {
    activity: {
      type: JSONOrJSONB(),
      defaultValue: null,
    },
  };
};

const createNotificationMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await addColumnIfNotExists(context, 'notifications', columnName, columnDefinition);
    }
  },
  down: async ({ context }: { context: QueryInterface }) => {
    for (const [columnName] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await removeColumnIfExists(context, 'notifications', columnName);
    }
  },
});

export default createNotificationMigration;
