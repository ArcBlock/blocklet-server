import { DataTypes, QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { addColumnIfNotExists, createTableIfNotExists, dropTableIfExists, removeColumnIfExists } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'verify_codes', models.VerifyCode.GENESIS_ATTRIBUTES);

  await addColumnIfNotExists(context, 'passports', 'scope', {
    type: DataTypes.ENUM('passport', 'kyc'),
    defaultValue: 'passport',
  });
  await context.bulkUpdate('passports', { scope: 'passport' }, {});
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await dropTableIfExists(context, 'verify_codes');
  await removeColumnIfExists(context, 'passports', 'scope');
};
