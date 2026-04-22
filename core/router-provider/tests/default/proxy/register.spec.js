const { it, expect, describe } = require('bun:test');
const net = require('net');
const Promise = require('bluebird');
const Proxy = require('../../../lib/default/proxy');

const opts = {};

describe('Route registration', () => {
  it('should register a simple route', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');

    expect(proxy.routing['example.com']).toBeTruthy();

    return proxy
      .resolve('example.com')
      .then((result) => {
        expect(result).toBeInstanceOf(Object);

        const host = proxy.routing['example.com'];
        expect(Array.isArray(host)).toBe(true);
        expect(host[0]).toHaveProperty('path');
        expect(host[0].path).toBe('/');
        expect(Array.isArray(host[0].urls)).toBe(true);
        expect(host[0].urls.length).toBe(1);
        expect(host[0].urls[0].href).toBe('http://192.168.1.2:8080/');

        proxy.unregister('example.com', '192.168.1.2:8080');

        return proxy.resolve('example.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.close();
      });
  });

  it('should resolve domains as case insensitive', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');

    return proxy.resolve('Example.com').then((target) => {
      expect(target).toBeInstanceOf(Object);
      expect(target.urls[0].hostname).toBe('192.168.1.2');

      proxy.close();
    });
  });

  it('should register multiple routes', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example1.com', '192.168.1.2:8080');
    proxy.register('example2.com', '192.168.1.3:8081');
    proxy.register('example3.com', '192.168.1.4:8082');
    proxy.register('example4.com', '192.168.1.5:8083');
    proxy.register('example5.com', '192.168.1.6:8084');

    expect(proxy.routing['example1.com']).toBeTruthy();
    expect(proxy.routing['example2.com']).toBeTruthy();
    expect(proxy.routing['example3.com']).toBeTruthy();
    expect(proxy.routing['example4.com']).toBeTruthy();
    expect(proxy.routing['example5.com']).toBeTruthy();

    let host;

    host = proxy.routing['example1.com'];
    expect(host[0].path).toBe('/');
    expect(host[0].urls[0].href).toBe('http://192.168.1.2:8080/');

    host = proxy.routing['example2.com'];
    expect(host[0].path).toBe('/');
    expect(host[0].urls[0].href).toBe('http://192.168.1.3:8081/');

    host = proxy.routing['example3.com'];
    expect(host[0].path).toBe('/');
    expect(host[0].urls[0].href).toBe('http://192.168.1.4:8082/');

    host = proxy.routing['example4.com'];
    expect(host[0].path).toBe('/');
    expect(host[0].urls[0].href).toBe('http://192.168.1.5:8083/');

    host = proxy.routing['example5.com'];
    expect(host[0].path).toBe('/');
    expect(host[0].urls[0].href).toBe('http://192.168.1.6:8084/');

    proxy.unregister('example1.com');

    return proxy
      .resolve('example1.com')
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.unregister('example2.com');
        return proxy.resolve('example2.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.unregister('example3.com');
        return proxy.resolve('example3.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.unregister('example4.com');
        return proxy.resolve('example4.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.unregister('example5.com');
        return proxy.resolve('example5.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.close();
      });
  });
  it('should register several pathnames within a route', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080');
    proxy.register('example.com/bar', '192.168.1.4:8080');

    expect(proxy.routing['example.com']).toBeTruthy();

    const host = proxy.routing['example.com'];
    expect(Array.isArray(host)).toBe(true);
    expect(host[0]).toHaveProperty('path');
    expect(host[0].path).toBe('/qux/baz');
    expect(Array.isArray(host[0].urls)).toBe(true);
    expect(host[0].urls.length).toBe(1);
    expect(host[0].urls[0].href).toBe('http://192.168.1.5:8080/');

    expect(host[0].path.length).toBeGreaterThanOrEqual(host[1].path.length);
    expect(host[1].path.length).toBeGreaterThanOrEqual(host[2].path.length);
    expect(host[2].path.length).toBeGreaterThanOrEqual(host[3].path.length);

    proxy.unregister('example.com');
    return proxy
      .resolve('example.com')
      .then((result) => {
        expect(result).toBeUndefined();
        return proxy.resolve('example.com', '/foo');
      })
      .then((result) => {
        expect(result).toBeInstanceOf(Object);

        proxy.unregister('example.com/foo');
        return proxy.resolve('example.com', '/foo');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.close();
      });
  });
  it('shouldnt crash process in unregister of unregisted host', (done) => {
    const proxy = new Proxy(opts);

    proxy.unregister('example.com');

    done();

    proxy.close();
  });
});

describe('Route resolution', () => {
  it('should resolve to a correct route', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080');
    proxy.register('example.com/bar', '192.168.1.4:8080');
    proxy.register('example.com/foo/baz', '192.168.1.3:8080');

    return proxy.resolve('example.com', '/foo/asd/1/2').then((route) => {
      expect(route.path).toBe('/foo');
      expect(route.urls.length).toBe(1);
      expect(route.urls[0].href).toBe('http://192.168.1.3:8080/');

      proxy.close();
    });
  });

  it('should resolve to a correct route with complex path', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080');
    proxy.register('example.com/bar', '192.168.1.4:8080');
    proxy.register('example.com/foo/baz', '192.168.1.7:8080');

    return proxy.resolve('example.com', '/foo/baz/a/b/c').then((route) => {
      expect(route.path).toBe('/foo/baz');
      expect(route.urls.length).toBe(1);
      expect(route.urls[0].href).toBe('http://192.168.1.7:8080/');

      proxy.close();
    });
  });

  it('should resolve to undefined if route not available', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080');
    proxy.register('foobar.com/bar', '192.168.1.4:8080');
    proxy.register('foobar.com/foo/baz', '192.168.1.3:8080');

    return proxy
      .resolve('wrong.com')
      .then((route) => {
        expect(route).toBeUndefined();

        return proxy.resolve('foobar.com');
      })
      .then((route) => {
        expect(route).toBeUndefined();

        proxy.close();
      });
  });

  it('should get a target if route available', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080');
    proxy.register('foobar.com/bar', '192.168.1.4:8080');
    proxy.register('foobar.com/foo/baz', '192.168.1.7:8080');
    proxy.register('foobar.com/media', '192.168.1.7:8080');

    return proxy
      .resolve('example.com', '/qux/a/b/c')
      .then((route) => {
        expect(route.path).toBe('/');

        return proxy.resolve('foobar.com', '/medias/');
      })
      .then((route) => {
        expect(route).toBeUndefined();

        return proxy.resolve('foobar.com', '/mediasa');
      })
      .then((route) => {
        expect(route).toBeUndefined();
        return proxy.resolve('foobar.com', '/media/sa');
      })
      .then((route) => {
        expect(route.path).toBe('/media');

        return proxy._getTarget('example.com', { url: '/foo/baz/a/b/c' });
      })
      .then((target) => {
        expect(target.href).toBe('http://192.168.1.3:8080/');

        proxy.close();
      });
  });

  it('should get a target with path when necessary', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com/qux/baz', '192.168.1.5:8080');
    proxy.register('example.com/foo', '192.168.1.3:8080/a/b');
    proxy.register('foobar.com/bar', '192.168.1.4:8080');
    proxy.register('foobar.com/foo/baz', '192.168.1.7:8080');

    const req = { url: '/foo/baz/a/b/c' };
    return proxy
      .resolve('example.com', '/qux/a/b/c')
      .then((route) => {
        expect(route.path).toBe('/');

        return proxy._getTarget('example.com', req);
      })
      .then((target) => {
        expect(target.href).toBe('http://192.168.1.3:8080/a/b');
        expect(req.url).toBe('/a/b/baz/a/b/c');

        proxy.close();
      });
  });
});

describe('TLS/SSL', () => {
  it('should allow TLS/SSL certificates', () => {
    const proxy = new Proxy({
      ssl: {
        port: 4430,
      },
    });

    expect(proxy.routing).toBeInstanceOf(Object);
    proxy.register('example.com', '192.168.1.1:8080', {
      ssl: {
        key: 'dummy',
        cert: 'dummy',
      },
    });

    expect(proxy.certs).toBeInstanceOf(Object);
    expect(proxy.certs['example.com']).toBeTruthy();

    proxy.unregister('example.com', '192.168.1.1:8080');

    return proxy.resolve('example.com').then((result) => {
      expect(result).toBeUndefined();
      expect(proxy.certs['example.com']).toBeUndefined();
      proxy.unregister('example.com', '192.168.1.2:8080');
    });
  });

  it('Should bind https servers to different ip addresses', (testDone) => {
    const isPortTaken = (port, ip, done) => {
      const tester = net
        .createServer()
        .once('error', (err) => {
          if (err.code !== 'EADDRINUSE') {
            done(err);
          } else {
            done(null, true);
          }
        })
        .once('listening', () => {
          tester
            .once('close', () => {
              done(null, false);
            })
            .close();
        })
        .listen(port, ip);
    };

    const proxy = new Proxy({
      port: 8080,

      // Specify filenames to default SSL certificates (in case SNI is not supported by the
      // user's browser)
      ssl: [
        {
          port: 4433,
          key: 'dummy',
          cert: 'dummy',
          ip: '127.0.0.1',
        },
        {
          port: 4434,
          key: 'dummy',
          cert: 'dummy',
          ip: '127.0.0.1',
        },
      ],
    });

    proxy.register('mydomain.com', 'http://127.0.0.1:8001', {
      ssl: {
        key: 'dummy',
        cert: 'dummy',
        ca: 'dummym',
      },
    });

    let portsTaken = 0;
    let portsChecked = 0;

    function portsTakenDone(err, taken) {
      portsChecked++;
      if (err) {
        throw err;
      }
      if (taken) {
        portsTaken++;
      }
      if (portsChecked === 2) {
        portsCheckDone();
      }
    }

    function portsCheckDone() {
      expect(portsTaken).toBe(2);
      proxy.close();
      testDone();
    }

    isPortTaken(4433, '127.0.0.1', portsTakenDone);
    isPortTaken(4434, '127.0.0.1', portsTakenDone);
  });
});

// eslint-disable-next-line jest/no-disabled-tests
describe.skip('Load balancing', () => {
  it('should load balance between several targets', () => {
    const proxy = new Proxy(opts);

    expect(proxy.routing).toBeInstanceOf(Object);

    proxy.register('example.com', '192.168.1.1:8080');
    proxy.register('example.com', '192.168.1.2:8080');
    proxy.register('example.com', '192.168.1.3:8080');
    proxy.register('example.com', '192.168.1.4:8080');

    expect(proxy.routing['example.com'][0].urls.length).toBe(4);
    expect(proxy.routing['example.com'][0].rr).toBe(0);

    return proxy
      .resolve('example.com', '/foo/qux/a/b/c')
      .then((route) => {
        expect(route.urls.length).toBe(4);

        return Promise.each(Array(1000).fill(null), () =>
          proxy
            ._getTarget('example.com', { url: '/a/b/c' })
            .then((target) => {
              expect(target.href).toBe('http://192.168.1.1:8080/');
              expect(proxy.routing['example.com'][0].rr).toBe(1);

              return proxy._getTarget('example.com', { url: '/x/y' });
            })
            .then((target) => {
              expect(target.href).toBe('http://192.168.1.2:8080/');
              expect(proxy.routing['example.com'][0].rr).toBe(2);

              return proxy._getTarget('example.com', { url: '/j' });
            })
            .then((target) => {
              expect(target.href).toBe('http://192.168.1.3:8080/');
              expect(proxy.routing['example.com'][0].rr).toBe(3);

              return proxy._getTarget('example.com', { url: '/k/' });
            })
            .then((target) => {
              expect(target.href).toBe('http://192.168.1.4:8080/');
              expect(proxy.routing['example.com'][0].rr).toBe(0);
            })
        );
      })
      .then(() => {
        proxy.unregister('example.com', '192.168.1.1:8080');
        return proxy.resolve('example.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.unregister('example.com', '192.168.1.2:8080');
        return proxy.resolve('example.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.unregister('example.com', '192.168.1.3:8080');

        return proxy.resolve('example.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.unregister('example.com', '192.168.1.4:8080');

        return proxy.resolve('example.com');
      })
      .then((result) => {
        expect(result).toBeUndefined();

        proxy.close();
      });
  });
});
