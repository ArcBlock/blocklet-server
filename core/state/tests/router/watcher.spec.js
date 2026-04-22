/* eslint-disable no-shadow */
const { describe, test, expect, beforeAll, afterAll, afterEach, mock } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');

const { readLogFile } = require('../../lib/router/watcher');

describe('LogWatcher', () => {
  const testDir = path.join(os.tmpdir(), Math.random().toString());

  beforeAll(() => {
    fs.ensureDirSync(testDir);
  });

  afterAll(() => {
    try {
      fs.removeSync(testDir);
    } catch (error) {
      console.error(error);
    }
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('readLogFile', () => {
    test('should read log file and return lines', async () => {
      const logFile = path.join(testDir, 'test.log');
      const logContent = 'line1\nline2\nline3';
      fs.writeFileSync(logFile, logContent);

      const { lines } = await readLogFile(logFile);
      expect(lines).toEqual(['line1', 'line2', 'line3']);
    });

    test('should handle empty file', async () => {
      const logFile = path.join(testDir, 'empty.log');
      fs.writeFileSync(logFile, '');

      const { lines } = await readLogFile(logFile);
      expect(lines).toEqual([]);
    });

    test('should handle non-existent file', async () => {
      const logFile = path.join(testDir, 'nonexistent.log');

      const { lines } = await readLogFile(logFile);
      expect(lines).toEqual([]);
    });

    test('should read from specified start position', async () => {
      const logFile = path.join(testDir, 'position.log');
      const logContent = 'line1\nline2\nline3';
      fs.writeFileSync(logFile, logContent);

      const { lines } = await readLogFile(logFile, 6); // Start after "line1\n"
      expect(lines).toEqual(['line2', 'line3']);
    });

    test('should handle negative start position', async () => {
      const logFile = path.join(testDir, 'negative.log');
      const logContent = 'line1\nline2\nline3';
      fs.writeFileSync(logFile, logContent);

      const { lines } = await readLogFile(logFile, -6); // Read last 6 bytes
      expect(lines).toEqual(['line3']);
    });

    test('should handle start position beyond file size', async () => {
      const logFile = path.join(testDir, 'beyond.log');
      const logContent = 'line1\nline2\nline3';
      fs.writeFileSync(logFile, logContent);

      const { lines } = await readLogFile(logFile, 1000);
      expect(lines).toEqual([]);
    });

    test('should handle start position equal to file size', async () => {
      const logFile = path.join(testDir, 'equal.log');
      const logContent = 'line1\nline2\nline3';
      fs.writeFileSync(logFile, logContent);
      const fileSize = fs.statSync(logFile).size;

      const { lines } = await readLogFile(logFile, fileSize);
      expect(lines).toEqual([]);
    });
  });
});
