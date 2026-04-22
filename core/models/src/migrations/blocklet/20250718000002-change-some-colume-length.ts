import { QueryInterface, DataTypes } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  const dialect = context.sequelize.getDialect();
  if (dialect !== 'postgres') {
    return;
  }
  await changeColumnIfExists(context, 'users', 'phone', {
    type: DataTypes.STRING(64),
    allowNull: true,
  });

  await changeColumnIfExists(context, 'verify_codes', 'code', {
    type: DataTypes.STRING(32),
    allowNull: false,
  });

  await changeColumnIfExists(context, 'user_sessions', 'ua', {
    type: DataTypes.STRING(1024),
  });
}

export async function down({ context }: { context: QueryInterface }) {
  const dialect = context.sequelize.getDialect();
  if (dialect !== 'postgres') {
    return;
  }
  await changeColumnIfExists(context, 'users', 'phone', {
    type: DataTypes.STRING(36),
    allowNull: true,
  });

  await changeColumnIfExists(context, 'verify_codes', 'code', {
    type: DataTypes.STRING(8),
    allowNull: false,
  });

  await changeColumnIfExists(context, 'user_sessions', 'ua', {
    type: DataTypes.STRING(512),
  });
}
