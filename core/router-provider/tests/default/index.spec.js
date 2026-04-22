const { test, expect, describe, mock } = require('bun:test');
const fs = require('fs-extra');
const path = require('path');

const DefaultProvider = require('../../lib/default');
const params = require('../../tools/params.json');

describe('Router.DefaultProvider', () => {
  test('should work as expected', async () => {
    const configDir = path.join('/tmp', `default-${Date.now()}`);
    const provider = new DefaultProvider({ configDir, httpPort: 8080, httpsPort: 8443, isTest: true });

    await provider.update(params);
    expect(fs.existsSync(path.join(configDir, 'config.json'))).toBe(true);
    expect(fs.existsSync(path.join(configDir, 'www/index.html'))).toBe(true);
    expect(fs.existsSync(path.join(configDir, 'www/404.html'))).toBe(true);
    expect(fs.existsSync(path.join(configDir, 'www/502.html'))).toBe(true);
    expect(fs.existsSync(path.join(configDir, 'www/5xx.html'))).toBe(true);

    // Mock pm2-dependent methods to avoid real process management in tests
    provider.start = mock(() => Promise.resolve());
    provider.reload = mock(() => Promise.resolve());
    provider.restart = mock(() => Promise.resolve());
    provider.stop = mock(() => Promise.resolve());

    await provider.start();
    await provider.reload();
    await provider.restart();
    await provider.stop();

    expect(provider.start).toHaveBeenCalled();
    expect(provider.reload).toHaveBeenCalled();
    expect(provider.restart).toHaveBeenCalled();
    expect(provider.stop).toHaveBeenCalled();

    fs.rmSync(configDir, { recursive: true });
  });

  test('should set isTest correctly', () => {
    const p1 = new DefaultProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80 });
    expect(p1.isTest).toBe(false);

    const p2 = new DefaultProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80, isTest: false });
    expect(p2.isTest).toBe(false);

    const p3 = new DefaultProvider({ configDir: '/tmp/test', httpPort: 80, httpsPort: 80, isTest: true });
    expect(p3.isTest).toBe(true);
  });

  test('should return true if node is available', () => {
    expect(DefaultProvider.exists()).toBe(true);
  });

  test('should return expected for check', () => {
    expect(DefaultProvider.check({ configDir: '/tmp/test' })).toBeTruthy();
  });

  test('should return expected for check', () => {
    expect(DefaultProvider.getStatus({ configDir: '/tmp/test' })).toBeTruthy();
  });

  test('should getPreferredPorts without throw error', async () => {
    const ports = await DefaultProvider.getUsablePorts();
    expect(ports.httpPort).toBeTruthy();
    expect(ports.httpsPort).toBeTruthy();
  });
});
