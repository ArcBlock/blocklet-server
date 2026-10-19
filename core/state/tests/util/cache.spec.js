const { describe, test, expect, beforeEach, afterEach } = require('bun:test');
const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const { getCacheProvider } = require('../../lib/util/cache');

describe('getCacheProvider', () => {
  let routerDir;
  let node;

  beforeEach(() => {
    routerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-spec-'));
    node = { dataDirs: { router: routerDir }, getRouterProvider: () => undefined };
  });

  afterEach(() => {
    fs.rmSync(routerDir, { recursive: true, force: true });
  });

  test('should return initialized provider when available', () => {
    const provider = { clearCache: () => [] };
    expect(getCacheProvider({ ...node, getRouterProvider: () => provider }, 'nginx')).toBe(provider);
  });

  test('should clear cache dir when provider is not initialized', () => {
    const cacheDir = path.join(routerDir, 'nginx', 'cache');
    fs.outputFileSync(path.join(cacheDir, 'app1', 'a', 'file'), 'x');
    fs.outputFileSync(path.join(cacheDir, 'app2', 'b', 'file'), 'x');

    const provider = getCacheProvider(node, 'nginx');
    expect(provider.clearCache('app1')).toEqual([path.join(cacheDir, 'app1')]);
    expect(fs.existsSync(path.join(cacheDir, 'app1'))).toBe(true);
    expect(fs.readdirSync(path.join(cacheDir, 'app1'))).toEqual([]);
    expect(fs.existsSync(path.join(cacheDir, 'app2', 'b', 'file'))).toBe(true);

    expect(provider.clearCache()).toEqual([cacheDir]);
    expect(fs.readdirSync(cacheDir)).toEqual([]);
  });

  test('should return empty when cache dir does not exist', () => {
    const provider = getCacheProvider(node, 'default');
    expect(provider.clearCache()).toEqual([]);
    expect(provider.searchCache('foo')).toEqual([]);
  });

  test('should search cache files by key', () => {
    const cacheDir = path.join(routerDir, 'nginx', 'cache');
    const hit = path.join(cacheDir, 'app1', 'a', 'hit');
    fs.outputFileSync(hit, '\u0000\u0001binary\nKEY: https://example.com/foo.png\nHTTP/1.1 200 OK\n');
    fs.outputFileSync(path.join(cacheDir, 'app1', 'b', 'miss'), '\nKEY: https://example.com/bar.png\n');

    const provider = getCacheProvider(node, 'nginx');
    expect(provider.searchCache('foo.png', 'app1')).toEqual([hit]);
    expect(provider.searchCache('')).toEqual([]);
  });
});
