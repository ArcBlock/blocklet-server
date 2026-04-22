const getIP = require('@abtnode/util/lib/get-ip');
const { encode } = require('@abtnode/util/lib/base32');
const { DEFAULT_DID_DOMAIN } = require('@abtnode/constant');
const logger = require('@abtnode/logger')('@abtnode/core:ip');
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

let cache = null;
let pendingFetch = null; // Prevents concurrent fetches

const fetch = async (args = {}) => {
  try {
    const start = Date.now();
    const result = await getIP({ includeV6: true, timeout: 5000, ...args });
    cache = result;
    logger.info('refetch ip', { result, duration: Date.now() - start });
  } catch (err) {
    logger.error('failed to refetch ip', { error: err });
  }

  return cache;
};

const get = (args) => {
  if (cache) {
    return cache;
  }
  // Use pending promise to prevent concurrent fetches
  if (!pendingFetch) {
    pendingFetch = fetch(args).finally(() => {
      pendingFetch = null;
    });
  }
  return pendingFetch;
};

const cron = {
  name: 'refetch-ip',
  time: '0 */30 * * * *', // refetch every 30 minutes
  fn: fetch,
  options: { runOnInit: true, runInService: true },
};

/**
 * @description
 * @param {string} did
 * @return {Promise<boolean>}
 */
async function isDnsIpMappingCorrect(did) {
  try {
    const { internal, external } = await getIP();
    const didDomain = `${encode(did)}.${DEFAULT_DID_DOMAIN}`;
    const { address } = await lookup(didDomain, { rrtype: 'A' });

    return internal === address || external === address;
  } catch (error) {
    logger.error(error);
    return false;
  }
}

module.exports.fetch = fetch;
module.exports.get = get;
module.exports.cron = cron;
module.exports.isDnsIpMappingCorrect = isDnsIpMappingCorrect;
