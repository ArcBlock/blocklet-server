// FIXME: use a crash safe store for the limiter
const dayjs = require('@abtnode/util/lib/dayjs');
const { BLACKLIST_SCOPE } = require('@abtnode/constant');
const { RateLimiterMemory } = require('rate-limiter-flexible');

const logger = require('@abtnode/logger')('@abtnode/core:router:security:limiter');

const states = require('../../states');

/**
 * Check if an IP is a loopback or private address that should never be blocked.
 * Blocking these IPs can cause the server to lock itself out.
 */
function isSkippedIP(ip) {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '0.0.0.0' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

/**
 * Create a rate limiter for suspicious requests.
 * https://github.com/animir/node-rate-limiter-flexible/wiki/Options
 *
 * @param {{
 *   windowSize: number;
 *   windowQuota: number;
 *   blockDuration: number;
 * }} options
 * @param {(entry: { scope: string, key: string, expiresAt: number }) => void} onBlocked
 * @returns {{ check: (ip: string, points?: number) => Promise<number> }}
 */
function createLimiter(options, onBlocked = () => {}) {
  const limiter = new RateLimiterMemory({
    points: options.windowQuota,
    duration: options.windowSize,
    blockDuration: options.blockDuration,
  });

  logger.info('Rate limiter created', { options });

  const check = async (ip, points = 1) => {
    if (isSkippedIP(ip)) {
      logger.debug('Skipping private/loopback IP from rate limiting', { ip });
      return 0;
    }

    try {
      const result = await limiter.consume(ip, points);
      logger.debug('Rate limit not exceeded', { ip, result });
    } catch (err) {
      logger.info('Rate limit has exceeded', { ip, err });
      const expiresAt = dayjs().add(err.msBeforeNext, 'ms').unix();
      const added = await states.blacklist.addItem(BLACKLIST_SCOPE.ROUTER, ip, expiresAt);

      if (added) {
        logger.info('User IP blocked', { ip, expiresAt });
        onBlocked({ scope: BLACKLIST_SCOPE.ROUTER, key: ip, expiresAt });
        return err.msBeforeNext;
      }
    }

    return 0;
  };

  return {
    check,
  };
}

module.exports = {
  createLimiter,
};
