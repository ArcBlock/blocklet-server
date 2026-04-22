import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'projects', 'lastReleaseId', {
    type: DataTypes.STRING(80),
    allowNull: true,
  });
  await addColumnIfNotExists(context, 'projects', 'lastReleaseFiles', {
    type: JSONOrJSONB(),
    allowNull: true,
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'projects', 'lastReleaseId');
  await removeColumnIfExists(context, 'projects', 'lastReleaseFiles');
};
