import { QueryInterface, DataTypes } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  const dialect = context.sequelize.getDialect();
  if (dialect !== 'postgres') {
    return;
  }
  await changeColumnIfExists(context, 'audit_logs', 'ip', {
    type: DataTypes.STRING(128),
  });

  await changeColumnIfExists(context, 'users', 'phone', {
    type: DataTypes.STRING(64),
    allowNull: true,
  });

  await changeColumnIfExists(context, 'traffic_insights', 'date', {
    type: DataTypes.STRING(40),
    allowNull: false,
  });
}

export async function down({ context }: { context: QueryInterface }) {
  const dialect = context.sequelize.getDialect();
  if (dialect !== 'postgres') {
    return;
  }
  await changeColumnIfExists(context, 'audit_logs', 'ip', {
    type: DataTypes.STRING(32),
  });

  await changeColumnIfExists(context, 'users', 'phone', {
    type: DataTypes.STRING(36),
    allowNull: true,
  });

  await changeColumnIfExists(context, 'traffic_insights', 'date', {
    type: DataTypes.STRING(10),
    allowNull: false,
  });
}
