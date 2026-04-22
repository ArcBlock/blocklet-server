const { test, expect, describe } = require('bun:test');
const {
  listProviders,
  getProvider,
  getProviderNames,
  findExistsProvider,
  clearRouterByConfigKeyword,
} = require('../lib');
const NginxProvider = require('../lib/nginx');

describe('ProviderLib', () => {
  test('should support listProviders', async () => {
    const providers = await listProviders();
    expect(providers.length).toBeTruthy();
  });

  test('should support getProvider', async () => {
    const provider = await getProvider('nginx');
    expect(provider).toEqual(NginxProvider);

    const none = await getProvider('xxx');
    expect(none).toEqual(null);
  });

  test('should support getProviderNames', async () => {
    const providers = await getProviderNames();
    expect(providers).toEqual(['nginx', 'default']);
  });

  test('should support findExistsProvider', () => {
    const provider = findExistsProvider();
    expect(['nginx', 'default'].includes(provider)).toEqual(true);
  });

  test('should support clearRouterByConfigKeyword', async () => {
    let result = await clearRouterByConfigKeyword();
    expect(result).toEqual('');

    result = await clearRouterByConfigKeyword('/tmp');
    expect(['', 'default', 'nginx'].includes(result)).toBeTruthy();
  });
});
