import { QueryInterface, DataTypes } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  // 之前是枚举，现在改成字符串
  await changeColumnIfExists(context, 'webhook_attempts', 'status', {
    type: DataTypes.STRING(80),
    allowNull: false,
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await changeColumnIfExists(context, 'webhook_attempts', 'status', {
    type: DataTypes.STRING(80),
    allowNull: false,
  });
}
