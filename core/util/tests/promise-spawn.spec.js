const { describe, expect, test } = require('bun:test');
const path = require('path');
const promiseSpawn = require('../lib/promise-spawn');

const { retryFn } = promiseSpawn;

const slowlyScriptFile = path.join(__dirname, '../tools/slow-script.js');
const errorScriptFile = path.join(__dirname, '../tools/error-script.js');

describe('promiseSpawn', () => {
  test('fast command should execute successfully', async () => {
    const startTime = performance.now();
    const output = await promiseSpawn('echo "hello" && echo "world"', {}, { timeout: 5000 });
    expect(output.trim()).toBe('hello\nworld');
    expect(performance.now() - startTime).toBeLessThan(1000);
  });

  test('should execute command successfully', async () => {
    const output = await promiseSpawn(
      `echo "hello" && node ${slowlyScriptFile} && echo "world"`,
      {},
      { timeout: 1000 * 10 }
    );
    expect(output.trim()).toBe('hello\nworld');
  });

  test('should fail for invalid command', async () => {
    try {
      await promiseSpawn(`echo "retry test" && node ${errorScriptFile}`, {}, { timeout: 3000 });
      throw new Error('This line should not be reached: should fail for invalid command');
    } catch (e) {
      expect(!!e.message).toBe(true);
    }
  });

  test('should timeout if command takes too long', async () => {
    try {
      await promiseSpawn(`node ${slowlyScriptFile}`, {}, { timeout: 500 });
      throw new Error('This line should not be reached: should timeout if command takes too long');
    } catch (e) {
      expect(e.message).toMatch(/timed out/);
    }
  }, 10000);

  test('should not retry the command if it success', async () => {
    const startTime = performance.now();
    const output = await promiseSpawn('echo "retry test"', {}, { timeout: 1000, retry: 3 });
    expect(output).toMatch(/retry test/);
    expect(performance.now() - startTime).toBeLessThan(1000 * 2.9);
  });

  test('should retry the command if it timeout', async () => {
    const startTime = performance.now();
    try {
      await promiseSpawn(`node ${slowlyScriptFile}`, {}, { timeout: 500, retry: 5 });
    } catch (e) {
      expect(e.message).toMatch(/timed out/);
    }
    expect(performance.now() - startTime).toBeGreaterThanOrEqual(500 * 3);
    expect(performance.now() - startTime).toBeLessThanOrEqual(3000 * 3);
  });

  test('should not retry the command if it failed', async () => {
    try {
      await promiseSpawn(`echo "retry test" && node ${errorScriptFile}`, {}, { timeout: 6000, retry: 2 });
    } catch (e) {
      expect(e.message).toMatch(/error script/);
    }
  });

  test('should throw error for empty command', async () => {
    try {
      await promiseSpawn('', {}, { timeout: 1000 });
      throw new Error('This line should not be reached');
    } catch (e) {
      expect(e.message).toMatch(/Command is empty/);
    }
  });

  test('retryFn promise', async () => {
    let n = 0;
    await retryFn(async () => {
      n++;
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });
    }, 3);
    expect(n).toBe(1);
  });

  test('retryFn with error', async () => {
    let n = 0;
    try {
      await retryFn(() => {
        n++;
        throw new Error('test');
      }, 3);
      throw new Error('This line should not be reached');
    } catch (e) {
      expect(e.message).toBe('test');
    }
    expect(n).toBe(3);
  });
});
