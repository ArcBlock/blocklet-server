const { beforeEach, describe, test, expect } = require('bun:test');
const { EventEmitter } = require('events');
const express = require('express');
const request = require('supertest');
const { BlockletEvents } = require('@blocklet/constant');
const { BLOCKLET_PROXY_PATH_PREFIX } = require('@abtnode/constant');
const { init, proxyCache } = require('../../../api/routes/blocklet-proxy');

describe('blocklet proxy', () => {
  const did1 = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
  const did2 = 'z1np3s32zytqH4PSqzdBHpZzob7udumR624';
  let node;
  let app;

  let blocklet;

  beforeEach(async () => {
    await proxyCache.flushAll();
    blocklet = {
      meta: { did: did1 },
      children: [
        {
          meta: {
            did: 'com1',
            bundleDid: 'bundle1',
            interfaces: [
              {
                type: 'web',
                port: 'BLOCKLET_PORT',
              },
            ],
          },
          ports: { BLOCKLET_PORT: 5000 },
        },
      ],
    };

    node = new EventEmitter();
    node.getBlocklet = x => {
      if (x.did === did1) {
        return blocklet;
      }
      return null;
    };

    app = express();
    const proxy = {
      web(req, res, { target }) {
        res.json({
          target,
          url: req.url,
        });
      },
      on: () => {},
    };

    init(app, node, proxy);
  });

  test('application did not found', async () => {
    let res;
    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/`);
    expect(res.status).toBe(400);
    expect(res.text).toBe('Application did is not found');

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/`).set('x-blocklet-did', 'abc');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Application did is not found');

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/xxx`).set('x-blocklet-did', 'abc');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Application did is not found');

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/xxx/static/abc`);
    expect(res.status).toBe(400);
    expect(res.text).toBe('Application did is not found');
  });

  test('should prefix valid', async () => {
    let res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/private`).set('x-blocklet-did', did1);
    expect(res.status).toBe(400);
    expect(res.text).toMatch('Only resources under');

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/xx/yy/zz`).set('x-blocklet-did', did1);
    expect(res.status).toBe(400);
    expect(res.text).toMatch('Only resources under');

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/1`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/asset/2`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/assets/3`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);

    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/public/4`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);
  });

  test('application did not valid', async () => {
    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/xxx/static/`).set('x-blocklet-did', 'abc');
    expect(res.status).toBe(400);
    expect(res.text).toBe('Application did is not valid: abc');
  });

  test('application not found', async () => {
    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/xxx/static/`).set('x-blocklet-did', did2);
    expect(res.status).toBe(400);
    expect(res.text).toBe(`Application is not found: ${did2}`);
  });

  test('component not found', async () => {
    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle2/static/`).set('x-blocklet-did', did1);
    expect(res.status).toBe(400);
    expect(res.text).toBe(`Component is not found. AppDid: ${did1}. BundleDid: bundle2`);
  });

  test('component port not found', async () => {
    blocklet.children[0].meta.interfaces = [];
    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/`).set('x-blocklet-did', did1);
    expect(res.status).toBe(400);
    expect(res.text).toBe(`Component web interface port is not found. AppDid: ${did1}. Component: com1`);
  });

  test('should proxy', async () => {
    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/abc`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://127.0.0.1:5000');
    expect(res.body.url).toBe('/static/abc');
  });

  test('should cache', async () => {
    let res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/abc`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://127.0.0.1:5000');
    expect(res.body.url).toBe('/static/abc');

    // update blocklet
    blocklet.children = [];

    // should cache
    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/abc`).set('x-blocklet-did', did1);
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://127.0.0.1:5000');
    expect(res.body.url).toBe('/static/abc');

    // delete cache
    node.emit(BlockletEvents.started, { meta: { did: did1 } });
    res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/bundle1/static/abc`).set('x-blocklet-did', did1);
    expect(res.status).toBe(400);
  });

  test('should proxy to blocklet-service', async () => {
    process.env.ABT_NODE_SERVICE_PORT = 8888;

    const res = await request(app).get(`${BLOCKLET_PROXY_PATH_PREFIX}/blocklet-service/abc`);
    expect(res.status).toBe(200);
    expect(res.body.target).toBe('http://127.0.0.1:8888');
    expect(res.body.url).toBe('/.well-known/service/static/abc');
  });

  describe('content-type validation', () => {
    let proxyResHandler;

    beforeEach(() => {
      // 创建一个简单的代理模拟对象来捕获 proxyRes 处理程序
      const proxy = {
        web: () => {},
        on: (event, handler) => {
          if (event === 'proxyRes') {
            proxyResHandler = handler;
          }
        },
      };

      init(app, node, proxy);
    });

    test('should validate content-type for CSS files', () => {
      const mockReq = { originalUrl: '/bundle1/static/style.css' };
      const mockRes = { status: () => {}, send: () => {} };
      let statusCalled = false;
      let sendCalled = false;

      mockRes.status = () => {
        statusCalled = true;
        return mockRes;
      };
      mockRes.send = () => {
        sendCalled = true;
      };

      const mockProxyRes = { headers: { 'content-type': 'text/css' } };

      proxyResHandler(mockProxyRes, mockReq, mockRes);

      expect(statusCalled).toBe(false);
      expect(sendCalled).toBe(false);
    });

    test('should validate content-type for JavaScript files', () => {
      const mockReq = { originalUrl: '/bundle1/static/script.js' };
      const mockRes = { status: () => {}, send: () => {} };
      let statusCalled = false;
      let sendCalled = false;

      mockRes.status = () => {
        statusCalled = true;
        return mockRes;
      };
      mockRes.send = () => {
        sendCalled = true;
      };

      const mockProxyRes = { headers: { 'content-type': 'text/javascript' } };

      proxyResHandler(mockProxyRes, mockReq, mockRes);

      expect(statusCalled).toBe(false);
      expect(sendCalled).toBe(false);
    });

    test('should return 404 for incorrect content-type', () => {
      const mockReq = { originalUrl: '/bundle1/static/image.png' };
      const mockRes = { status: () => {}, send: () => {} };
      let statusCalledWith = null;
      let sendCalledWith = null;

      mockRes.status = code => {
        statusCalledWith = code;
        return mockRes;
      };
      mockRes.send = message => {
        sendCalledWith = message;
      };

      const mockProxyRes = { headers: { 'content-type': 'text/plain' } };

      proxyResHandler(mockProxyRes, mockReq, mockRes);

      expect(statusCalledWith).toBe(404);
      expect(sendCalledWith).toBe('File not found');
    });

    test('should handle missing content-type header', () => {
      const mockReq = { originalUrl: '/bundle1/static/file.txt' };
      const mockRes = { status: () => {}, send: () => {} };
      let statusCalledWith = null;
      let sendCalledWith = null;

      mockRes.status = code => {
        statusCalledWith = code;
        return mockRes;
      };
      mockRes.send = message => {
        sendCalledWith = message;
      };

      const mockProxyRes = { headers: {} };

      proxyResHandler(mockProxyRes, mockReq, mockRes);

      expect(statusCalledWith).toBe(404);
      expect(sendCalledWith).toBe('File not found');
    });
  });
});
