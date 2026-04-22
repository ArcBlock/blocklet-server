/**
 * Add GIN index on sites.domainAliases for efficient domain alias lookups
 *
 * This migration adds a GIN index on the domainAliases jsonb column in PostgreSQL
 * to optimize queries using the @> operator for array containment checks.
 *
 * Performance benefits:
 * - Significantly faster domainExists() and findByDomainAlias() queries
 * - Essential for installations with thousands of sites
 * - GIN indexes are specifically designed for jsonb containment queries
 *
 * Note: SQLite doesn't support GIN indexes, but LIKE queries on JSON text
 * are acceptable for smaller datasets
 */
export const up = async ({ context }: any) => {
  const dialect = context.sequelize.getDialect();

  if (dialect === 'postgres') {
    // Add GIN index on domainAliases for efficient jsonb @> queries
    await context.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "sites_domainAliases_gin_index"
      ON "sites" USING GIN ("domainAliases")
    `);
  }
  // Note: SQLite doesn't support GIN indexes, but LIKE queries on JSON text
  // are acceptable for smaller datasets (< 1000 sites)
};

export const down = async ({ context }: any) => {
  const dialect = context.sequelize.getDialect();

  if (dialect === 'postgres') {
    try {
      await context.sequelize.query('DROP INDEX IF EXISTS "sites_domainAliases_gin_index"');
    } catch {
      // Index may not exist
    }
  }
};
