import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, changeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

const columnsToAdd = () => {
  return {
    data: {
      type: JSONOrJSONB(),
      allowNull: true,
    },
    feedType: {
      type: DataTypes.ENUM('graphic', 'data_tracker', ''),
      allowNull: true,
    },
  };
};

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'notifications', 'description', {
    type: DataTypes.TEXT,
    allowNull: true, // 修改为允许空值
  });
  for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
    // eslint-disable-next-line no-await-in-loop
    await addColumnIfNotExists(context, 'notifications', columnName, columnDefinition);
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'notifications', 'description', {
    type: DataTypes.TEXT,
    allowNull: false,
  });
  await removeColumnIfExists(context, 'notifications', 'data');
  await removeColumnIfExists(context, 'notifications', 'feedType');
};
