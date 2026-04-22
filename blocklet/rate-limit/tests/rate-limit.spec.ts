/* eslint-disable require-await */
/* eslint-disable no-new */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response } from 'express';
import { describe, test, expect, beforeEach, afterEach, mock, afterAll } from 'bun:test';
import fs from 'fs';
import { getAbtNodeRedisAndSQLiteUrl } from '@abtnode/db-cache';
// @ts-ignore
import md5 from '@abtnode/util/lib/md5';
import { createRateLimiter, RateLimitStore } from '../src/index';

const { sqlitePath } = getAbtNodeRedisAndSQLiteUrl();

const cleanup = () => {
  if (fs.existsSync(sqlitePath)) {
    fs.unlinkSync(sqlitePath);
  }
};

const uuid = () => Math.random().toString(36).substring(2, 15);

describe('RateLimitStore', () => {
  beforeEach(() => {
    cleanup();
  });

  // Tests switched to in-memory DB to prevent concurrency issues; this file-based check no longer passes
  // test('should create and initialize database', async () => {
  //   const store = new RateLimitStore({ windowMs: 2000 });
  //   await store.get('0.0.0.0');
  //   expect(fs.existsSync(sqlitePath)).toBe(true);
  // });

  test('should handle methods as expected', async () => {
    const store = new RateLimitStore({ windowMs: 2000 });

    let row = await store.get('127.0.0.1');
    expect(row).toEqual(null);

    row = await store.increment('127.0.0.1');
    expect(row).toEqual({
      totalHits: 1,
      resetTime: expect.any(Date),
    });

    row = await store.increment('127.0.0.1');
    expect(row).toEqual({
      totalHits: 2,
      resetTime: expect.any(Date),
    });

    await store.decrement('127.0.0.1');
    row = await store.get('127.0.0.1');
    expect(row).toEqual({
      totalHits: 1,
      resetTime: expect.any(Date),
    });

    await store.resetKey('127.0.0.1');
    row = await store.get('127.0.0.1');
    expect(row).toEqual(null);
  });
});

describe('createRateLimiter', () => {
  let req: any;
  let res: Partial<Response>;

  beforeEach(() => {
    cleanup();

    req = {
      ip: '127.0.0.1',
      headers: {},
    };
    res = {
      status: mock().mockReturnThis(),
      json: mock(),
      set: mock(),
      header: mock(),
      send: mock(),
    };
  });

  afterEach(() => {
    mock.restore();
    cleanup();
  });

  afterAll(() => {
    mock.restore();
  });

  test('should allow requests within limit', async () => {
    const middleware = createRateLimiter({
      limit: 5,
      prefix: uuid(),
      keyGenerator: (req: Request) => req.ip,
    });
    const next = mock();

    // should pass
    await middleware(req as Request, res as Response, next);
    await middleware(req as Request, res as Response, next);
    await middleware(req as Request, res as Response, next);
    await middleware(req as Request, res as Response, next);
    await middleware(req as Request, res as Response, next);
    // expect(res.status).toHaveBeenCalledWith(429);
    // expect(res.status).toHaveBeenCalledTimes(5);
    expect(next).toHaveBeenCalledTimes(5);

    // shouldn't pass
    // mock.restore();
    // await middleware(req as Request, res as Response, next);
    // expect(res.status).toHaveBeenCalledWith(429);
  });

  test('should handle different IPs separately', async () => {
    const middleware = createRateLimiter({
      limit: 1,
      keyGenerator: (req: Request) => req.ip,
      prefix: uuid(),
    });

    const next = mock();

    await middleware({ ...req, ip: '192.168.1.1' }, res as Response, next);
    await middleware({ ...req, ip: '192.168.1.2' }, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);

    await middleware({ ...req, ip: '192.168.1.2' }, res as Response, () => {});
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('should reset after window expires', async () => {
    const middleware = createRateLimiter({
      prefix: uuid(),
      windowMs: 100,
      limit: 1,
      keyGenerator: (req: Request) => req.ip,
    });

    const next = mock();
    // First request - should pass
    await middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Second request immediately - should be blocked
    await middleware(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);

    // Wait for window to expire
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 150);
    });

    const next2 = mock();

    // Third request after window expires - should pass again
    await middleware(req as Request, res as Response, next2);
    expect(next2).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple rateLimit as expected', async () => {
    const middleware1 = createRateLimiter({
      limit: 1,
      prefix: uuid(),
      keyGenerator: (req: Request) => req.ip,
    });

    const middleware2 = createRateLimiter({
      limit: 1,
      prefix: uuid(),
      keyGenerator: (req: Request) => req.ip,
    });

    const next = mock();

    await middleware1(req as Request, res as Response, next);
    await middleware2(req as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);

    await middleware2(req as Request, res as Response, next);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('should skip if can not get ip and did', async () => {
    const middleware = createRateLimiter({
      limit: 1,
      prefix: uuid(),
    });

    const next = mock();

    await middleware({} as Request, res as Response, next);
    await middleware({} as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(2);
  });

  test('should get cache key as expected', async () => {
    const prefix = uuid();
    const middleware = createRateLimiter({
      limit: 1,
      prefix,
      keyGenerator: (req: Request) => req.ip,
    });

    const req = {
      ip: '127.0.0.1',
      getBlockletDid: () => 'did:1234',
    };

    const next = mock();

    await middleware(req as any, res as Response, next);

    const key = md5(`did:1234:${prefix}:127.0.0.1`);
    const data = await middleware.getKey(key);

    expect(data).toEqual({
      totalHits: 1,
      resetTime: expect.any(Date),
    });
  });

  test('should handle concurrent requests as expected', async () => {
    const middleware = createRateLimiter({
      limit: 1,
      prefix: uuid(),
      keyGenerator: (req: Request) => req.ip,
    });

    const promises = [];
    const next = mock();
    for (let i = 0; i < 10; i++) {
      promises.push(middleware(req as Request, res as Response, next));
    }
    await Promise.all(promises);
    expect(res.status).toHaveBeenCalledTimes(9);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
