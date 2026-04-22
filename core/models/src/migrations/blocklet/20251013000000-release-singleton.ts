import { QueryInterface, DataTypes } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await addColumnIfNotExists(context, 'releases', 'blockletSingleton', {
    type: DataTypes.BOOLEAN,
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await removeColumnIfExists(context, 'releases', 'blockletSingleton');
}
