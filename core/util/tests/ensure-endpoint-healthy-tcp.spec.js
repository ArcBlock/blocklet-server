const { it, expect, describe, afterEach } = require('bun:test');
const express = require('express');

const detectPort = require('detect-port');
const ensureEndpointHealthy = require('../lib/ensure-endpoint-healthy');
const sleep = require('../lib/sleep');

const startServer = (port) => {
  const app = express();

  app.get('/', (req, res) => {
    res.send('arcblock');
  });

  return app.listen(port);
};

describe('ensure-endpoint-healthy', () => {
  let server = null;

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  it('should throw error if timeout less than minConsecutiveTime', async () => {
    const port = await detectPort(3000);

    await expect(
      ensureEndpointHealthy({ port, timeout: 1 * 1000, protocol: 'tcp', minConsecutiveTime: 2000 })
      // eslint-disable-next-line function-paren-newline
    ).rejects.toThrow(/"timeout" should not less than "minConsecutiveTime"/);
  });

  it('should not throw error if server already started successfully', async () => {
    const port = await detectPort(3000);
    server = startServer(port);
    await ensureEndpointHealthy({ host: '127.0.0.1', port, timeout: 2000, protocol: 'tcp', minConsecutiveTime: 1000 });
    server.close();
  });

  it('should the default host is 127.0.0.1', async () => {
    const port = await detectPort(3000);
    server = startServer(port);
    await ensureEndpointHealthy({ port, timeout: 2000, protocol: 'tcp', minConsecutiveTime: 500 });
    await ensureEndpointHealthy({ host: 'localhost', port, timeout: 2000, protocol: 'tcp', minConsecutiveTime: 500 });

    try {
      await ensureEndpointHealthy({
        host: 'arcblock-not-exist.com',
        port,
        timeout: 2000,
        protocol: 'tcp',
        minConsecutiveTime: 500,
      });

      throw new Error('should not throw error');
    } catch (error) {
      expect(error.message).toMatch(/.*/);
    }

    server.close();
  });

  it('should not throw error if server started successfully finally', async () => {
    const port = await detectPort(3000);
    setTimeout(() => {
      try {
        server = startServer(port);
      } catch (error) {
        //
      }
    }, 100);

    await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'tcp', minConsecutiveTime: 500 });
    server.close();
  }, 15_000);

  it('should throw error server if not started', async () => {
    const fakeServerPort = 33569;

    if (server) {
      server.close();
    }
    try {
      await ensureEndpointHealthy({ port: fakeServerPort, timeout: 2000, protocol: 'tcp', minConsecutiveTime: 1000 });
    } catch (error) {
      expect(error.message).toMatch(/service not ready/);
    }
  }, 15_000);

  it('should throw error server not started', async () => {
    const port = await detectPort(3000);
    server = startServer(port);

    await sleep(1000);

    await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'tcp', minConsecutiveTime: 3000 });
    server.close();
    try {
      await ensureEndpointHealthy({ port, timeout: 6000, protocol: 'tcp', minConsecutiveTime: 3000 });
    } catch (error) {
      expect(error.message).toMatch(/service not ready within/);
    }
  }, 15_000);
});
