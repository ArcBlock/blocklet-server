import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'verify_codes', 'purpose', {
    type: DataTypes.ENUM('login', 'kyc'),
    defaultValue: 'kyc',
  });
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'verify_codes', 'purpose');
};
