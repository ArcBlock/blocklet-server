const fs = require('fs-extra');
const path = require('path');
const dayjs = require('@abtnode/util/lib/dayjs');

const pkg = require('../../package.json');
// eslint-disable-next-line
const logger = require('@abtnode/logger')(`${pkg.name}:cleanup-analytics`);

const ANALYTICS_DIR = '.analytics';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}\.(html|json)$/;

async function cleanupAnalyticsData({ trafficInsight, dataDir, retainDays }) {
  const cutoffDate = dayjs().subtract(retainDays, 'day').format('YYYY-MM-DD');
  logger.info('Start cleanup analytics data', { cutoffDate, retainDays });

  // 1. Cleanup DB records
  try {
    const removed = await trafficInsight.remove({ date: { $lt: cutoffDate } });
    logger.info('Cleaned up analytics DB records', { removed });
  } catch (err) {
    logger.error('Failed to cleanup analytics DB records', { error: err });
  }

  // 2. Cleanup analytics files
  try {
    if (!fs.existsSync(dataDir)) {
      logger.debug('Data directory does not exist, skip file cleanup', { dataDir });
      return;
    }

    const entries = fs.readdirSync(dataDir, { withFileTypes: true });
    const expiredFiles = entries
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const analyticsDir = path.join(dataDir, entry.name, ANALYTICS_DIR);
        if (!fs.existsSync(analyticsDir)) {
          return [];
        }
        return fs
          .readdirSync(analyticsDir)
          .filter((file) => DATE_PATTERN.test(file) && file.split('.')[0] < cutoffDate)
          .map((file) => path.join(analyticsDir, file));
      });

    const results = await Promise.allSettled(expiredFiles.map((file) => fs.remove(file)));
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn('Some analytics files failed to cleanup', { succeeded, failed: failed.length });
    }
    logger.info('Cleaned up analytics files', { total: expiredFiles.length, succeeded, failed: failed.length });
  } catch (err) {
    logger.error('Failed to cleanup analytics files', { error: err });
  }
}

module.exports = { cleanupAnalyticsData };
