import { safeAddIndex } from '../../migrate';

/**
 * Add indexes for efficient blocklet DID lookups
 *
 * This migration adds indexes to support searching blocklets by:
 * - structV1Did (legacy migration field)
 * - meta.did (JSON field)
 * - migratedFrom[].appDid (JSON array field, PostgreSQL only via GIN)
 *
 * These indexes improve performance for getBlocklet() which searches by multiple DID fields
 */
export const up = async ({ context }: any) => {
  const dialect = context.sequelize.getDialect();

  // 1. Add index on structV1Did column (simple B-tree index)
  await safeAddIndex(context, 'blocklets', ['structV1Did']);

  // 2. Add expression index on meta.did (JSON field)
  if (dialect === 'postgres') {
    // PostgreSQL: Expression index on JSONB field
    await context.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "blocklets_meta_did_index"
      ON "blocklets" ((meta->>'did'))
    `);
  } else {
    // SQLite: Expression index on JSON field
    await context.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "blocklets_meta_did_index"
      ON "blocklets" (json_extract(meta, '$.did'))
    `);
  }

  // 3. Add GIN index on migratedFrom for PostgreSQL (enables efficient array search)
  if (dialect === 'postgres') {
    await context.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "blocklets_migratedFrom_gin_index"
      ON "blocklets" USING GIN ("migratedFrom")
    `);
  }
  // Note: SQLite doesn't support GIN indexes, but migratedFrom arrays are typically small (0-5 items)
  // so the EXISTS subquery with json_each is acceptable without an index
};

export const down = async ({ context }: any) => {
  const dialect = context.sequelize.getDialect();

  // Remove structV1Did index
  try {
    await context.removeIndex('blocklets', 'blocklets_structV1Did_index');
  } catch {
    // Index may not exist
  }

  // Remove meta.did expression index
  try {
    await context.sequelize.query('DROP INDEX IF EXISTS "blocklets_meta_did_index"');
  } catch {
    // Index may not exist
  }

  // Remove migratedFrom GIN index (PostgreSQL only)
  if (dialect === 'postgres') {
    try {
      await context.sequelize.query('DROP INDEX IF EXISTS "blocklets_migratedFrom_gin_index"');
    } catch {
      // Index may not exist
    }
  }
};
