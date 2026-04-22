import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  await addColumnIfNotExists(context, 'passports', 'parentDid', { type: DataTypes.STRING(80), allowNull: true });
  await addColumnIfNotExists(context, 'passports', 'source', {
    type: DataTypes.ENUM('invite', 'recover', 'trusted', 'issue'),
  });

  const indexes = [
    { fields: ['passportId'], name: 'passport_logs_passport_id' },
    { fields: ['action'], name: 'passport_logs_action' },
    { fields: ['operatorDid'], name: 'passport_logs_operator_did' },
  ];

  const tableIndexes = await context.showIndex('passport_logs');
  const existingIndexNames = Object.values(tableIndexes).map((index: any) => index.name);

  for (const index of indexes) {
    if (!existingIndexNames.includes(index.name)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await context.addIndex('passport_logs', index.fields, { name: index.name });
      } catch (error) {
        console.error(`Failed to create index ${index.name}:`, error);
      }
    }
  }
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await removeColumnIfExists(context, 'passports', 'parentDid');
  await removeColumnIfExists(context, 'passports', 'source');

  const indexNames = ['passport_logs_passport_id', 'passport_logs_action', 'passport_logs_operator_did'];

  const tableIndexes = await context.showIndex('passport_logs');
  const existingIndexNames = Object.values(tableIndexes).map((index: any) => index.name);

  for (const indexName of indexNames) {
    if (existingIndexNames.includes(indexName)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await context.removeIndex('passport_logs', indexName);
      } catch (error) {
        console.error(error);
      }
    }
  }
  await context.dropTable('passport_logs');
};
