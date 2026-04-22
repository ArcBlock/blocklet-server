/* eslint-disable require-await */
import { describe, it, expect, beforeEach, afterEach, afterAll, spyOn, mock } from 'bun:test';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import { fromRandom } from '@ocap/wallet';
import { SIG_VERSION } from '@blocklet/constant';

import { getSignData } from '../../src/util/verify-sign';

const wallet = fromRandom();

describe('service-api', () => {
  let serviceApi: any;
  let originalAdapter: AxiosAdapter | undefined;

  const now = Date.now();
  const dateSpy = spyOn(Date, 'now').mockReturnValue(now);

  const iat = Math.floor(now / 1000);
  const exp = iat + 60 * 5;

  beforeEach(async () => {
    process.env.BLOCKLET_APP_SK = wallet.secretKey;
    process.env.CHAIN_TYPE = 'default';
    process.env.BLOCKLET_DID = 'blocklet-did';
    process.env.BLOCKLET_REAL_DID = 'blocklet-component-did';

    // Re-import to ensure instances and interceptors are initialized with the env above
    ({ default: serviceApi } = await import('../../src/util/service-api'));

    // Record original adapter for restoration
    originalAdapter = serviceApi.defaults.adapter;
  });

  afterEach(() => {
    // Restore default adapter (or undefined so axios chooses the environment adapter)
    serviceApi.defaults.adapter = originalAdapter;
    mock.restore();
  });

  afterAll(() => {
    mock.restore();
    dateSpy.mockRestore();
  });

  it('should work with service api get', async () => {
    // Install in-memory adapter for this test case
    serviceApi.defaults.adapter = async (config: any): Promise<AxiosResponse> => {
      if ((config.method || 'get').toLowerCase() === 'get' && config.url === '/test/get') {
        return {
          data: {
            name: 'test',
            avatar: 'bn:/test-avatar',
            did: 'mock-did',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    };

    const { sig } = await getSignData({
      data: {},
      method: 'get',
      params: { name: 'test', avatar: '64x64' },
      url: '/.well-known/service/test/get',
    });

    const result = await serviceApi.get('/test/get', {
      params: { name: 'test', avatar: '64x64' },
    });

    expect(result.config.headers['x-blocklet-server-version']).toBe('1.16.33');
    expect(result.config.headers['User-Agent']).toBe('BlockletSDK/1.16.33');
    expect(result.config.headers['x-blocklet-did']).toBe('blocklet-did');
    expect(result.config.headers['x-blocklet-component-id']).toBe('blocklet-component-did');
    expect(result.config.headers['x-blocklet-sig']).toBe(sig);
    expect(result.config.headers['x-blocklet-sig-iat']).toBe(String(iat));
    expect(result.config.headers['x-blocklet-sig-exp']).toBe(String(exp));
    expect(result.config.headers['x-blocklet-sig-version']).toBe(SIG_VERSION.DEFAULT);
  });

  it('should work with service api post', async () => {
    serviceApi.defaults.adapter = async (config: any): Promise<AxiosResponse> => {
      if ((config.method || 'post').toLowerCase() === 'post' && config.url === '/test/post') {
        return {
          data: {
            name: 'test',
            avatar: 'bn:/test-avatar',
            did: 'mock-did',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    };

    const { sig } = await getSignData({
      data: { name: 'test', avatar: '64x64' },
      method: 'post',
      params: {},
      url: '/.well-known/service/test/post',
    });

    const result = await serviceApi.post('/test/post', { name: 'test', avatar: '64x64' });
    expect(result.config.headers['x-blocklet-sig']).toBe(sig);
  });

  it('should work with post, contain query params in url', async () => {
    serviceApi.defaults.adapter = async (config: any): Promise<AxiosResponse> => {
      if ((config.method || 'post').toLowerCase() === 'post' && config.url === '/test/post?flag=new') {
        return {
          data: {
            name: 'test',
            avatar: 'bn:/test-avatar',
            did: 'mock-did',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    };

    const { sig } = await getSignData({
      data: { name: 'test', avatar: '64x64' },
      method: 'post',
      params: { flag: 'new' },
      url: '/.well-known/service/test/post',
    });

    const result = await serviceApi.post('/test/post?flag=new', { name: 'test', avatar: '64x64' });
    expect(result.config.headers['x-blocklet-sig']).toBe(sig);
  });

  it('should work with get, contain query params in url', async () => {
    serviceApi.defaults.adapter = async (config: any): Promise<AxiosResponse> => {
      if ((config.method || 'get').toLowerCase() === 'get' && config.url === '/test/get?flag=new') {
        return {
          data: {
            name: 'test',
            avatar: 'bn:/test-avatar',
            did: 'mock-did',
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      throw new Error(`Unexpected request: ${config.method} ${config.url}`);
    };

    const { sig } = await getSignData({
      data: {},
      method: 'get',
      params: { flag: 'new', name: 'test', avatar: '64x64' },
      url: '/.well-known/service/test/get',
    });

    const result = await serviceApi.get('/test/get?flag=new', {
      params: { name: 'test', avatar: '64x64' },
    });
    expect(result.config.headers['x-blocklet-sig']).toBe(sig);
  });
});
