import type { QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'blocklets', 'vaults', {
    type: JSONOrJSONB(),
    defaultValue: [],
  });
  await context.sequelize.query("UPDATE blocklets SET vaults = '[]' WHERE vaults IS NULL");
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'blocklets', 'vaults');
};
