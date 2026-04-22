import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists, changeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

// 新增字段
const columnsToAdd = () => {
  return {
    attachments: {
      type: JSONOrJSONB(),
      allowNull: true,
    },
    blocks: {
      type: JSONOrJSONB(),
      allowNull: true,
    },
    actions: {
      type: JSONOrJSONB(),
      allowNull: true,
    },
    componentDid: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    source: {
      type: DataTypes.ENUM('system', 'component', ''),
      allowNull: true,
      defaultValue: 'system',
    },
    type: {
      type: DataTypes.ENUM('notification', 'connect', 'feed', 'hi', 'passthrough'),
      allowNull: false,
      defaultValue: 'notification',
    },
  };
};

// eslint-disable-next-line import/prefer-default-export
export const up = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'notifications', 'receiver', {
    type: DataTypes.STRING(80),
    allowNull: true, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'action', {
    type: DataTypes.STRING(255),
    allowNull: true, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'entityType', {
    type: DataTypes.STRING(32),
    allowNull: true, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'entityId', {
    type: DataTypes.STRING(80),
    allowNull: true, // 修改为允许空值
  });
  // 冗余字段
  await removeColumnIfExists(context, 'notifications', 'updatedAt');

  for (const [columnName, columnDefinition] of Object.entries(columnsToAdd())) {
    // eslint-disable-next-line no-await-in-loop
    await addColumnIfNotExists(context, 'notifications', columnName, columnDefinition);
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'notifications', 'receiver', {
    type: DataTypes.STRING(80),
    allowNull: false, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'action', {
    type: DataTypes.STRING(255),
    allowNull: false, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'entityType', {
    type: DataTypes.STRING(32),
    allowNull: false, // 修改为允许空值
  });
  await changeColumnIfExists(context, 'notifications', 'entityId', {
    type: DataTypes.STRING(80),
    allowNull: false, // 修改为允许空值
  });
  await addColumnIfNotExists(context, 'notifications', 'updatedAt', {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  });

  await removeColumnIfExists(context, 'notifications', 'attachments');
  await removeColumnIfExists(context, 'notifications', 'blocks');
  await removeColumnIfExists(context, 'notifications', 'actions');
  await removeColumnIfExists(context, 'notifications', 'componentDid');
  await removeColumnIfExists(context, 'notifications', 'source');
  await removeColumnIfExists(context, 'notifications', 'type');
};
