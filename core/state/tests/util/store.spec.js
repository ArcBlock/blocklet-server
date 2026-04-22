/* eslint-disable no-promise-executor-return */
/* eslint-disable import/no-named-as-default-member */

const { test, expect, describe, beforeEach, afterEach, afterAll } = require('bun:test');
const { default: axios } = require('axios');
const isBase64 = require('is-base64');
const path = require('path');
const { BLOCKLET_STORE_URL } = require('@abtnode/constant');
const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const StoreUtil = require('../../lib/util/store');

const axiosMock = new MockAdapter(axios);

// 伪造 @blocklet/meta/lib/verify-multi-sig，避免内部报错（若有依赖）
try {
  require.cache[require.resolve('@blocklet/meta/lib/verify-multi-sig')] = {
    exports: () => ({}),
  };
} catch {
  // ignore
}

beforeEach(() => {
  axiosMock.reset();
});

afterAll(() => {
  axiosMock.restore();
});

afterEach(() => {
  // 不使用 mock，只清理 axios 的状态
  if (axios.interceptors?.request?.clear) axios.interceptors.request.clear();
  if (axios.interceptors?.response?.clear) axios.interceptors.response.clear();
});

describe('resolveTarballURL', () => {
  test('should return empty string if tarball is falsy', async () => {
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', storeUrl: 'https://xxx' })).toEqual('');
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', tarball: null, storeUrl: 'https://xxx' })).toEqual('');
  });

  test('should return empty string if tarball is relative and did is falsy', async () => {
    expect(await StoreUtil.resolveTarballURL({ storeUrl: 'https://xxx', tarball: 'a.tgz' })).toEqual('');
  });

  test('should return empty string if tarball is relative and storeUrl is falsy', async () => {
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', tarball: 'a.tgz' })).toEqual('');
  });

  test('should return original tarball url if starts with http/https/file', async () => {
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', tarball: 'http://api/test' })).toEqual(
      'http://api/test'
    );
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', tarball: 'https://api/test' })).toEqual(
      'https://api/test'
    );
    expect(await StoreUtil.resolveTarballURL({ did: 'testdid', tarball: 'file:///api/test' })).toEqual(
      'file:///api/test'
    );
  });

  test('should return corrent tarball url if tarball is plain path', async () => {
    const url = await StoreUtil.resolveTarballURL({
      did: 'testdid',
      tarball: 'test',
      storeUrl: 'https://store.blocklet.dev',
    });
    expect(url).toEqual('https://store.blocklet.dev/api/blocklets/testdid/test');
  });
});

describe('getStoreMeta', () => {
  test('should get blocklet registry meta: valid', async () => {
    const resp = {
      data: {
        name: 'test',
        description: 'test',
        logoUrl: 'http://test.png',
      },
    };

    const realGet = axios.get;
    axios.get = () => resp;

    const result = await StoreUtil.getStoreMeta(BLOCKLET_STORE_URL);
    expect(result).toBeTruthy();
    expect(result.name).toBe('test');
    expect(result.description).toBe('test');
    expect(result.logoUrl).toBe('http://test.png');

    axios.get = realGet;
  });

  test('should return empty object if response is empty', async () => {
    const realGet = axios.get;
    axios.get = () => ({ data: null });

    const result = await StoreUtil.getStoreMeta('http://test.com');
    expect(result).toEqual({});

    axios.get = realGet;
  });

  test('should throw error if missing required fields', async () => {
    const realGet = axios.get;
    axios.get = () => ({ data: { key: 'test' } });

    await expect(StoreUtil.getStoreMeta('http://test.com')).rejects.toThrow(/missing required information/);

    axios.get = realGet;
  });

  test('should handle relative logoUrl', async () => {
    const realGet = axios.get;
    axios.get = () => ({ data: { name: 'test', description: 'test', logoUrl: 'logo.png' } });

    const info = await StoreUtil.getStoreMeta('http://registry.com');
    expect(info.logoUrl).toBe('http://registry.com/logo.png');

    axios.get = realGet;
  });

  test('should keep base64 logoUrl as-is', async () => {
    const realGet = axios.get;
    const realIsBase64 = isBase64;

    global.isBase64 = () => true;
    axios.get = () => ({ data: { name: 'test', description: 'test', logoUrl: 'data:image/png;base64,xxx' } });

    const info = await StoreUtil.getStoreMeta('http://registry.com');
    expect(info.logoUrl).toContain('base64');

    axios.get = realGet;
    global.isBase64 = realIsBase64;
  });
});

describe('getBlockletMeta', () => {
  test('should get blocklet meta', async () => {
    const did = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';

    const blockletMeta = JSON.parse(
      fs.readFileSync(
        path.resolve(
          __dirname,
          '../../../state/tests/assets/api/blocklets/z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV/1.1.3/blocklet.json'
        )
      )
    );

    axiosMock.onGet(/blocklet/).reply(200, {
      ...blockletMeta,
    });

    const meta = await StoreUtil.getBlockletMeta({ did, storeUrl: 'https://test.blocklet.store', getter: axios });
    expect(meta.dist.tarball).toBe(
      'https://test.blocklet.store/api/blocklets/z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV/static-demo-blocklet-1.1.3.tgz'
    );
  });
});
