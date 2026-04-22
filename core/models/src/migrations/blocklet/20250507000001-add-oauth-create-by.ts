import { QueryInterface, DataTypes } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await safeApplyColumnChanges(context, {
    oauth_clients: [
      {
        name: 'createdBy',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
    ],
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await removeColumnIfExists(context, 'oauth_clients', 'createdBy');
}
