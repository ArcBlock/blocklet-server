/* eslint-disable require-await */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable max-classes-per-file */

import { DBCache, getAbtNodeRedisAndSQLiteUrl } from '@abtnode/db-cache';

import { type Store, type Options, rateLimit as _rateLimit, ClientRateLimitInfo } from 'express-rate-limit';
import path from 'node:path';
import md5 from '@abtnode/util/lib/md5';

type RateLimitStoreOptions = {
  windowMs: number;
  prefix?: string;
  redisUrl?: string;
  sqlitePath?: string;
};

const isInTest = () => {
  return process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
};

/**
 * Store for rate limit
 */
export class RateLimitStore implements Store {
  private windowMs!: number;

  private dbCache: DBCache;

  constructor(options: RateLimitStoreOptions) {
    const serverUrls = getAbtNodeRedisAndSQLiteUrl();

    this.dbCache = new DBCache(() => ({
      prefix: 'rate',
      ttl: options.windowMs || 1000 * 60,
      redisUrl: options.redisUrl || serverUrls.redisUrl,
      sqlitePath: isInTest()
        ? 'sqlite::memory:'
        : options.sqlitePath || serverUrls.sqlitePath || path.join(process.env.BLOCKLET_DATA_DIR, 'rate-limit.db'),
    }));
    this.windowMs = options.windowMs;
  }

  async get(key: string) {
    if (!key) return null;

    try {
      const row = (await this.dbCache.get(key)) as {
        totalHits: number;
        resetTime: number;
      };
      return row
        ? {
            totalHits: row.totalHits,
            resetTime: new Date(row.resetTime),
          }
        : null;
    } catch (error) {
      console.error('[RateLimit] Error in get:', error);
      return null;
    }
  }

  async set(key: string, limitInfo: ClientRateLimitInfo) {
    if (!key) return;

    try {
      await this.dbCache.set(key, {
        totalHits: limitInfo.totalHits,
        resetTime: limitInfo.resetTime.getTime(),
      });
    } catch (error) {
      console.error('[RateLimit] Error in set:', error);
    }
  }

  async increment(key: string) {
    const defaultLimitInfo = {
      totalHits: 1,
      resetTime: new Date(Date.now() + this.windowMs),
    };

    if (!key) return defaultLimitInfo;

    try {
      await this.dbCache.acquire(key);
      let limitInfo = await this.get(key);

      // reset row if expired
      if (!limitInfo || limitInfo.resetTime.getTime() < Date.now()) {
        limitInfo = defaultLimitInfo;
      } else {
        limitInfo.totalHits += 1;
      }

      await this.set(key, limitInfo);

      return limitInfo;
    } catch (error) {
      console.error('[RateLimit] Error in increment:', error);
      return defaultLimitInfo;
    } finally {
      await this.dbCache.releaseLock(key);
    }
  }

  async decrement(key: string): Promise<void> {
    if (!key) return;

    try {
      await this.dbCache.acquire(key);
      const row = await this.get(key);
      if (row) {
        await this.set(key, {
          totalHits: Math.max(0, row.totalHits - 1),
          resetTime: row.resetTime,
        });
      }
    } catch (error) {
      console.error('[RateLimit] Error in decrement:', error);
    } finally {
      await this.dbCache.releaseLock(key);
    }
  }

  async resetKey(key: string) {
    try {
      await this.dbCache.del(key);
    } catch (error) {
      console.error('[RateLimit] Error in resetKey:', error);
    }
  }
}

function getIp(req) {
  return req.headers?.['x-real-ip'] || req.ip || req._remoteAddress || (req.connection && req.connection.remoteAddress);
}

/**
 * express-rate-limit middleware with custom store
 */
export function createRateLimiter(
  options: Partial<Options> & { prefix?: string; redisUrl?: string; sqlitePath?: string }
) {
  const store = new RateLimitStore({
    prefix: options.prefix,
    windowMs: options.windowMs || 1000 * 60,
    redisUrl: options.redisUrl,
    sqlitePath: options.sqlitePath,
  });

  return _rateLimit({
    store,
    windowMs: 1000 * 60,
    limit: 10,
    legacyHeaders: false,
    ...options,
    keyGenerator: (req, res) => {
      const key = options.keyGenerator ? options.keyGenerator(req, res) : getIp(req);

      if (!key) return null;

      // @ts-ignore
      const did = req.getBlockletDid ? req.getBlockletDid() : 'blocklet';
      const prefix = options.prefix || 'prefix';

      return md5(`${did}:${prefix}:${key}`);
    },
  });
}
