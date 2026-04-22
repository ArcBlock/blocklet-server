import { QueryInterface } from 'sequelize';
import { safeAddIndex } from '../../migrate';

export const up = async ({ context }: { context: QueryInterface }) => {
  try {
    await safeAddIndex(context, 'blocklets', ['createdAt']);
    await safeAddIndex(context, 'blocklets', ['structV1Did']);
    await safeAddIndex(context, 'sites', ['domain']);
    await safeAddIndex(context, 'users', ['lastLoginAt']);
    await safeAddIndex(context, 'users', ['inviter']);
    await safeAddIndex(context, 'tagging', ['taggableType', 'taggableId']);
    await safeAddIndex(context, 'audit_logs', ['scope', 'createdAt']);
    await safeAddIndex(context, 'audit_logs', ['createdAt']);
    await safeAddIndex(context, 'backups', ['appPid', 'createdAt']);
    await safeAddIndex(context, 'notifications', ['createdAt']);
    await safeAddIndex(context, 'permissions', ['type', 'createdAt']);

    const dialect = context.sequelize.getDialect();
    if (dialect === 'postgres') {
      // PostgreSQL 要求 JSONB 列才有 ->> 操作符，且表达式索引需双括号
      await context.sequelize.query(`
        CREATE INDEX blocklets_meta_did
          ON blocklets ((meta ->> 'did'));
      `);
    } else {
      // SQLite（含 JSON1 扩展）用 json_extract
      await context.sequelize.query(`
        CREATE INDEX blocklets_meta_did
          ON blocklets (json_extract(meta, '$.did'));
      `);
    }
  } catch (err) {
    console.error('Failed to add server indexes', err);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const down = async ({ context }: { context: QueryInterface }) => {};
