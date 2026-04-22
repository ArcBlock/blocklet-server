const { test, expect, describe, beforeAll, afterAll, mock } = require('bun:test');
const fs = require('fs');
const path = require('path');
const { doSchemaMigration } = require('@abtnode/models');
// eslint-disable-next-line import/no-extraneous-dependencies
const { getDbFilePath } = require('@abtnode/core/lib/util');

const states = require('../../states');
const Manager = require('../../libs/acme-manager');

const dataDir = `/tmp/certificate-manager-test/${Date.now()}}`;

describe('acme-manager', () => {
  let manager;

  beforeAll(async () => {
    await doSchemaMigration(getDbFilePath(path.join(dataDir, 'module.db')), 'certificate-manager');
    states.init(dataDir);
    manager = new Manager({
      dataDir,
      maintainerEmail: 'test-xx-nn@arcblock.io',
      staging: true,
      renewalRatio: 0.001, // Very small ratio to prevent renewal in tests (renew only when <= 0.1% of lifetime remains)
    });
  });

  afterAll(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }
  });

  describe('pushToJobQueue', () => {
    test('should push to queue if domain does not exists', async () => {
      const on = mock();
      manager.queue.push = mock().mockReturnValue({ on });
      await manager.pushToJobQueue('not-exist.test.com');

      expect(manager.queue.push).toHaveBeenCalled();
      expect(manager.queue.push).toHaveBeenCalled();
      expect(on).toHaveBeenCalledWith('failed', expect.any(Function));
    });

    test('should push to queue if domain already exists', async () => {
      const domain = 'exists.test.com';

      manager.queue.push = mock();
      manager.queue.get = mock().mockResolvedValue({ domain });

      await manager.pushToJobQueue(domain);

      expect(manager.queue.push).toBeCalledTimes(0);
    });
  });

  describe('renewal ratio logic', () => {
    test('should use default renewal ratio of 1/3 when not specified', () => {
      const defaultManager = new Manager({
        dataDir: `/tmp/test-default-${Date.now()}-${Math.random()}`,
        maintainerEmail: 'test@example.com',
        staging: true,
      });

      expect(defaultManager.renewalRatio).toBeCloseTo(1 / 3, 5);
    });

    test('should accept custom renewal ratio', () => {
      const customManager = new Manager({
        dataDir: `/tmp/test-custom-${Date.now()}-${Math.random()}`,
        maintainerEmail: 'test@example.com',
        staging: true,
        renewalRatio: 0.5,
      });

      expect(customManager.renewalRatio).toBe(0.5);
    });

    test('should reject negative renewal ratio', () => {
      expect(
        () =>
          new Manager({
            dataDir: `/tmp/test-negative-${Date.now()}-${Math.random()}`,
            maintainerEmail: 'test@example.com',
            staging: true,
            renewalRatio: -0.5,
          })
      ).toThrow('Invalid renewalRatio: -0.5. Must be a positive number.');
    });

    test('should reject NaN renewal ratio', () => {
      expect(
        () =>
          new Manager({
            dataDir: `/tmp/test-nan-${Date.now()}-${Math.random()}`,
            maintainerEmail: 'test@example.com',
            staging: true,
            renewalRatio: NaN,
          })
      ).toThrow('Invalid renewalRatio: NaN. Must be a positive number.');
    });

    test('should reject zero renewal ratio', () => {
      expect(
        () =>
          new Manager({
            dataDir: `/tmp/test-zero-${Date.now()}-${Math.random()}`,
            maintainerEmail: 'test@example.com',
            staging: true,
            renewalRatio: 0,
          })
      ).toThrow('Invalid renewalRatio: 0. Must be a positive number.');
    });

    test('should reject non-number renewal ratio', () => {
      expect(
        () =>
          new Manager({
            dataDir: `/tmp/test-string-${Date.now()}-${Math.random()}`,
            maintainerEmail: 'test@example.com',
            staging: true,
            renewalRatio: '0.5',
          })
      ).toThrow('Invalid renewalRatio: 0.5. Must be a positive number.');
    });
  });
});
