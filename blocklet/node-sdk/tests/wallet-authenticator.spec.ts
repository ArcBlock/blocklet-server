import { fromRandom } from '@ocap/wallet';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { WalletAuthenticator } from '../src/wallet-authenticator';
import { setEnvironment, clearEnvironment } from '../tools/environment';

describe('WalletAuthenticator', () => {
  const OLD_ENV = process.env;
  const params = {
    baseUrl: 'https://www.arcblock.io',
    request: {
      headers: {
        'x-group-path-prefix': '/publicUrl',
        'x-path-prefix': '/publicUrl',
        'x-blocklet-did': 'abcd',
      },
    },
    wallet: fromRandom(),
  };
  beforeAll(() => {
    process.env.BLOCKLET_APP_VERSION = '1.0.0';
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });
  beforeEach(() => {
    setEnvironment();
  });
  test('api should be a function', () => {
    expect(typeof WalletAuthenticator).toEqual('function');
  });
  test('should config appInfo as expected', async () => {
    const auth = new WalletAuthenticator({
      appInfo: {
        description: 'custom description',
      },
    });
    const appInfo = await (auth as any).getAppInfo(params);
    expect(appInfo.nodeDid).toBe(process.env.ABT_NODE_DID);
    expect(appInfo.updateSubEndpoint).toBe(true);
    expect(appInfo.subscriptionEndpoint).toBe('/publicUrl/.well-known/service/websocket');
    expect(appInfo.name).toBe(process.env.BLOCKLET_APP_NAME);
    expect(appInfo.link).toBe(params.baseUrl);
    expect(appInfo.icon).toBe('https://www.arcblock.io/.well-known/service/blocklet/logo?v=1.0.0');
    expect(appInfo.description).toBe('custom description');
  });
  test('should config chainInfo as expected', async () => {
    const backup = process.env.CHAIN_HOST;
    // none
    process.env.CHAIN_HOST = '';
    const auth1 = new WalletAuthenticator() as any;
    const chainInfo1 = await auth1.getChainInfo({}, undefined);
    expect(chainInfo1).toEqual({ host: 'none', id: 'none', type: 'arcblock' });
    // from environment
    process.env.CHAIN_HOST = 'http://chain.io';
    const auth2 = new WalletAuthenticator() as any;
    await expect(auth2.getChainInfo({}, undefined)).resolves.toEqual({
      host: process.env.CHAIN_HOST,
      id: 'none',
      type: 'arcblock',
    });
    // from custom
    process.env.CHAIN_HOST = 'http://chain.io';
    const auth3 = new WalletAuthenticator({
      chainInfo: { type: 'arcblock', host: 'https://beta.abtnetwork.io/api/', id: 'custom' },
    }) as any;
    await expect(auth3.getChainInfo({}, undefined)).resolves.toEqual({
      type: 'arcblock',
      host: 'https://beta.abtnetwork.io/api/',
      id: 'custom',
    });
    process.env.CHAIN_HOST = backup;
  });
  test('should throw error if environment variable is not defined', () => {
    clearEnvironment();
    expect(() => new WalletAuthenticator()).toThrow();
  });
});
