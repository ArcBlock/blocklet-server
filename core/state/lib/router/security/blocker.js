const { BLACKLIST_SCOPE } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:router:security:blocker');

const states = require('../../states');

async function cleanupExpiredBlacklist() {
  const result = await states.blacklist.removeExpiredByScope(BLACKLIST_SCOPE.ROUTER);
  logger.info('Cleanup router blacklists', { result });
}

async function getActiveBlacklist(justIp = true) {
  const result = await states.blacklist.findActiveByScope(BLACKLIST_SCOPE.ROUTER);
  return justIp ? result.map((item) => item.key) : result;
}

async function clearAllBlacklist() {
  const result = await states.blacklist.removeByScope(BLACKLIST_SCOPE.ROUTER);
  logger.info('Clear all router blacklists', { result });
}

module.exports = {
  getActiveBlacklist,
  cleanupExpiredBlacklist,
  clearAllBlacklist,
  getSecurityCrons: () => [
    {
      name: 'cleanup-router-blacklist',
      time: '0 0 * * * *', // refresh blocking list every hour
      fn: cleanupExpiredBlacklist,
      options: { runOnInit: process.env.ABT_NODE_JOB_NAME === 'cleanup-router-blacklist' },
    },
  ],
};
