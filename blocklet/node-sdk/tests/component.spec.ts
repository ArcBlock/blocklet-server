/* eslint-disable no-promise-executor-return */
/* eslint-disable no-import-assign */
/* eslint-disable import/no-named-as-default-member */

import http from 'http';
import cloneDeep from 'lodash/cloneDeep';
import { describe, test, expect, beforeEach, afterEach, beforeAll } from 'bun:test';
import component from '../src/component/index';
import { getResources } from '../src/component/util';
import config from '../src/config';
import { setEnvironment, clearEnvironment } from '../tools/environment';

let envBak: any;
let testServer: http.Server | null = null;
let testPort = 0;

beforeAll(() => {
  process.env = (globalThis as any).processEnv;
});

/** Start a temporary HTTP server and return its port */
function startTestServer(handler: (req: http.IncomingMessage, res: http.ServerResponse) => void): Promise<number> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      handler(req, res);
    });
    server.listen(0, () => {
      const addr = server.address();
      if (typeof addr === 'object' && addr) {
        testPort = addr.port;
      }
      testServer = server;
      resolve(testPort);
    });
  });
}

beforeEach(() => {
  envBak = cloneDeep(process.env);
});

afterEach(() => {
  process.env = envBak;
  if (testServer) {
    testServer.close();
    testServer = null;
  }
});

describe('component', () => {
  beforeEach(() => {
    setEnvironment();
  });

  afterEach(() => {
    clearEnvironment();
  });

  test('should export object as expected', () => {
    expect(typeof component.call).toBe('function');
    expect(typeof component.getComponentMountPoint).toBe('function');
    expect(typeof component.getComponentWebEndpoint).toBe('function');
    expect(typeof component.waitForComponentRunning).toBe('function');
    expect(typeof component.getUrl).toBe('function');
    expect(typeof component.getResourceExportDir).toBe('function');
    expect(typeof component.getReleaseExportDir).toBe('function');
    expect(typeof component.getResources).toBe('function');
    expect(typeof component.getRelativeUrl).toBe('function');
  });

  test('component mountPoint and webEndpoint', () => {
    config.getComponents().length = 0;
    config.getComponents().push({
      title: 'title1',
      did: 'did1',
      name: 'name1',
      mountPoint: '/abc',
      version: '1.0.0',
      port: 123,
      status: 6,
      webEndpoint: 'http://127.0.0.1:123',
      resources: [],
    });

    expect(component.getComponentMountPoint('title1')).toBe('/abc');
    expect(component.getComponentMountPoint('did1')).toBe('/abc');
    expect(component.getComponentMountPoint('name1')).toBe('/abc');
    expect(component.getComponentMountPoint('xxx')).toBe('');
    expect(component.getComponentWebEndpoint('title1')).toBe('http://127.0.0.1:123');
    expect(component.getComponentWebEndpoint('did1')).toBe('http://127.0.0.1:123');
    expect(component.getComponentWebEndpoint('name1')).toBe('http://127.0.0.1:123');
    expect(component.getComponentWebEndpoint('xxx')).toBe('');
  });

  describe('waitForComponentRunning', () => {
    test('should waitForComponentRunning resolve as expected', async () => {
      const port = await startTestServer((req, res) => {
        res.writeHead(200);
        config.logger.info('test');
        res.end('OK');
      });

      config.getComponents().length = 0;
      config.getComponents().push({
        title: 'title1',
        did: 'did1',
        name: 'name1',
        mountPoint: '/abc',
        version: '1.0.0',
        port,
        status: 6,
        resources: [],
      });

      const result = await component.waitForComponentRunning('did1');
      expect(result).toBeTruthy();
    });

    test('should waitForComponentRunning throw on component not found', () => {
      expect(component.waitForComponentRunning('not-exist')).rejects.toThrow(/can not find component/);
    });

    test('should waitForComponentRunning throw on port not found', () => {
      config.getComponents().length = 0;
      config.getComponents().push({
        title: 'title1',
        did: 'did1',
        name: 'name1',
        mountPoint: '/abc',
        version: '1.0.0',
        port: 0,
        status: 6,
        resources: [],
      });
      expect(component.waitForComponentRunning('did1')).rejects.toThrow(/can not find port/);
    });
  });

  describe('call', () => {
    beforeEach(async () => {
      await startTestServer((req, res) => {
        if (req.url === '/api/abc' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          config.logger.info('test');
          res.end(JSON.stringify({ ok: true }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      });
    });

    afterEach(() => {
      if (testServer) {
        testServer.close();
        testServer = null;
      }
    });

    test('name is required', async () => {
      await expect(component.call({ path: '/api/abc', data: 'test' })).rejects.toThrow('name is required');
    });

    test('should call real http server successfully', async () => {
      let successCount = 0;
      const port = await startTestServer((req, res) => {
        res.writeHead(200);
        successCount++;
        res.end('OK');
      });
      config.getComponents().length = 0;
      config.getComponents().push({
        title: 'title1',
        did: 'did1',
        name: 'name1',
        mountPoint: '/abc',
        port,
        status: 6,
        webEndpoint: `http://127.0.0.1:${port}`,
        version: '1.0.0',
        resources: [],
      });

      const result = await component.call({ name: 'did1', path: '/api/abc', data: { x: 1 } });
      expect(result.status).toBe(200);
      expect(result.data).toEqual('OK');
      expect(successCount).toBe(1);
    }, 10_000);

    test('should handle server error and log error', async () => {
      if (testServer) {
        testServer.close();
        testServer = null;
      }
      let errorCount = 0;

      await startTestServer((req, res) => {
        res.writeHead(500);
        errorCount++;
        res.end('Internal Error');
      });

      config.getComponents().length = 0;
      config.getComponents().push({
        title: 'title1',
        did: 'did1',
        name: 'name1',
        mountPoint: '/abc',
        port: testPort,
        status: 6,
        webEndpoint: `http://127.0.0.1:${testPort}`,
        version: '1.0.0',
        resources: [],
      });
      try {
        await (component as any).call(
          { name: 'did1', path: '/api/abc', data: {} },
          {
            timeout: 100,
            retries: 1,
          }
        );
      } catch {
        //
      }

      expect(errorCount).toBeGreaterThanOrEqual(1);
    }, 10_000);
  });

  test('getResourceExportDir', () => {
    process.env.BLOCKLET_APP_DATA_DIR = '/path/data';
    expect(() => component.getResourceExportDir()).toThrow('projectId');
    expect(() => component.getResourceExportDir({ projectId: '' })).toThrow('projectId');
    expect(component.getResourceExportDir({ projectId: 'p1' })).toBe('/path/data/.projects/p1/resource');
    expect(component.getResourceExportDir({ projectId: 'p1', releaseId: '1.0.0' })).toBe(
      '/path/data/.projects/p1/releases/1.0.0/resource'
    );
  });

  test('getReleaseExportDir', () => {
    process.env.BLOCKLET_APP_DATA_DIR = '/path/data';
    expect(() => component.getReleaseExportDir({ projectId: '', releaseId: '' })).toThrow('projectId');
    expect(component.getReleaseExportDir({ projectId: 'p1', releaseId: '' })).toBe('/path/data/.projects/p1');
    expect(component.getReleaseExportDir({ projectId: 'p1', releaseId: 'r1' })).toBe(
      '/path/data/.projects/p1/releases/r1'
    );
  });

  test('getResources', () => {
    const components = [
      {
        title: 't1',
        did: 'd1',
        version: 'xxx',
        resources: [] as any[],
        resourcesV2: [{ path: '/data/resources/did1/page' }],
        status: 6,
        mountPoint: '',
      },
      {
        title: 't2',
        did: 'd2',
        version: 'xxx',
        resources: [] as any[],
        status: 8,
        resourcesV2: [{ path: '/data/resources/did1/imgpack', public: true }],
        mountPoint: '',
      },
    ];
    expect(getResources()).toEqual([]);
    expect(getResources({ components })).toEqual([]);
    expect(getResources({ components, types: [{ did: 'a', type: 'page' }] })).toEqual([]);
    expect(getResources({ components, types: [{ did: 'did1', type: 'page' }], ignorePublic: true })).toEqual([
      { title: 't1', did: 'd1', version: 'xxx', status: 6, path: '/data/resources/did1/page' },
    ]);
    expect(getResources({ components, types: [{ did: 'did1', type: 'imgpack' }], skipRunningCheck: true })).toEqual([
      { title: 't2', did: 'd2', version: 'xxx', status: 8, path: '/data/resources/did1/imgpack' },
    ]);
  });

  test('getUrl and getRelativeUrl', () => {
    config.getComponents().length = 0;
    config.getComponents().push({
      title: 'title1',
      did: 'did1',
      name: 'name1',
      mountPoint: '/abc',
      port: 123,
      status: 6,
      webEndpoint: 'http://127.0.0.1:123',
      version: '1.0.0',
      resources: [],
    });

    expect(component.getUrl()).toBe('http://127.0.0.1/abc');
    expect(component.getUrl('/')).toBe('http://127.0.0.1/abc');
    expect(component.getUrl('/def')).toBe('http://127.0.0.1/abc/def');
    expect(component.getUrl('/def', 'ghi')).toBe('http://127.0.0.1/abc/def/ghi');

    expect(component.getRelativeUrl()).toBe('/abc');
    expect(component.getRelativeUrl('/')).toBe('/abc');
    expect(component.getRelativeUrl('/def')).toBe('/abc/def');
    expect(component.getRelativeUrl('/def', 'ghi')).toBe('/abc/def/ghi');
  });
});
