const { it, expect, describe, afterEach } = require('bun:test');
const express = require('express');

const ensureEndpointHealthy = require('../lib/ensure-endpoint-healthy');
const sleep = require('../lib/sleep');

const startServer = (port) => {
  const app = express();

  app.get('/', (req, res) => {
    res.send('arcblock');
  });

  return app.listen(port);
};
const port = 34567;
const fakeServerPort = 3456;

describe('ensure-endpoint-healthy', () => {
  let server = null;

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  it('should throw error if timeout less than minConsecutiveTime', async () => {
    await expect(
      ensureEndpointHealthy({ port, timeout: 1 * 1000, protocol: 'http', minConsecutiveTime: 2000 })
      // eslint-disable-next-line function-paren-newline
    ).rejects.toThrow(/"timeout" should not less than "minConsecutiveTime"/);
  });

  it('should not throw error if server already started successfully', async () => {
    server = startServer(port);
    await ensureEndpointHealthy({ host: '127.0.0.1', port, timeout: 2000, protocol: 'http', minConsecutiveTime: 1000 });
    server.close();
  });

  it('should the default host is 127.0.0.1', async () => {
    server = startServer(port);
    await ensureEndpointHealthy({ port, timeout: 2000, protocol: 'http', minConsecutiveTime: 500 });
    await ensureEndpointHealthy({ host: 'localhost', port, timeout: 2000, protocol: 'http', minConsecutiveTime: 500 });
    await expect(
      ensureEndpointHealthy({
        host: 'arcblock-not-exist.com',
        port,
        timeout: 2000,
        protocol: 'http',
        minConsecutiveTime: 500,
      })
      // eslint-disable-next-line function-paren-newline
    ).rejects.toThrow(/.*/);
    server.close();
  }, 10_000);

  it('should not throw error if server started successfully finally', async () => {
    setTimeout(() => {
      server = startServer(port);
    }, 100);

    await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'http', minConsecutiveTime: 500 });
    server.close();
  }, 10_000);

  it('should throw error server if not started', async () => {
    if (server) {
      server.close();
    }
    try {
      await ensureEndpointHealthy({ port: fakeServerPort, timeout: 2000, protocol: 'tcp', minConsecutiveTime: 1000 });
    } catch (error) {
      expect(error.message).toMatch(/service not ready/);
    }
  }, 10000);

  it('should throw error server not started', async () => {
    server = startServer(port);

    await sleep(1000);

    await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'http', minConsecutiveTime: 3000 });
    server.close();
    try {
      await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'http', minConsecutiveTime: 3000 });
    } catch (error) {
      expect(error.message).toMatch(/service not ready within/);
    }
  }, 15_000);
});
