import { DataTypes, QueryInterface } from 'sequelize';
import { changeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'access_keys', 'passport', {
    type: DataTypes.STRING(80),
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await changeColumnIfExists(context, 'access_keys', 'passport', {
    type: DataTypes.STRING(16),
  });
};
