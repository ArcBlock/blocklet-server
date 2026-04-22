const { expect, describe, it, beforeAll, afterAll } = require('bun:test');
const path = require('path');
const os = require('os');

const { ensureBun, getBunCacheDir, BUN_VERSION, bunOptions } = require('../../lib/util/ensure-bun');

const baseIgnoreWhichBun = process.env.ABT_NODE_IGNORE_WHICH_BUN;
beforeAll(() => {
  process.env.ABT_NODE_IGNORE_WHICH_BUN = 'true';
});
afterAll(() => {
  process.env.ABT_NODE_IGNORE_WHICH_BUN = baseIgnoreWhichBun;
});

describe('ensureBun', () => {
  const homeDir = os.homedir();
  it('should create install dir and install bun if not found', async () => {
    const bunPath = await ensureBun();

    expect(bunPath).toBe(path.join(homeDir, '.blocklet-bun', 'core', 'bun-install', BUN_VERSION, 'bin', 'bun'));
  });
});

describe('getBunCacheDir', () => {
  const homeDir = os.homedir();

  it('should return docker cache dir on non-Linux', async () => {
    bunOptions.baseDockerOs = os.type();
    const dir = await getBunCacheDir(true);
    expect(dir).toBe(path.join(homeDir, '.blocklet-bun', 'tmp', 'bun-cache'));
  });

  it('should return docker cache dir on non-Linux', async () => {
    bunOptions.baseDockerOs = 'other OS';
    const dir = await getBunCacheDir(true);
    expect(dir).toBe(path.join(homeDir, '.blocklet-bun', 'tmp', 'bun-cache-docker'));
  });

  it('should return default cache dir on Linux', async () => {
    const dir = await getBunCacheDir(false);
    expect(dir).toBe(path.join(homeDir, '.blocklet-bun', 'tmp', 'bun-cache'));
  });

  it('should create cache dir if not exists', async () => {
    const dir = await getBunCacheDir();
    expect(dir).toBe(path.join(homeDir, '.blocklet-bun', 'tmp', 'bun-cache'));
  });
});
