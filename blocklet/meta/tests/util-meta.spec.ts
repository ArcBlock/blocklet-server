import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Server } from 'http';
import path from 'path';
import { toBlockletDid } from '../src/did';
import { getSourceUrlsFromConfig, getBlockletMetaByUrl, validateUrl } from '../src/util-meta';
import staticServer from '../tools/static-server';

test('getSourceUrlsFromConfig', () => {
  expect(getSourceUrlsFromConfig({ source: { url: 'http://a.com' } })).toEqual(['http://a.com']);
  expect(getSourceUrlsFromConfig({ source: { url: ['http://a.com', 'http://b.com'] } })).toEqual([
    'http://a.com',
    'http://b.com',
  ]);
  expect(getSourceUrlsFromConfig({ source: { store: 'http://store.com', name: 'abc' } })).toEqual([
    `http://store.com/api/blocklets/${toBlockletDid('abc')}/blocklet.json`,
  ]);
  expect(getSourceUrlsFromConfig({ source: { store: 'http://store.com', name: 'abc', version: 'latest' } })).toEqual([
    `http://store.com/api/blocklets/${toBlockletDid('abc')}/blocklet.json`,
  ]);
  expect(getSourceUrlsFromConfig({ source: { store: 'http://store.com', name: 'abc', version: '1.0.0' } })).toEqual([
    `http://store.com/api/blocklets/${toBlockletDid('abc')}/1.0.0/blocklet.json`,
  ]);
  expect(
    getSourceUrlsFromConfig({
      source: { store: ['http://store.com', 'http://test.store.com'], name: 'abc', version: '1.0.0' },
    })
  ).toEqual([
    `http://store.com/api/blocklets/${toBlockletDid('abc')}/1.0.0/blocklet.json`,
    `http://test.store.com/api/blocklets/${toBlockletDid('abc')}/1.0.0/blocklet.json`,
  ]);
  expect(getSourceUrlsFromConfig({ resolved: 'http://a.com' })).toEqual(['http://a.com']);
  expect(() => getSourceUrlsFromConfig({} as any)).toThrow();
});

describe('validateUrl', () => {
  let server: Server | null = null;
  const PORT = 9091;

  const ENDPOINT = `http://localhost:${PORT}`;

  beforeAll(() => {
    server = staticServer({ root: path.join(__dirname, './assets'), port: PORT });
  });
  afterAll(() => {
    (server as Server).close();
    server = null;
  });
  test('should validate valid json', async () => {
    const result = await validateUrl(`${ENDPOINT}/blocklets.json`);

    expect(result).toEqual(true);
  });
  test('should validate valid file system', async () => {
    const result = await validateUrl(
      `file://${path.join(__dirname, './assets/static-demo weird/static-demo-1.1.6.json')}`
    );

    expect(result).toEqual(true);
  });
  test('should throw on invalid url', async () => {
    expect.assertions(2);
    try {
      await validateUrl('//booster.registry.arcblock.io/blocklets.json');
    } catch (err) {
      expect(err).toBeTruthy();
      // Accommodate different error message formats across environments
      expect((err as Error).message).toMatch(/cannot be parsed as a URL|Invalid URL/);
    }
  });
  test('should throw on invalid file', async () => {
    expect.assertions(2);
    try {
      await validateUrl(`file://${path.join(__dirname, './assets/static-demo-xxx/static-demo-1.1.6.json')}`);
    } catch (err) {
      expect(err).toBeTruthy();
      expect((err as Error).message).toMatch(/^File does not exist/);
    }
  });
  test('should throw on invalid type', async () => {
    expect.assertions(2);
    try {
      await validateUrl(`${ENDPOINT}/blocklets.json`, ['text/html']);
    } catch (err) {
      expect(err).toBeTruthy();
      expect((err as Error).message).toMatch(/^Unexpected content-type/);
    }
  });
  test('should throw on failed request', async () => {
    expect.assertions(2);
    try {
      await validateUrl(`${ENDPOINT}/no-exist.json`);
    } catch (err) {
      expect(err).toBeTruthy();
      expect((err as Error).message).toMatch(/^Cannot get content-type/);
    }
  });
  test('should pass if url protocol is file', async () => {
    const result = await validateUrl(`file://${path.join(__dirname, './assets/blocklets.json')}`);

    expect(result).toEqual(true);
  });
  test('should throw error if file does not exist', async () => {
    expect.assertions(1);
    try {
      await validateUrl(`file://${path.join(__dirname, 'no-exist')}`);
    } catch (err) {
      expect((err as Error).message).toMatch(/^File does not exist/);
    }
  });
  test('should throw error if url protocol is invalid', async () => {
    expect.assertions(1);
    try {
      await validateUrl('ws://abc');
    } catch (err) {
      expect((err as Error).message).toMatch('Invalid url protocol');
    }
  });
});
describe('getBlockletMetaByUrl', () => {
  let server: Server | null = null;
  const PORT = 9092;

  const ENDPOINT = `http://localhost:${PORT}`;

  beforeAll(() => {
    server = staticServer({ root: path.join(__dirname, './assets'), port: PORT });
  });
  afterAll(() => {
    (server as Server).close();
    server = null;
  });
  test('should pass if url is valid json', async () => {
    const meta = await getBlockletMetaByUrl(`${ENDPOINT}/static-demo/blocklet.json`);

    expect(meta).toMatchObject({
      name: 'static-demo-blocklet',
      version: '1.1.5',
      did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    });
  });
  test('should throw error if url does not exist', async () => {
    expect.assertions(1);
    try {
      await getBlockletMetaByUrl(`${ENDPOINT}/no-exist.json`);
    } catch (err) {
      expect((err as Error).message).toMatch(/404/);
    }
  });
  test('should throw error if url data is not valid json', async () => {
    expect.assertions(1);
    try {
      await getBlockletMetaByUrl(`${ENDPOINT}/static-demo/static-demo-1.1.5.tgz`);
    } catch (err) {
      expect((err as Error).message).toBeTruthy();
    }
  });
  test('should pass if protocol is file', async () => {
    const meta = await getBlockletMetaByUrl(`file://${path.join(__dirname, './assets/static-demo/blocklet.json')}`);

    expect(meta).toMatchObject({
      name: 'static-demo-blocklet',
      version: '1.1.5',
      did: 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV',
    });
  });
  test('should throw error if file does not exist', async () => {
    expect.assertions(1);
    try {
      await getBlockletMetaByUrl(`file://${path.join(__dirname, 'no-exist')}`);
    } catch (err) {
      expect((err as Error).message).toMatch(/^File does not exist/);
    }
  });
  test('should throw error if file data is not valid json', async () => {
    expect.assertions(1);
    try {
      await getBlockletMetaByUrl(__filename);
    } catch (err) {
      expect((err as Error).message).toBeTruthy();
    }
  });
  test('should throw error if url protocol is invalid', async () => {
    expect.assertions(1);
    try {
      await getBlockletMetaByUrl('ws://abc');
    } catch (err) {
      expect((err as Error).message).toMatch('Invalid url protocol');
    }
  });
});
