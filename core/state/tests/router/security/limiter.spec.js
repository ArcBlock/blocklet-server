const { describe, it, expect, mock, afterAll } = require('bun:test');

mock.module('rate-limiter-flexible', () => ({
  RateLimiterMemory: mock(),
}));

mock.module('../../../lib/states', () => ({
  blacklist: {
    findOne: mock(),
    insert: mock(),
    update: mock(),
    addItem: mock(),
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { BLACKLIST_SCOPE } = require('@abtnode/constant');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const states = require('../../../lib/states');
const { createLimiter } = require('../../../lib/router/security/limiter');

describe('router/security/limiter', () => {
  const testIp = '203.0.113.1';
  const options = {
    points: 5,
    duration: 60,
    blockDuration: 3600,
  };

  it('should skip loopback and private IPs', async () => {
    const consumeMock = mock().mockResolvedValue();
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));

    const instance = createLimiter(options);

    const skippedIPs = ['127.0.0.1', '::1', '0.0.0.0', '10.0.0.1', '192.168.1.1', '172.16.0.1', '172.31.255.255'];
    for (const ip of skippedIPs) {
      // eslint-disable-next-line no-await-in-loop
      const result = await instance.check(ip);
      expect(result).toBe(0);
    }

    expect(consumeMock).not.toHaveBeenCalled();
  });

  it('should not skip public IPs', async () => {
    const consumeMock = mock().mockResolvedValue();
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));

    const instance = createLimiter(options);
    await instance.check('203.0.113.1');

    expect(consumeMock).toHaveBeenCalledTimes(1);
  });

  it('should successfully consume points when under limit', async () => {
    const consumeMock = mock().mockResolvedValue();
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));

    const instance = createLimiter(options);
    await instance.check(testIp);

    expect(consumeMock).toHaveBeenCalledTimes(1);
    expect(consumeMock).toHaveBeenCalledWith(testIp, 1);
  });

  it('should create new blacklist entry when limit exceeded', async () => {
    const msBeforeNext = 3600000;
    const consumeMock = mock().mockRejectedValue({ msBeforeNext });
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));
    states.blacklist.findOne.mockResolvedValue(null);

    const instance = createLimiter(options);
    await instance.check(testIp);

    expect(states.blacklist.addItem).toHaveBeenCalledWith(BLACKLIST_SCOPE.ROUTER, testIp, expect.any(Number));
  });

  it('should update existing blacklist entry when limit exceeded', async () => {
    const msBeforeNext = 3600000;
    const consumeMock = mock().mockRejectedValue({ msBeforeNext });
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));
    const existingEntry = { id: 'test-id' };
    states.blacklist.findOne.mockResolvedValue(existingEntry);

    const instance = createLimiter(options);
    await instance.check(testIp);
    expect(states.blacklist.update).not.toHaveBeenCalled();
  });

  it('should consume custom points amount', async () => {
    const consumeMock = mock().mockResolvedValue();
    RateLimiterMemory.mockImplementation(() => ({
      consume: consumeMock,
    }));

    const instance = createLimiter(options);
    const customPoints = 3;
    await instance.check(testIp, customPoints);

    expect(consumeMock).toHaveBeenCalledWith(testIp, customPoints);
  });
});
