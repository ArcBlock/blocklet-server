import { DataTypes, QueryInterface } from 'sequelize';
import { safeApplyColumnChanges, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await safeApplyColumnChanges(context, {
    servers: [
      {
        name: 'registerInfo',
        field: {
          type: DataTypes.JSON,
        },
      },
    ],
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'servers', 'registerInfo');
};
