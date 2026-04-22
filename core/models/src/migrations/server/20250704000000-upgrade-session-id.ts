import { QueryInterface, DataTypes } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await changeColumnIfExists(context, 'servers', 'upgradeSessionId', {
    type: DataTypes.STRING(128),
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await changeColumnIfExists(context, 'servers', 'upgradeSessionId', {
    type: DataTypes.STRING(32),
  });
}
