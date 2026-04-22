import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

const columnsToAdd = () => {
  return {
    address: {
      type: JSONOrJSONB(),
      defaultValue: {},
    },
  };
};

const createUserMigration = () => ({
  up: async ({ context }: { context: QueryInterface }) => {
    for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await addColumnIfNotExists(context, 'users', columnName, columnDefinition);
    }
  },
  down: async ({ context }: { context: QueryInterface }) => {
    for (const [columnName] of Object.entries(columnsToAdd())) {
      // eslint-disable-next-line no-await-in-loop
      await removeColumnIfExists(context, 'users', columnName);
    }
  },
});

export default createUserMigration;
