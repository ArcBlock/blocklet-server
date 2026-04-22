import { QueryInterface, DataTypes } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export async function up({ context }: { context: QueryInterface }) {
  await changeColumnIfExists(context, 'releases', 'blockletIntroduction', {
    type: DataTypes.STRING(3000),
  });
  await changeColumnIfExists(context, 'projects', 'blockletIntroduction', {
    type: DataTypes.STRING(3000),
  });
}

export async function down({ context }: { context: QueryInterface }) {
  await changeColumnIfExists(context, 'releases', 'blockletIntroduction', {
    type: DataTypes.STRING(255),
  });
  await changeColumnIfExists(context, 'projects', 'blockletIntroduction', {
    type: DataTypes.STRING(255),
  });
}
