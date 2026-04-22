import { QueryInterface, DataTypes } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await safeApplyColumnChanges(context, {
    webhook_attempts: [
      {
        name: 'triggeredBy',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
      {
        name: 'triggeredFrom',
        field: {
          type: DataTypes.STRING(80),
          allowNull: true,
        },
      },
    ],
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await removeColumnIfExists(context, 'webhook_attempts', 'triggeredBy');
  await removeColumnIfExists(context, 'webhook_attempts', 'triggeredFrom');
}
