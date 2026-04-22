import { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'connections', 'config', { type: JSONOrJSONB() });
  await addColumnIfNotExists(context, 'connections_v2', 'config', { type: JSONOrJSONB() });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'connections', 'config');
  await removeColumnIfExists(context, 'connections_v2', 'config');
};
