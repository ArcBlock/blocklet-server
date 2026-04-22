const { describe, expect, test } = require('bun:test');
const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const runScript = require('../lib/run-script');
const sleep = require('../lib/sleep');

describe('runScript', () => {
  test('should throw on invalid param', () => {
    expect(() => runScript('node hook.js')).toThrow(/label is required/);
    expect(() => runScript('', 'hook')).toThrow(/script is required/);
  });

  test('should work as expected for script without throw', async () => {
    const result = await runScript(`node ${path.resolve(__dirname, '../tools/hook-no-throw.js')}`, 'no-throw');
    expect(result.code).toEqual(0);
  });

  test('should work as expected for script with throw', async () => {
    expect.assertions(2);
    try {
      await runScript(`node ${path.resolve(__dirname, '../tools/hook-with-throw.js')}`, 'with-throw');
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/from hook/);
    }
  });

  test('should work as expected for script with console error', async () => {
    const result = await runScript(`node ${path.resolve(__dirname, '../tools/hook-with-console.js')}`, 'with-console');
    expect(result.code).toEqual(0);
  });

  test('should work as expected for script with unhandled rejection', async () => {
    expect.assertions(2);
    try {
      await runScript(`node ${path.resolve(__dirname, '../tools/hook-with-reject.js')}`, 'with-reject');
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.message).toMatch(/from reject/);
    }
  });

  test('should work as expected for timeout', async () => {
    try {
      await runScript(`node ${path.resolve(__dirname, '../tools/hook-timeout.js')}`, 'timeout', { timeout: 2000 });
    } catch (err) {
      expect(err).toBeTruthy();
      expect(['Process timeout after 2 seconds', 'Process was killed with signal: SIGTERM']).toContain(err.message);
    }
  }, 4000);

  test('should work as expected for custom log file', async () => {
    const tmpDir = os.tmpdir();
    const error = path.join(tmpDir, 'run-script', 'error.log');
    const output = path.join(tmpDir, 'run-script', 'output.log');
    fs.removeSync(error);
    fs.removeSync(output);

    expect(fs.existsSync(output)).toBeFalsy();
    expect(fs.existsSync(error)).toBeFalsy();

    await runScript(`node ${path.resolve(__dirname, '../tools/hook-no-throw.js')}`, 'timeout', { output, error });
    await sleep(1000);

    expect(fs.readFileSync(output).toString()).toMatch('hook start');
    expect(fs.readFileSync(error).toString()).toMatch('hook done');

    fs.removeSync(error);
    fs.removeSync(output);
  });
});
