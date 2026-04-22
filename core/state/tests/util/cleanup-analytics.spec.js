const { test, expect, describe, mock, beforeEach, afterEach } = require('bun:test');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const dayjs = require('@abtnode/util/lib/dayjs');
const { cleanupAnalyticsData } = require('../../lib/util/cleanup-analytics');

describe('cleanupAnalyticsData', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cleanup-analytics-'));
  });

  afterEach(() => {
    fs.removeSync(tmpDir);
  });

  test('should clean DB records older than 90 days by default', async () => {
    const removeMock = mock(() => 5);
    await cleanupAnalyticsData({
      trafficInsight: { remove: removeMock },
      dataDir: tmpDir,
      retainDays: 90,
    });

    expect(removeMock).toHaveBeenCalledTimes(1);
    const arg = removeMock.mock.calls[0][0];
    expect(arg.date).toBeDefined();
    expect(arg.date.$lt).toBe(dayjs().subtract(90, 'day').format('YYYY-MM-DD'));
  });

  test('should clean analytics files older than 90 days', async () => {
    const did = 'z1234567890';
    const analyticsDir = path.join(tmpDir, did, '.analytics');
    fs.ensureDirSync(analyticsDir);

    const oldDate = dayjs().subtract(100, 'day').format('YYYY-MM-DD');
    const recentDate = dayjs().subtract(10, 'day').format('YYYY-MM-DD');

    fs.writeFileSync(path.join(analyticsDir, `${oldDate}.html`), 'old');
    fs.writeFileSync(path.join(analyticsDir, `${oldDate}.json`), '{}');
    fs.writeFileSync(path.join(analyticsDir, `${recentDate}.html`), 'recent');
    fs.writeFileSync(path.join(analyticsDir, `${recentDate}.json`), '{}');

    await cleanupAnalyticsData({
      trafficInsight: { remove: mock(() => 0) },
      dataDir: tmpDir,
      retainDays: 90,
    });

    expect(fs.existsSync(path.join(analyticsDir, `${oldDate}.html`))).toBe(false);
    expect(fs.existsSync(path.join(analyticsDir, `${oldDate}.json`))).toBe(false);
    expect(fs.existsSync(path.join(analyticsDir, `${recentDate}.html`))).toBe(true);
    expect(fs.existsSync(path.join(analyticsDir, `${recentDate}.json`))).toBe(true);
  });

  test('should respect custom retainDays', async () => {
    const removeMock = mock(() => 0);
    await cleanupAnalyticsData({
      trafficInsight: { remove: removeMock },
      dataDir: tmpDir,
      retainDays: 30,
    });

    const arg = removeMock.mock.calls[0][0];
    expect(arg.date.$lt).toBe(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  });

  test('should not fail when DB remove throws', async () => {
    const did = 'z1234567890';
    const analyticsDir = path.join(tmpDir, did, '.analytics');
    fs.ensureDirSync(analyticsDir);

    const oldDate = dayjs().subtract(100, 'day').format('YYYY-MM-DD');
    fs.writeFileSync(path.join(analyticsDir, `${oldDate}.html`), 'old');

    await cleanupAnalyticsData({
      trafficInsight: {
        remove: mock(() => {
          throw new Error('db error');
        }),
      },
      dataDir: tmpDir,
      retainDays: 90,
    });

    // File cleanup should still proceed
    expect(fs.existsSync(path.join(analyticsDir, `${oldDate}.html`))).toBe(false);
  });

  test('should not throw when dataDir does not exist', async () => {
    const nonExistentDir = path.join(tmpDir, 'nonexistent');
    await cleanupAnalyticsData({
      trafficInsight: { remove: mock(() => 0) },
      dataDir: nonExistentDir,
      retainDays: 90,
    });
    // Should complete without error
  });

  test('should skip non-directory entries in dataDir', async () => {
    // Create a regular file in dataDir (not a DID directory)
    fs.writeFileSync(path.join(tmpDir, 'some-file.txt'), 'not a directory');

    const did = 'z1234567890';
    const analyticsDir = path.join(tmpDir, did, '.analytics');
    fs.ensureDirSync(analyticsDir);

    const oldDate = dayjs().subtract(100, 'day').format('YYYY-MM-DD');
    fs.writeFileSync(path.join(analyticsDir, `${oldDate}.html`), 'old');

    await cleanupAnalyticsData({
      trafficInsight: { remove: mock(() => 0) },
      dataDir: tmpDir,
      retainDays: 90,
    });

    // File in dataDir should be untouched, expired analytics file should be removed
    expect(fs.existsSync(path.join(tmpDir, 'some-file.txt'))).toBe(true);
    expect(fs.existsSync(path.join(analyticsDir, `${oldDate}.html`))).toBe(false);
  });

  test('should skip non-date files in analytics directory', async () => {
    const did = 'z1234567890';
    const analyticsDir = path.join(tmpDir, did, '.analytics');
    fs.ensureDirSync(analyticsDir);

    fs.writeFileSync(path.join(analyticsDir, 'config.json'), '{}');
    fs.writeFileSync(path.join(analyticsDir, 'readme.txt'), 'hello');

    await cleanupAnalyticsData({
      trafficInsight: { remove: mock(() => 0) },
      dataDir: tmpDir,
      retainDays: 90,
    });

    expect(fs.existsSync(path.join(analyticsDir, 'config.json'))).toBe(true);
    expect(fs.existsSync(path.join(analyticsDir, 'readme.txt'))).toBe(true);
  });
});
