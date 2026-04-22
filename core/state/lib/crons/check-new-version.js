/* eslint-disable no-param-reassign */
const semver = require('semver');
const listNpmPackageVersion = require('@abtnode/util/lib/list-npm-package-version');
const logger = require('@abtnode/logger')('@abtnode/core:maintain');
const { joinURL } = require('ufo');

const states = require('../states');

// eslint-disable-next-line no-unused-vars
const checkNewVersion = async (teamManager) => {
  try {
    const info = await states.node.read();

    if (!process.env.ABT_NODE_PACKAGE_NAME) {
      logger.error('ABT_NODE_PACKAGE_NAME name was not found in environment');
      return '';
    }

    const versions = await listNpmPackageVersion(process.env.ABT_NODE_PACKAGE_NAME, {
      includePrereleases: !!info.enableBetaRelease,
    });
    if (Array.isArray(versions) && versions.length) {
      const latestVersionStr = versions[0].version;
      const latestVersion = semver.coerce(latestVersionStr);
      const currentVersion = semver.coerce(info.version);
      if (latestVersionStr !== info.version && semver.gte(latestVersion, currentVersion)) {
        logger.info('New version found for Blocklet Server', {
          latestVersion: latestVersionStr,
          currentVersion: info.version,
          nextVersion: info.nextVersion,
        });
        await states.node.updateNodeInfo({ nextVersion: latestVersionStr });

        const actionPath = '/settings/about';
        const action = process.env.NODE_ENV === 'production' ? joinURL(info.routing.adminPath, actionPath) : actionPath;
        await teamManager.createNotification({
          title: 'Blocklet Server upgrade available',
          description: 'A new and improved version of blocklet server is now available',
          entityType: 'node',
          severity: 'info',
          sticky: true,
          action,
        });

        return latestVersionStr;
      }
    }

    return '';
  } catch (err) {
    logger.error('Failed to check new version for Blocklet Server', { error: err });
  }

  return '';
};

const getCron = (teamManager) => ({
  name: 'check-new-version',
  time: '0 0 8 * * *', // check every day
  // time: '0 */5 * * * *', // check every 5 minutes
  fn: async () => {
    const info = await states.node.read();
    if (!info.autoUpgrade) {
      return;
    }

    checkNewVersion(teamManager);
  },
  options: { runOnInit: false },
});

module.exports = { getCron, checkNewVersion };
