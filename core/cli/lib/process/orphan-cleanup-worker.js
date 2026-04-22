#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Orphan process cleanup worker (PM2 managed)
 *
 * This script runs as a PM2 process after server starts to clean up orphan daemon/service processes.
 * It will automatically remove itself from PM2 after completion.
 */

const { checkAndKillOrphanProcesses } = require('@abtnode/util/lib/pm2/check-orphan-processes');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const Logger = require('@abtnode/logger');
const {
  PROCESS_NAME_ORPHAN_CLEANUP,
  DAEMON_SCRIPT_PATH,
  SERVICE_SCRIPT_PATH,
  ORPHAN_CHECK_DELAY: DEFAULT_ORPHAN_CHECK_DELAY,
} = require('@abtnode/constant');

const logger = Logger('orphan-cleanup-worker', { filename: 'orphan-cleanup-worker' });

const ORPHAN_CHECK_DELAY = parseInt(process.env.ORPHAN_CHECK_DELAY || DEFAULT_ORPHAN_CHECK_DELAY, 10);

logger.info(`Orphan cleanup worker started, will check after ${ORPHAN_CHECK_DELAY}ms`);

setTimeout(async () => {
  try {
    // Cleanup daemon.js orphans
    await checkAndKillOrphanProcesses({
      scriptName: DAEMON_SCRIPT_PATH,
      logger,
      force: true, // Force mode to work from any PM2 context
    });

    // Cleanup service.js orphans
    await checkAndKillOrphanProcesses({
      scriptName: SERVICE_SCRIPT_PATH,
      logger,
      force: true,
    });

    logger.info('Orphan cleanup completed successfully');
  } catch (error) {
    logger.error(`Orphan cleanup failed: ${error.message}`);
  } finally {
    // Remove self from PM2 after cleanup to avoid record clutter
    try {
      await pm2.connectAsync();
      logger.info('Removing cleanup process from PM2...');
      await pm2.deleteAsync(PROCESS_NAME_ORPHAN_CLEANUP);
      logger.info('Cleanup process removed from PM2 successfully');
    } catch (err) {
      logger.warn(`Failed to remove cleanup process from PM2: ${err.message}`);
    } finally {
      pm2.disconnect();
      process.exit(0);
    }
  }
}, ORPHAN_CHECK_DELAY);

// Handle termination signals gracefully
process.on('SIGINT', () => {
  logger.info('Orphan cleanup worker received SIGINT, exiting');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Orphan cleanup worker received SIGTERM, exiting');
  process.exit(0);
});
