import { DataTypes, QueryInterface } from 'sequelize';
import { getServerModels } from '../../models';
import { addColumnIfNotExists, createTableIfNotExists, removeColumnIfExists, safeAddIndex } from '../../migrate';

const models = getServerModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'passports', 'parentDid', { type: DataTypes.STRING(80), allowNull: true });
  await addColumnIfNotExists(context, 'passports', 'source', {
    type: DataTypes.ENUM('invite', 'recover', 'trusted', 'issue'),
    defaultValue: 'issue',
  });

  await createTableIfNotExists(context, 'passport_logs', models.PassportLog.GENESIS_ATTRIBUTES);

  await safeAddIndex(context, 'passport_logs', ['passportId']);
  await safeAddIndex(context, 'passport_logs', ['action']);
  await safeAddIndex(context, 'passport_logs', ['operatorDid']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'passports', 'parentDid');
  await removeColumnIfExists(context, 'passports', 'source');

  await context.removeIndex('passport_logs', ['passportId']);
  await context.removeIndex('passport_logs', ['action']);
  await context.removeIndex('passport_logs', ['operatorDid']);

  await context.dropTable('passport_logs');
};
