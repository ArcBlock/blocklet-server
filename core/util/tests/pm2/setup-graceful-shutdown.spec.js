/* eslint-disable max-classes-per-file */
const { test, expect, describe, beforeAll, afterAll, beforeEach, afterEach, spyOn, mock } = require('bun:test');
const EventEmitter = require('events');
const http = require('http');
const axios = require('axios');
const { setupGracefulShutdown } = require('../../lib/pm2/setup-graceful-shutdown');
const sleep = require('../../lib/sleep');

describe('setupGracefulShutdown', () => {
  let originalExit;
  let exitSpy;
  let logger;
  let server;

  beforeAll(() => {
    originalExit = process.exit;
  });

  beforeEach(() => {
    // mock process.exit

    exitSpy = spyOn(process, 'exit').mockImplementation(() => {});
    // mock logger
    logger = { log: mock(), error: mock() };

    // mock http/https Server
    class FakeServer extends EventEmitter {
      constructor() {
        super();
        this.close = mock((cb) => cb && cb());
      }
    }
    server = new FakeServer();
    mock.clearAllMocks();
  });

  afterEach(() => {
    // clear all listeners to avoid cross-test pollution
    process.removeAllListeners('message');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');

    mock.clearAllMocks();
  });

  afterAll(() => {
    process.exit = originalExit;
  });

  function triggerShutdownByMessage() {
    // trigger PM2 message event
    process.emit('message', 'shutdown');
  }

  test('triggers graceful shutdown via process message and exits with 0 after server.close callback', () => {
    setupGracefulShutdown(server, { logger, killTimeout: 5000, socketEndTimeout: 200 });

    triggerShutdownByMessage();

    expect(logger.log).toHaveBeenCalledWith('[shutdown] starting graceful shutdown');
    expect(server.close).toHaveBeenCalledTimes(1);
    // server.close callback should cause graceful exit 0
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('is idempotent: multiple shutdown signals only close once', () => {
    setupGracefulShutdown(server, { logger });

    triggerShutdownByMessage();
    triggerShutdownByMessage();
    process.emit('SIGTERM');

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('drains tracked TCP sockets: end() first, then destroy() after socketEndTimeout', async () => {
    const socket = { end: mock(), destroy: mock(), on: mock() };

    setupGracefulShutdown(server, {
      logger,
      socketEndTimeout: 200,
      killTimeout: 400,
      quietEndDelay: 100, // wait 100ms before drain
    });

    server.emit('connection', socket);
    triggerShutdownByMessage();

    // at quietEndDelay: drainTcpSockets() should have run and called end() on idle sockets
    await sleep(100);
    expect(socket.end).toHaveBeenCalledTimes(1);
    expect(socket.destroy).not.toHaveBeenCalled();

    // then advance hardKillAfter (= 200ms, counted from drain)
    await sleep(200);
    expect(socket.destroy).toHaveBeenCalledTimes(1);
  });

  test('hard kill on overall killTimeout when server does not finish closing', async () => {
    // make server.close not call callback to simulate hanging
    server.close.mockImplementation(() => {});
    setupGracefulShutdown(server, { logger, killTimeout: 1000, socketEndTimeout: 2000 });
    expect(exitSpy).not.toHaveBeenCalledWith(1);
    triggerShutdownByMessage();

    // should not exit(1) before killTimeout
    // await sleep(100);
    expect(exitSpy).not.toHaveBeenCalledWith(1);

    // at killTimeout, force exit 1
    await sleep(2100);
    expect(logger.error).toHaveBeenCalledWith('[shutdown] timeout reached, forcing exit 1');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  test('handles ws-style servers: close(1001) then terminate() after timeout if not closed', async () => {
    // mock ws.Server
    const openClient = {
      readyState: 1, // OPEN
      close: mock(),
      terminate: mock(),
    };
    const halfOpenClient = {
      readyState: 1, // OPEN, currently active; should terminate after timeout
      close: mock(),
      terminate: mock(),
    };
    const closedClient = {
      readyState: 3, // CLOSED
      close: mock(),
      terminate: mock(),
    };
    const wsServer = {
      clients: new Set([openClient, halfOpenClient, closedClient]),
    };

    setupGracefulShutdown(server, {
      logger,
      wsServers: [wsServer],
      socketEndTimeout: 1000,
      killTimeout: 2000,
    });

    triggerShutdownByMessage();

    // immediately call close(1001) on OPEN clients
    expect(openClient.close).toHaveBeenCalledWith(1001, 'Server restart');
    expect(halfOpenClient.close).toHaveBeenCalledWith(1001, 'Server restart');
    expect(closedClient.close).not.toHaveBeenCalled();

    // before socketEndTimeout, should not terminate
    await sleep(200);
    expect(openClient.terminate).not.toHaveBeenCalled();
    expect(halfOpenClient.terminate).not.toHaveBeenCalled();

    // after timeout, terminate non-CLOSED clients
    await sleep(1000);
    expect(openClient.terminate).toHaveBeenCalledTimes(1);
    expect(halfOpenClient.terminate).toHaveBeenCalledTimes(1);
    expect(closedClient.terminate).not.toHaveBeenCalled();
  });

  test('handles socket.io-like servers: disconnect each socket and call close()', () => {
    const sock1 = { disconnect: mock() };
    const sock2 = { disconnect: mock() };

    // simulate socket.io structure: io.sockets.sockets is a Map
    const ioLike = {
      sockets: {
        sockets: new Map([
          ['a', sock1],
          ['b', sock2],
        ]),
      },
      close: mock(),
    };

    setupGracefulShutdown(server, { logger, wsServers: [ioLike] });

    triggerShutdownByMessage();

    expect(sock1.disconnect).toHaveBeenCalledWith(true);
    expect(sock2.disconnect).toHaveBeenCalledWith(true);
    expect(ioLike.close).toHaveBeenCalledTimes(1);
  });

  test('can be triggered by SIGTERM as well', () => {
    setupGracefulShutdown(server, { logger });

    process.emit('SIGTERM');

    expect(server.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  test('uncaughtException/unhandledRejection also trigger graceful shutdown', () => {
    setupGracefulShutdown(server, { logger });

    process.emit('uncaughtException', new Error('boom'));
    expect(server.close).toHaveBeenCalledTimes(1);

    // clear this listener and create another one (avoid idempotency affecting the next assertion)
    process.removeAllListeners('uncaughtException');
    process.removeAllListeners('unhandledRejection');
    mock.clearAllMocks();

    const exitSpy2 = spyOn(process, 'exit').mockImplementation(() => {});
    const logger2 = { log: mock(), error: mock() };
    // use a new server, matching the idempotent design that installs once per server because setupGracefulShutdown checks the INSTALLED symbol
    class FakeServer extends EventEmitter {
      constructor() {
        super();
        this.close = mock((cb) => cb && cb());
      }
    }
    server = new FakeServer();
    setupGracefulShutdown(server, { logger: logger2 });

    process.emit('unhandledRejection', new Error('later'));
    expect(server.close).toHaveBeenCalledTimes(1); // the new server also has a new trigger
    expect(exitSpy2).toHaveBeenCalledWith(0);
  });

  test('in-flight /slow request completes successfully during graceful shutdown', async () => {
    // record whether response completed to verify exit timing (optional)
    let slowResponded = false;

    const realServer = http.createServer((req, res) => {
      if (req.url === '/slow') {
        // simulate slow business logic that takes 2s to complete
        setTimeout(() => {
          res.statusCode = 200;
          // shutdown windows usually add Connection: close; add it here to match reality
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Connection', 'close');
          res.end('ok');
          slowResponded = true;
        }, 2000);
        return;
      }
      res.statusCode = 200;
      res.end('pong');
    });

    // start on a random port
    await new Promise((resolve) => {
      realServer.listen(0, resolve);
    });
    const { port } = realServer.address();

    // install graceful shutdown
    setupGracefulShutdown(realServer, {
      logger,
      // provide enough time window: quiet 0ms then drain immediately, destroy sockets after at most 1s, force exit after 2s overall
      quietEndDelay: 0,
      socketEndTimeout: 3000,
      killTimeout: 4000,
    });

    // start a slow request
    const respPromise = axios.get(`http://127.0.0.1:${port}/slow`, { timeout: 5000 });

    // wait 50ms to confirm request is in-flight
    await new Promise((r) => {
      setTimeout(r, 50);
    });

    // trigger shutdown (equivalent to PM2 message: 'shutdown')
    process.emit('message', 'shutdown');

    // wait for slow request to complete
    const resp = await respPromise;

    expect(resp.status).toBe(200);

    expect(resp.data).toBe('ok');

    expect(slowResponded).toBe(true);

    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
