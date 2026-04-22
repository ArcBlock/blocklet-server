import { QueryInterface, DataTypes } from 'sequelize';
import { safeAddIndex, addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await addColumnIfNotExists(context, 'jobs', 'entityId', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await safeAddIndex(context, 'jobs', ['entityId']);
}

export async function down({ context }: { context: QueryInterface }) {
  await removeColumnIfExists(context, 'jobs', 'entityId');
}
