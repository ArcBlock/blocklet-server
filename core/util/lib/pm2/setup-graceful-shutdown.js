/* eslint-disable no-continue */
/* eslint-disable no-empty */
const INSTALLED = Symbol.for('graceful.shutdown.installed');

function setupGracefulShutdown(server, opts = {}) {
  if (server[INSTALLED]) return;
  server[INSTALLED] = true;

  const {
    killTimeout = 10000, // overall fallback exit timeout (ms)
    socketEndTimeout = 5000, // max time to wait for all TCP connections to close gracefully (ms)
    wsServers = [], // ws or socket.io instances to close gracefully
    logger = console, // logger instance
    setConnectionCloseOnShutdown = true, // set Connection: close / shouldKeepAlive=false during h1 shutdown
    tuneKeepAlive = true, // gently shorten keepAliveTimeout during shutdown
    http503OnShutdown = false, // whether to immediately 503 new requests/streams during shutdown window (default false: keep 200)
    http503DelayMs = 2000, // delay (ms) before 503 takes effect, giving the new process time to take over
    quietEndDelay = 250, // delay slightly after shutdown before ending idle sockets (reduces race conditions)
    // ---- HTTP/2 optional settings ----
    enableHttp2Support = false, // set to true if the server uses HTTP/2
    http2RefuseNewStreamsOnShutdown = true, // refuse new streams during the shutdown window (respond with 503)
    // ---- Keep-Alive tuning parameters (gentle reduction) ----
    kaGentleMs = 600, // reduce keepAliveTimeout to this value during shutdown (recommended 300–800ms)
    kaPhaseDelayMs = 500, // delay slightly after entering shutdown before shortening KA
  } = opts;

  let isShuttingDown = false;
  let shutdownStartedAt = 0;
  let readySent = false;

  if (!logger.info) logger.info = logger.log;

  const sendReadyOnce = () => {
    if (readySent) return;
    readySent = true;
    process.send?.('ready');
  };

  if (typeof server.listening === 'boolean' && server.listening) {
    setImmediate(sendReadyOnce);
  } else {
    server.on('listening', sendReadyOnce);
  }

  // --------- HTTP/1.1 connection and request tracking ----------
  const sockets = new Set();
  const metaMap = new WeakMap(); // socket -> { active: number, _ended?: boolean }

  server.on('connection', (socket) => {
    sockets.add(socket);
    metaMap.set(socket, { active: 0 });
    socket.on('close', () => sockets.delete(socket));
  });

  server.prependListener('request', (req, res) => {
    const { socket } = req;
    const meta = metaMap.get(socket);
    if (meta) meta.active++;

    const isH2 = req.httpVersionMajor >= 2;

    if (isShuttingDown) {
      // HTTP/1.x: only set shouldKeepAlive=false (Node will automatically emit Connection: close)
      if (!isH2 && setConnectionCloseOnShutdown && !res.headersSent) {
        try {
          res.shouldKeepAlive = false;
          // the line below is optional; shouldKeepAlive=false is sufficient, kept for compatibility with older stacks
          res.setHeader?.('Connection', 'close');
        } catch {
          //
        }
      }

      const should503 = http503OnShutdown && (http503DelayMs <= 0 || Date.now() - shutdownStartedAt >= http503DelayMs);

      if (should503) {
        res.statusCode = 503;
        res.end('server reloading');
        return;
      }
    }

    const done = () => {
      res.removeListener('finish', done);
      res.removeListener('close', done);

      const m = metaMap.get(socket);
      if (!m) return;
      m.active = Math.max(0, m.active - 1);

      // during shutdown, if this socket has no in-flight requests -> graceful teardown
      if (isShuttingDown && m.active === 0 && !m._ended) {
        m._ended = true;
        try {
          socket.end();
        } catch {
          //
        }
      }
    };

    res.on('finish', done); // normal completion
    res.on('close', done); // client disconnected early
  });

  // --------- WebSocket / Socket.IO shutdown ----------
  function closeWebSockets() {
    for (const s of wsServers) {
      if (s && s.clients && typeof s.clients.forEach === 'function') {
        try {
          s.clients.forEach((client) => {
            // 1001: going away
            if (client.readyState === 1 /* OPEN */) client.close(1001, 'Server restart');
          });
          setTimeout(
            () => {
              s.clients.forEach((client) => {
                if (client.readyState !== 3 /* CLOSED */) client.terminate?.();
              });
            },
            Math.min(socketEndTimeout, killTimeout - 100)
          ).unref?.();
        } catch (e) {
          logger.error('[shutdown] close ws failed:', e);
        }
        continue;
      }

      if (s && typeof s.close === 'function' && s.sockets && s.sockets.sockets) {
        try {
          const socketsMap = s.sockets.sockets;
          if (typeof socketsMap.forEach === 'function') {
            socketsMap.forEach((sock) => {
              try {
                sock.disconnect(true);
              } catch {
                //
              }
            });
          } else if (Symbol.iterator in Object(socketsMap)) {
            for (const [, sock] of socketsMap) {
              try {
                sock.disconnect(true);
              } catch {
                //
              }
            }
          }
          s.close(); // stop accepting new connections and close existing ones
        } catch (e) {
          logger.error('[shutdown] close socket.io failed:', e);
        }
        continue;
      }

      try {
        s?.broadcastClose?.('Server restart');
        s?.terminateAll?.();
      } catch {
        //
      }
    }
  }

  // --------- HTTP/2 session and stream management ----------
  const h2Sessions = new Set();
  const h2Meta = new WeakMap(); // session -> { active: number, closed?: boolean }

  let NGHTTP2_NO_ERROR;
  try {
    if (enableHttp2Support) {
      // eslint-disable-next-line global-require
      const http2 = require('http2');
      NGHTTP2_NO_ERROR = http2.constants.NGHTTP2_NO_ERROR;

      // only triggered on http2 servers
      server.on?.('session', (session) => {
        h2Sessions.add(session);
        h2Meta.set(session, { active: 0 });

        session.on('close', () => h2Sessions.delete(session));

        // count active streams (Http2Stream)
        session.on('stream', (stream) => {
          const meta = h2Meta.get(session);
          if (meta) meta.active++;

          // within the shutdown window: optionally refuse new stream creation
          if (isShuttingDown && http2RefuseNewStreamsOnShutdown) {
            const should503 =
              http503OnShutdown && (http503DelayMs <= 0 || Date.now() - shutdownStartedAt >= http503DelayMs);
            try {
              // 503 is semantically clear; Node does not directly expose the REFUSED_STREAM constant
              stream.respond({ ':status': should503 ? 503 : 200 });
              if (should503) stream.end('server reloading');
              else stream.end(); // if not sending 503, end immediately to prompt the client to reconnect to the new instance
              return;
            } catch {
              //
            }
          }

          const onDone = () => {
            stream.removeListener('close', onDone);
            stream.removeListener('aborted', onDone);
            const m = h2Meta.get(session);
            if (!m) return;
            m.active = Math.max(0, m.active - 1);
            if (isShuttingDown && m.active === 0 && !m.closed) {
              m.closed = true;
              try {
                session.close();
              } catch {
                //
              }
            }
          };
          stream.on('close', onDone);
          stream.on('aborted', onDone);
        });
      });
    }
  } catch (e) {
    // environment does not support http2, ignore
    NGHTTP2_NO_ERROR = undefined;
  }

  // --------- h1 TCP socket teardown ----------
  function drainTcpSockets() {
    sockets.forEach((socket) => {
      const meta = metaMap.get(socket) || { active: 0 };
      if (meta.active === 0 && !meta._ended) {
        meta._ended = true;
        try {
          socket.end();
        } catch {
          //
        }
      }
    });

    // fallback: force-destroy any sockets still open at deadline (prevents leaks)
    const hardKillAfter = Math.min(socketEndTimeout, Math.max(0, killTimeout - 200));
    setTimeout(() => {
      sockets.forEach((socket) => {
        try {
          socket.destroy();
        } catch {
          //
        }
      });
    }, hardKillAfter).unref?.();
  }

  function gracefulExit() {
    if (isShuttingDown) return;
    isShuttingDown = true;
    shutdownStartedAt = Date.now();
    logger.info('[shutdown] starting graceful shutdown');

    // (A) HTTP/1.x: gently reduce keep-alive timeout (optional)
    if (tuneKeepAlive) {
      setTimeout(
        () => {
          try {
            const ka = Math.max(50, Number(kaGentleMs) || 600); // safety lower bound: 50ms
            if ('keepAliveTimeout' in server) server.keepAliveTimeout = ka;
            if ('headersTimeout' in server) server.headersTimeout = Math.max(server.headersTimeout || 0, ka + 1000);
            // do not set requestTimeout (keep 0 / unlimited) to avoid cutting off in-flight requests
          } catch {
            //
          }
        },
        Math.max(0, Number(kaPhaseDelayMs) || 0)
      ).unref?.();
    }

    // (B) HTTP/2: send GOAWAY to existing sessions to block new streams (let existing streams finish)
    if (enableHttp2Support && NGHTTP2_NO_ERROR != null) {
      for (const session of h2Sessions) {
        try {
          session.goaway(NGHTTP2_NO_ERROR);
        } catch {
          //
        }
      }
    }

    // 1) gracefully close WS/Socket.IO first
    closeWebSockets();

    // 2) stop accepting new TCP connections / HTTP requests / HTTP2 sessions
    if (typeof server.close === 'function') {
      server.close(() => {
        logger.log('[shutdown] http server closed, exiting 0');
        process.exit(0);
      });
    }

    // 3) wait briefly before teardown (reduces race with in-flight requests)
    setTimeout(() => {
      drainTcpSockets(); // h1

      // h2: close sessions with no active streams
      if (enableHttp2Support) {
        for (const session of h2Sessions) {
          const meta = h2Meta.get(session) || { active: 0 };
          if (meta.active === 0 && !meta.closed) {
            meta.closed = true;
            try {
              session.close();
            } catch {
              //
            }
          }
        }
      }
    }, quietEndDelay).unref?.();

    // 4) h2 fallback: destroy any sessions still open at deadline to prevent leaks
    const hardKillAfter = Math.min(socketEndTimeout, Math.max(0, killTimeout - 200));
    setTimeout(() => {
      if (enableHttp2Support) {
        for (const session of h2Sessions) {
          try {
            session.destroy();
          } catch {
            //
          }
        }
      }
    }, hardKillAfter).unref?.();

    // 5) final fallback: force-exit if the process has not exited yet
    setTimeout(() => {
      logger.error('[shutdown] timeout reached, forcing exit 1');
      process.exit(1);
    }, killTimeout).unref?.();
  }

  process.on('message', (msg) => {
    if (msg === 'shutdown') gracefulExit();
  });
  process.on('SIGINT', gracefulExit);
  process.on('SIGTERM', gracefulExit);
  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException:', err);
    gracefulExit();
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection:', reason);
    gracefulExit();
  });
}

module.exports = { setupGracefulShutdown };
