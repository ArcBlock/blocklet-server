/* eslint-disable no-await-in-loop */

/**
 * Migration script to populate startedAt/stoppedAt for existing blocklets
 *
 * This migration:
 * 1. Queries all blocklet IDs efficiently (only fetching `id` field)
 * 2. For each blocklet, calls syncUptimeStatus to populate startedAt/stoppedAt
 *    based on the running state of its children
 *
 * Uses silent: true internally to prevent updatedAt from being modified
 */
module.exports = async ({ states, printInfo }) => {
  printInfo('Try to populate blocklet uptime (startedAt/stoppedAt)...');

  // Query only the id field for efficiency
  const blocklets = await states.blocklet.model.findAll({
    attributes: ['id'],
    raw: true,
  });

  if (!blocklets || blocklets.length === 0) {
    printInfo('No blocklets found, skipping migration');
    return;
  }

  printInfo(`Found ${blocklets.length} blocklets to process`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const blocklet of blocklets) {
    try {
      // syncUptimeStatus handles all the logic:
      // - Checks if any child is running
      // - If running and no startedAt: sets startedAt from earliest child startedAt
      // - If not running and has startedAt without stoppedAt: sets stoppedAt = now
      // - Uses silent: true to prevent updatedAt modification
      await states.blocklet.syncUptimeStatus(blocklet.id);
      updatedCount++;
    } catch (err) {
      printInfo(`Skipped blocklet ${blocklet.id}: ${err.message}`);
      skippedCount++;
    }
  }

  printInfo(`Blocklet uptime migration completed: ${updatedCount} updated, ${skippedCount} skipped`);
};
