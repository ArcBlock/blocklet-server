const path = require('path');
const fs = require('fs');
const logger = require('@abtnode/logger')('@abtnode/core:event');

const states = require('../states');

const backupBlockletSites = async (blocklet) => {
  const sites = await states.site.getSitesByBlocklet(blocklet.meta.did);
  let backupFile = null;
  try {
    if (blocklet.env) {
      backupFile = path.join(blocklet.env.cacheDir, `sites-backup-${Date.now()}.json`);
      logger.info(`backup blocklet sites to ${backupFile}`, { did: blocklet.meta.did, sites });
      fs.writeFileSync(backupFile, JSON.stringify(sites));
      logger.info('backup blocklet sites', { did: blocklet.meta.did, backupFile });
    }
  } catch (error) {
    logger.error('backup blocklet sites error', { error });
  }

  return { sites, backupFile };
};

const rollbackBlockletSites = async ({ blocklet, sites, backupFile, handleBlockletRouting }) => {
  try {
    let sitesToRestore = sites;
    logger.info('rollback blocklet sites', { did: blocklet.meta.did, sites, backupFile });
    if (!sitesToRestore && backupFile && fs.existsSync(backupFile)) {
      sitesToRestore = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      logger.info('rollback sites from backup file', { did: blocklet.meta.did, backupFile });
    }

    if (!sitesToRestore) {
      logger.info('no blocklet sites to rollback', { did: blocklet.meta.did, sites, backupFile });
    }

    const promises = sitesToRestore.map((site) => states.site.update({ id: site.id }, { $set: { rules: site.rules } }));
    await Promise.all(promises);
    logger.info('rollback blocklet sites rules success to database', { did: blocklet.meta.did, sites, backupFile });

    // Trigger router reload after rollback
    await handleBlockletRouting({
      did: blocklet.meta.did,
      message: 'Roll back sites rules',
    });

    logger.info('rollback blocklet sites success', { did: blocklet.meta.did });
  } catch (error) {
    logger.error('rollback blocklet sites error', { error, blocklet, sites, backupFile });
  }
};

const cleanBlockletSitesBackup = (backupFile) => {
  if (!backupFile || !fs.existsSync(backupFile)) {
    logger.info('no backup file to clean', { backupFile });
    return;
  }

  fs.unlinkSync(backupFile);
  logger.info('clean backup sites', { backupFile });
};

module.exports = {
  backupBlockletSites,
  cleanBlockletSitesBackup,
  rollbackBlockletSites,
};
