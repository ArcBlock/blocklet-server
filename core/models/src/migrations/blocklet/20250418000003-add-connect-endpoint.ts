import { QueryInterface } from 'sequelize';
import { removeColumnIfExists, safeApplyColumnChanges } from '../../migrate';
import { JSONOrJSONB } from '../../util';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeApplyColumnChanges(context, {
    projects: [
      {
        name: 'connectedEndpoints',
        field: {
          type: JSONOrJSONB(),
          defaultValue: JSON.stringify([]),
        },
      },
    ],
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'projects', 'connectedEndpoints');
};
