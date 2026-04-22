import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'passports', 'scope', {
    type: DataTypes.ENUM('passport', 'kyc'),
    defaultValue: 'passport',
  });
  await context.bulkUpdate('passports', { scope: 'passport' }, {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'passports', 'scope');
};
