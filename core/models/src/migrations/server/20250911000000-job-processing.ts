import { QueryInterface, DataTypes } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await addColumnIfNotExists(context, 'jobs', 'processingBy', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'jobs', 'processingAt', {
    type: DataTypes.BIGINT,
    allowNull: true,
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await removeColumnIfExists(context, 'jobs', 'processingBy');
  await removeColumnIfExists(context, 'jobs', 'processingAt');
}
