/* eslint-disable import/first */
import { test, expect, afterAll } from 'bun:test';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';

const appDataDir = path.join(os.tmpdir(), 'test-server-version-from-disk');
process.env.BLOCKLET_APP_DATA_DIR = appDataDir;

test('should work as expected', async () => {
  fs.outputJSONSync(path.join(process.env.BLOCKLET_APP_DATA_DIR, '/.config/config.json'), {
    env: { serverVersion: '8.8.8' },
  });
  const { default: ServerVersion } = await import(`../../src/util/server-version?t=${Date.now()}`);
  expect(ServerVersion.version).toBe('8.8.8');
});

afterAll(() => {
  fs.removeSync(appDataDir);
});
