const { describe, it, beforeEach, afterEach } = require('bun:test');
const net = require('net');
const http = require('http');
const { dial, dialHttp } = require('../lib/ensure-endpoint-healthy');

function wrapDone(done) {
  let called = false;
  const timer = setTimeout(() => {
    if (!called) {
      called = true;
      done(new Error('Test did not complete within 3 seconds'));
    }
  }, 3500);

  return (...args) => {
    if (!called) {
      called = true;
      clearTimeout(timer);
      done(...args);
    }
  };
}

describe('Smoke tests for dial', () => {
  let server;
  let port;

  beforeEach((done) => {
    server = net.createServer();
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  it('should resolve when connecting to a listening TCP port', (baseDone) => {
    const done = wrapDone(baseDone);
    dial('127.0.0.1', port)
      .then(() => {
        server.close();
        done();
      })
      .catch(done);
  });

  it('should reject when connecting to a non-listening port', (baseDone) => {
    const done = wrapDone(baseDone);
    // assume port 15348 is unused
    dial('127.0.0.1', 15348)
      .then(() => done(new Error('Expected connection error')))
      .catch(() => {
        server.close();
        done();
      });
  });
});

describe('Smoke tests for dialHttp', () => {
  let httpServer;
  let httpPort;

  beforeEach((done) => {
    httpServer = http.createServer((_, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
    httpServer.listen(0, () => {
      httpPort = httpServer.address().port;
      done();
    });
  });

  it('should resolve when receiving a valid HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    dialHttp('127.0.0.1', httpPort)
      .then(() => {
        httpServer.close();
        done();
      })
      .catch(done);
  });

  it('should reject when receiving a non-HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    // create a temporary server that returns non-HTTP data
    const customServer = net.createServer((socket) => {
      socket.write('Not HTTP response');
      socket.end();
    });
    customServer.listen(0, () => {
      const customPort = customServer.address().port;
      dialHttp('127.0.0.1', customPort)
        .then(() => {
          customServer.close();
          done(new Error('Expected non-HTTP response error'));
        })
        .catch(() => {
          customServer.close();
          done();
        });
    });
  });

  it('should timeout when no response is received', (baseDone) => {
    const done = wrapDone(baseDone);
    // simulate an unresponsive server
    const silentServer = net.createServer(() => {
      // do not respond
    });
    silentServer.listen(0, () => {
      const silentPort = silentServer.address().port;
      dialHttp('127.0.0.1', silentPort)
        .then(() => {
          silentServer.close();
          done(new Error('Expected timeout error'));
        })
        .catch(() => {
          silentServer.close();
          done();
        });
    });
  });
});

// receiving HTTP headers means the service is reachable; status does not have to be 200
describe('Smoke tests for dialHttp 400', () => {
  let httpServer;
  let httpPort;

  beforeEach((done) => {
    httpServer = http.createServer((_, res) => {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Bad Request');
    });
    httpServer.listen(0, () => {
      httpPort = httpServer.address().port;
      done();
    });
  });

  it('should resolve when receiving a valid HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    dialHttp('127.0.0.1', httpPort)
      .then(() => {
        httpServer.close();
        done();
      })
      .catch(done);
  });

  it('should reject when receiving a non-HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    // create a temporary server that returns non-HTTP data
    const customServer = net.createServer((socket) => {
      socket.write('Not HTTP response');
      socket.end();
    });
    customServer.listen(0, () => {
      const customPort = customServer.address().port;
      dialHttp('127.0.0.1', customPort)
        .then(() => {
          customServer.close();
          done(new Error('Expected non-HTTP response error'));
        })
        .catch(() => {
          customServer.close();
          done();
        });
    });
  });

  it('should timeout when no response is received', (baseDone) => {
    const done = wrapDone(baseDone);
    // simulate an unresponsive server
    const silentServer = net.createServer(() => {
      // do not respond
    });
    silentServer.listen(0, () => {
      const silentPort = silentServer.address().port;
      dialHttp('127.0.0.1', silentPort)
        .then(() => {
          silentServer.close();
          done(new Error('Expected timeout error'));
        })
        .catch(() => {
          silentServer.close();
          done();
        });
    });
  });
});

// non-HTTP response test; dial returns success
describe('Non-HTTP response tests for dial', () => {
  let customServer;
  let port;

  beforeEach(async () => {
    await new Promise((resolve) => {
      customServer = net.createServer((socket) => {
        // return non-HTTP formatted data
        setTimeout(() => {
          socket.write('This is not a valid HTTP response');
          socket.end();
        }, 500);
      });
      customServer.listen(0, resolve);
    });
    port = customServer.address().port;
  });

  afterEach(async () => {
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => customServer.close(resolve));
  });

  it('should success when receiving a non-HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    dial('127.0.0.1', port)
      .then(() => {
        customServer.close();
        done();
      })
      .catch(() => {
        customServer.close();
        done(new Error('Expected timeout error'));
      });
  });
});

// non-HTTP response test; dialHttp returns an error
describe('Non-HTTP response tests for dialHttp', () => {
  let customServer;
  let port;

  beforeEach((done) => {
    customServer = net.createServer((socket) => {
      setTimeout(() => {
        socket.write('This is not a valid HTTP response');
        socket.end();
      }, 500);
    });
    customServer.listen(0, () => {
      port = customServer.address().port;
      done();
    });
  });

  it('should reject when receiving a non-HTTP response', (baseDone) => {
    const done = wrapDone(baseDone);
    dialHttp('127.0.0.1', port)
      .then(() => {
        customServer.close();
        done(new Error('Expected timeout error'));
      })
      .catch(() => {
        customServer.close();
        done();
      });
  });
});
