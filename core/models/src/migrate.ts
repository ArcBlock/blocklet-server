/* eslint-disable import/prefer-default-export */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import type { QueryInterface } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import createLogger from '@abtnode/logger';

import { createSequelize } from './models';

const logger = createLogger('@abtnode/models:migration');

const MIGRATION_SCRIPT_EXTENSION = process.env.MIGRATION_SCRIPT_EXTENSION || 'js';

// eslint-disable-next-line require-await
export async function doSchemaMigration(dbFile: string, group: string, migrationPostgres = false, label = '') {
  // 如果是迁移 blocklet，使用更小的连接池，以及释放连接的更快
  let poolConfig;
  if (migrationPostgres) {
    poolConfig = {
      max: 2,
      min: 1,
      idle: 10000,
      evict: 10000,
    };
  } else if (group === 'blocklet') {
    poolConfig = {
      max: 1,
      min: 0,
      idle: 3000,
      evict: 3000,
    };
  }

  const sequelize = createSequelize(dbFile, poolConfig ? { pool: poolConfig } : {});

  if (['server', 'blocklet', 'service', 'certificate-manager', 'connect'].includes(group) === false) {
    throw new Error(`Not supported group ${group} when migrate database schema`);
  }

  const umzug = new Umzug({
    migrations: { glob: [`migrations/${group}/*.${MIGRATION_SCRIPT_EXTENSION}`, { cwd: __dirname }] },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    // @ts-ignore
    logger: { info: (data) => logger.info(`progress ${label}`.trim(), data) },
  });
  return umzug.up();
}

type ColumnChanges = Record<string, { name: string; field: any }[]>;

export async function safeApplyColumnChanges(context: QueryInterface, changes: ColumnChanges) {
  for (const [table, columns] of Object.entries(changes)) {
    const schema = await context.describeTable(table);
    for (const { name, field } of columns) {
      if (!schema[name]) {
        await context.addColumn(table, name, field);

        if (field.defaultValue) {
          await context.bulkUpdate(table, { [name]: field.defaultValue }, {});
        }
      }
    }
  }
}

export const safeAddIndex = async (
  context: QueryInterface,
  table: string,
  indexes: string[],
  options?: any,
  maxLength?: number
) => {
  try {
    if (options?.maxLength) {
      // 对于前缀索引，使用 CREATE INDEX IF NOT EXISTS 语法
      await context.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "${table}_${indexes.join('_')}_prefix_idx"
        ON "${table}" (LEFT("${indexes[0]}", ${maxLength}))
      `);
    } else {
      // 检查索引是否已存在
      const tableIndexes = await context.showIndex(table);
      const existingIndexNames = Object.values(tableIndexes).map((index: any) => index.name);

      // 生成索引名称（如果没有在 options 中指定）
      const indexName = options?.name || `${table}_${indexes.join('_')}_index`;

      // 如果索引不存在，则创建
      if (!existingIndexNames.includes(indexName)) {
        await context.addIndex(table, indexes, { ...options, name: indexName });
      }
    }
  } catch (error) {
    console.error(`Failed to add index ${indexes} to table ${table}:`, error);
  }
};

export async function safeDescribeTable(qi: QueryInterface, table: string): Promise<Record<string, any>> {
  try {
    const schema = await qi.describeTable(table);
    return schema;
  } catch (err) {
    return {};
  }
}

export const addColumnIfNotExists = async (
  context: QueryInterface,
  table: string,
  column: string,
  field: any,
  options?: any
) => {
  const schema = await safeDescribeTable(context, table);
  if (schema[column]) {
    return;
  }

  await context.addColumn(table, column, field, options);
};

export const removeColumnIfExists = async (context: QueryInterface, table: string, column: string, options?: any) => {
  const schema = await safeDescribeTable(context, table);
  if (!schema[column]) {
    return;
  }

  await context.removeColumn(table, column, options);
};

export const changeColumnIfExists = async (
  context: QueryInterface,
  table: string,
  column: string,
  field: any,
  options?: any
) => {
  const schema = await safeDescribeTable(context, table);
  if (!schema[column]) {
    return;
  }

  await context.changeColumn(table, column, field, options);
};

export const createTableIfNotExists = async (context: QueryInterface, table: string, schema: any, options?: any) => {
  try {
    // 如果表存在，这里会成功返回描述信息
    await context.describeTable(table);
  } catch (err: any) {
    // 只有在“表不存在”的情况下才继续创建
    await context.createTable(table, schema, options);
  }
};

export const dropTableIfExists = async (context: QueryInterface, table: string) => {
  const tableSchema = await safeDescribeTable(context, table);
  if (!tableSchema) {
    return;
  }

  await context.dropTable(table);
};
