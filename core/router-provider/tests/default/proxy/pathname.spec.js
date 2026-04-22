const { it, expect, describe } = require('bun:test');
const http = require('http');
const Promise = require('bluebird');
const Proxy = require('../../../lib/default/proxy');

const TEST_PORT = 54673;
const PROXY_PORT = 53432;

const opts = {
  port: PROXY_PORT,
};

describe('Target with pathnames', () => {
  it('Should be proxyed to target with pathname and source pathname concatenated', (done) => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('127.0.0.1', `127.0.0.1:${TEST_PORT}/foo/bar/qux`);

    testServer().then((req) => {
      expect(req.url).toBe('/foo/bar/qux/a/b/c');
    });

    http.get(`http://127.0.0.1:${PROXY_PORT}/a/b/c`, () => {
      proxy.close();
      done();
    });
  });

  it('Should be proxyed to target with pathname and source pathname concatenated case 2', (done) => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('127.0.0.1/path', `127.0.0.1:${TEST_PORT}/foo/bar/qux`);

    testServer().then((req) => {
      expect(req.url).toBe('/foo/bar/qux/path/a/b/c');
    });

    http.get(`http://127.0.0.1:${PROXY_PORT}/path/a/b/c`, () => {
      proxy.close();
      done();
    });
  });
});

function testServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.write('');
      res.end();
      resolve(req);
      server.close();
    });
    server.listen(TEST_PORT);
  });
}
