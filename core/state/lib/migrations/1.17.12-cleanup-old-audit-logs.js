/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const { createSequelize } = require('@abtnode/models');
const { getDbFilePath } = require('../util');

const RETENTION_DAYS = 90;

/**
 * Migration script to clean up old audit logs (> 90 days) in both server and blocklet databases.
 *
 * Background: audit_logs tables can grow very large (e.g., 2.5M rows / 3.9GB) due to
 * high-frequency operations like remoteSign. This migration performs a one-time cleanup
 * and VACUUM to reclaim disk space.
 */
module.exports = async ({ states, dataDir, printInfo }) => {
  printInfo('Cleaning up old audit logs (> 90 days)...');

  const cutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * RETENTION_DAYS);

  // 1. Clean server-level audit logs
  const serverRemoved = await states.auditLog.remove({ createdAt: { $lt: cutoff } });
  printInfo(`Removed ${serverRemoved} server audit logs`);

  // VACUUM server.db to reclaim disk space
  const serverDbPath = getDbFilePath(path.join(dataDir, 'core/server.db'));
  try {
    const serverSeq = createSequelize(serverDbPath);
    await serverSeq.query('VACUUM');
    printInfo('Server database vacuumed successfully');
  } catch (err) {
    printInfo(`Failed to vacuum server database: ${err.message}`);
  }

  // 2. Clean blocklet-level audit logs
  const blocklets = await states.blocklet.getBlocklets({}, { id: 1, environments: 1 });
  printInfo(`Found ${blocklets.length} blocklets to clean audit logs`);

  for (const blocklet of blocklets) {
    const env = (blocklet.environments || []).find((x) => x.key === 'BLOCKLET_DATA_DIR');
    if (!env) {
      continue;
    }

    const dbFile = path.join(env.value, 'blocklet.db');
    if (!fs.existsSync(dbFile)) {
      continue;
    }

    try {
      const dbPath = getDbFilePath(dbFile);
      const sequelize = createSequelize(dbPath);
      const cutoffDate = cutoff.toISOString();
      const [, meta] = await sequelize.query(`DELETE FROM audit_logs WHERE createdAt < '${cutoffDate}'`);
      const deletedCount = meta?.changes || 0;
      if (deletedCount > 0) {
        await sequelize.query('VACUUM');
        printInfo(`Blocklet ${blocklet.id}: removed ${deletedCount} audit logs, vacuumed`);
      }
    } catch (err) {
      // Table may not exist in some blocklet databases, skip gracefully
      printInfo(`Skipped blocklet ${blocklet.id}: ${err.message}`);
    }
  }

  printInfo('Audit log cleanup migration completed');
};
