import { describe, test, expect } from 'bun:test';
import { env } from '../src/env';

describe('env', () => {
  test('should work as expected', () => {
    expect(env).toHaveProperty('appId');
    expect(env).toHaveProperty('appPid');
    expect(env.appIds).toEqual([]);
    expect(env).toHaveProperty('appName');
    expect(env).toHaveProperty('appDescription');
    expect(env).toHaveProperty('appUrl');
    expect(env).toHaveProperty('isComponent');
    expect(env).toHaveProperty('dataDir');
    expect(env).toHaveProperty('cacheDir');
    expect(env).toHaveProperty('mode');
    expect(env).toHaveProperty('appStorageEndpoint');
    expect(env).toHaveProperty('serverVersion');
    expect(env.preferences).toEqual({});
  });
});
