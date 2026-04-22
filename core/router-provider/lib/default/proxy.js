/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
const fs = require('fs');
const http = require('http');
const https = require('https');
const httpProxy = require('@arcblock/http-proxy');
const validUrl = require('valid-url');
const path = require('path');
const clone = require('lodash/clone');
const remove = require('lodash/remove');
const uniq = require('lodash/uniq');
const find = require('lodash/find');
const flatten = require('lodash/flatten');
const map = require('lodash/map');
const sortBy = require('lodash/sortBy');
const defaults = require('lodash/defaults');
const isArray = require('lodash/isArray');
const isString = require('lodash/isString');
const isObject = require('lodash/isObject');
const isFunction = require('lodash/isFunction');
const tls = require('tls');

// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')('router:default:proxy', { filename: 'engine' });

const ensureHttp = (str) => (!str.startsWith('http://') && !str.startsWith('https://') ? `http://${str}` : str);
const prepareUrl = (url) => {
  url = clone(url);
  if (isString(url)) {
    url = ensureHttp(url);
    if (!validUrl.isHttpUri(url) && !validUrl.isHttpsUri(url)) {
      throw new Error(`uri is not a valid http uri ${url}`);
    }

    url = new URL(url);
  }

  return url;
};

module.exports = class ReverseProxy {
  opts = {};

  constructor(opts = {}) {
    this._defaultResolver.priority = 0;

    this.opts = opts;

    if (!this.opts.httpProxy) {
      this.opts.httpProxy = {};
    }
    if (!this.opts.headers) {
      this.opts.headers = [];
    }
    if (!this.opts.onError) {
      this.opts.onError = (err) => console.error(err);
    }

    const websocketUpgrade = (req, socket, head) => {
      socket.on('error', (err) => logger.error('WebSockets error', { error: err }));
      const src = this._getSource(req);
      this._getTarget(src, req).then((target) => {
        logger.info('upgrade to websocket', { host: req.headers.host, url: req._url, target });
        if (target) {
          this.proxy.ws(req, socket, head, { target });
        } else {
          this._handleNotFound(req, socket);
        }
      });
    };

    this.resolvers = [this._defaultResolver];
    opts.port = opts.port || 8080;

    if (opts.resolvers) {
      this.addResolver(opts.resolvers);
    }

    // Routing table.
    this.routing = {};
    this.certs = {};

    // Create a proxy server with custom application logic
    this.proxy = httpProxy.createProxyServer({
      xfwd: !!opts.xfwd,
      prependPath: false,
      secure: opts.secure !== false,
      timeout: opts.timeout,
      proxyTimeout: opts.proxyTimeout,
      changeOrigin: false,
    });

    this.proxy.on('proxyReq', (p, req) => {
      if (req.host != null) {
        p.setHeader('host', req.host);
      }
    });

    // @link: https://github.com/http-party/node-http-proxy/issues/1401
    this.proxy.on('proxyRes', (proxyRes) => {
      this.opts.headers.forEach((x) => {
        proxyRes.headers[x.key] = x.value;
      });
    });

    // Optionally create an https proxy server.
    if (opts.ssl) {
      if (Array.isArray(opts.ssl)) {
        opts.ssl.forEach((sslOpts) => {
          this.setupHttpsProxy(this.proxy, websocketUpgrade, sslOpts);
        });
      } else {
        this.setupHttpsProxy(this.proxy, websocketUpgrade, opts.ssl);
      }
    }

    // Plain HTTP Proxy
    const server = this.setupHttpProxy(this.proxy, websocketUpgrade, opts);
    server.listen(opts.port, opts.host);

    this.proxy.on('error', opts.onError);
    logger.info('Started reverse proxy server on port %s', opts.port);
  }

  setupHttpProxy(proxy, websocketUpgrade, opts) {
    const server = http.createServer((req, res) => {
      const src = this._getSource(req);

      this._getTarget(src, req, res).then((target) => {
        if (target) {
          if (target.abort) {
            return;
          }

          if (this._shouldRedirectToHttps(this.certs, src, target, this)) {
            this._redirectToHttps(req, res, target, opts.ssl);
          } else {
            if (opts.internal && target.host) {
              req.host = target.host;
              req.headers.host = target.host;
            }
            proxy.web(req, res, {
              target,
              secure: !proxy.options || proxy.options.secure !== false,
            });
          }
        } else {
          this._handleNotFound(req, res);
        }
      });
    });

    // Listen to the `upgrade` event and proxy the WebSocket requests as well.
    server.on('upgrade', websocketUpgrade);

    server.on('error', (err) => logger.error('Http server error', { error: err }));

    return server;
  }

  _shouldRedirectToHttps(certs, src, target) {
    return certs && src in certs && target.sslRedirect;
  }

  setupHttpsProxy(proxy, websocketUpgrade, sslOpts) {
    let ssl = {
      SNICallback: (hostname, cb) => {
        if (cb) {
          cb(null, this.certs[hostname]);
        } else {
          return this.certs[hostname];
        }
      },
      // Default certs for clients that do not support SNI.
      key: this._getCertData(sslOpts.key),
      cert: this._getCertData(sslOpts.cert),
    };

    // Allows the option to disable older SSL/TLS versions
    if (sslOpts.secureOptions) {
      ssl.secureOptions = sslOpts.secureOptions;
    }

    if (sslOpts.opts) {
      ssl = defaults(ssl, sslOpts.opts);
    }

    this.httpsServer = https.createServer(ssl, (req, res) => {
      const src = this._getSource(req);

      const httpProxyOpts = Object.assign({}, this.opts.httpProxy);
      this._getTarget(src, req, res).then((target) => {
        if (target) {
          if (target.abort) {
            return;
          }

          httpProxyOpts.target = target;
          proxy.web(req, res, httpProxyOpts);
        } else {
          this._handleNotFound(req, res);
        }
      });
    });

    this.httpsServer.on('upgrade', websocketUpgrade);
    this.httpsServer.on('error', (err) => logger.error('HTTPS server Error', { error: err }));
    this.httpsServer.on('clientError', (err) => logger.error('HTTPS client Error', { error: err }));

    logger.info('Listening to HTTPS requests on port %s', sslOpts.port);
    this.httpsServer.listen(sslOpts.port, sslOpts.ip);
  }

  addResolver(_resolver) {
    const resolver = Array.isArray(_resolver) ? _resolver : [_resolver];
    resolver.forEach((resolveObj) => {
      if (!isFunction(resolveObj)) {
        throw new Error('Resolver must be an invokable function.');
      }

      if (!resolveObj.priority) {
        resolveObj.priority = 0;
      }

      this.resolvers.push(resolveObj);
    });

    this.resolvers = sortBy(uniq(this.resolvers), ['priority']).reverse();
  }

  removeResolver(resolver) {
    // since unique resolvers are not checked for performance, just remove every existence.
    this.resolvers = this.resolvers.filter((x) => x !== resolver);
  }

  static buildTarget(target, opts = {}) {
    const newTarget = prepareUrl(target);
    newTarget.sslRedirect = opts.ssl && opts.ssl.redirect !== false;
    return newTarget;
  }

  /**
   * Register a new route.
   *
   * @param {string | URL} src A string or a url parsed by node url module.
   * Note that port is ignored, since the proxy just listens to one port.
   * @param {string} target A string or a url parsed by node url module.
   * @param {*} opts Route options.
   */
  register(src, target, opts = {}) {
    // allow registering with src or target as an object to pass in
    // options specific to each one.
    if (src && src.src) {
      target = src.target;
      opts = src;
      src = src.src;
    } else if (target && target.target) {
      opts = target;
      target = target.target;
    }

    if (!src || !target) {
      throw Error('Cannot register a new route with unspecified src or target');
    }

    src = prepareUrl(src);

    const { ssl } = opts;
    if (ssl) {
      if (!this.httpsServer) {
        throw Error('Cannot register https routes without defining a ssl port');
      }

      if (!this.certs[src.hostname]) {
        if (ssl.key || ssl.cert) {
          this.certs[src.hostname] = this._createCredentialContext(ssl.key, ssl.cert);
        } else {
          // Trigger the use of the default certificates.
          this.certs[src.hostname] = undefined;
        }
      }
    }

    target = ReverseProxy.buildTarget(target, opts);

    if (!this.routing[src.hostname]) {
      this.routing[src.hostname] = [];
    }

    const host = this.routing[src.hostname];
    const pathname = src.pathname || '/';
    let route = find(host, { path: pathname });

    if (!route) {
      route = { path: pathname, rr: 0, urls: [], opts: Object.assign({}, opts) };
      host.push(route);

      // Sort routes
      this.routing[src.hostname] = sortBy(host, (x) => -x.path.length);
    }

    route.urls.push(target);

    logger.info('Registered a new route', { from: src, to: target });
    return this;
  }

  unregister(src, target) {
    if (!src) {
      return this;
    }

    src = prepareUrl(src);
    const routes = this.routing[src.hostname] || [];
    const pathname = src.pathname || '/';
    let i = 0;

    for (i = 0; i < routes.length; i++) {
      if (routes[i].path === pathname) {
        break;
      }
    }

    if (i < routes.length) {
      const route = routes[i];

      if (target) {
        target = prepareUrl(target);
        remove(route.urls, (x) => x.href === target.href);
      } else {
        route.urls = [];
      }

      if (route.urls.length === 0) {
        routes.splice(i, 1);
        delete this.certs[src.hostname];
      }

      logger.info('Unregistered a route', { from: src, to: target });
    }
    return this;
  }

  _defaultResolver(host, url) {
    // Given a src resolve it to a target route if any available.
    if (!host) {
      return;
    }

    url = url || '/';

    const routes = this.routing[host];
    let i = 0;

    if (routes) {
      const len = routes.length;

      // Find path that matches the start of req.url
      for (i = 0; i < len; i++) {
        const route = routes[i];

        if (route.path === '/' || this._startsWith(url, route.path)) {
          return route;
        }
      }
    }
  }

  /**
   * Resolves to route
   * @param host
   * @param url
   * @returns {*}
   */
  resolve(host, url, req) {
    const promiseArray = [];

    host = host && host.toLowerCase();
    for (let i = 0; i < this.resolvers.length; i++) {
      promiseArray.push(this.resolvers[i].call(this, host, url, req));
    }

    return Promise.all(promiseArray)
      .then((resolverResults) => {
        for (let i = 0; i < resolverResults.length; i++) {
          let route = resolverResults[i];
          if (route) {
            route = ReverseProxy.buildRoute(route);
            // ensure resolved route has path that prefixes URL
            // no need to check for native routes.
            if (!route.isResolved || route.path === '/' || this._startsWith(url, route.path)) {
              return route;
            }
          }
        }
      })
      .catch((error) => {
        console.error('Resolvers error:', error);
      });
  }

  static buildRoute(route) {
    if (!isString(route) && !isObject(route)) {
      return null;
    }

    // default route type matched.
    if (isObject(route) && route.urls && route.path) {
      return route;
    }

    const routeObject = { rr: 0, isResolved: true };
    if (isString(route)) {
      routeObject.urls = [ReverseProxy.buildTarget(route)];
      routeObject.path = '/';
    } else {
      if (!route.url) {
        return null;
      }

      routeObject.urls = (isArray(route.url) ? route.url : [route.url]).map((url) =>
        ReverseProxy.buildTarget(url, route.opts || {})
      );

      routeObject.path = route.path || '/';
      routeObject.opts = route.opts || {};
    }
    return routeObject;
  }

  _getTarget(src, req, res) {
    const { url } = req;

    return this.resolve(src, url, req).then((route) => {
      if (!route) {
        logger.warn('no valid route found for given source', { src, url });
        return;
      }

      req._url = url; // save original url
      req.url = url.substr(route.path.length) || '';

      // Perform Round-Robin on the available targets
      // TODO: if target errors with EHOSTUNREACH we should skip this
      // target and try with another.
      const { urls } = route;
      const j = route.rr;
      route.rr = (j + 1) % urls.length; // get and update Round-robin index.
      const target = route.urls[j];

      // Fix request url if target name specified.
      if (target.pathname) {
        if (req.url) {
          req.url = path.posix.join(target.pathname, req.url);
        } else {
          req.url = target.pathname;
        }
      }

      if (route.opts && route.opts.onRequest) {
        const resultFromRequestHandler = route.opts.onRequest(req, res, target);
        if (resultFromRequestHandler !== undefined) {
          logger.info('proxy returned result from onRequest handler', { from: src + url });
          return resultFromRequestHandler;
        }
      }

      logger.info('proxy', { from: src + url, to: path.posix.join(target.host, req.url) });

      return target;
    });
  }

  _getSource(req) {
    if (this.opts.preferForwardedHost === true && req.headers['x-forwarded-host']) {
      return req.headers['x-forwarded-host'].split(':')[0];
    }
    if (req.headers.host) {
      return req.headers.host.split(':')[0];
    }
  }

  close() {
    try {
      return Promise.all(
        [this.server, this.httpsServer]
          .filter((s) => s)
          // eslint-disable-next-line no-promise-executor-return
          .map((server) => new Promise((resolve) => server.close(resolve)))
      );
    } catch (err) {
      // Ignore for now...
    }
  }

  _handleNotFound = (req, res) => {
    const err = new Error(`Not Found: ${this._getSource(req)}${req.url}`);
    err.code = 'NOTFOUND';
    this.opts.onError(err, req, res);
  };

  // Redirect to the HTTPS proxy
  _redirectToHttps(req, res, target, ssl) {
    req.url = req._url || req.url; // Get the original url since we are going to redirect.

    const targetPort = Number(ssl.redirectPort || ssl.port);
    const hostname = req.headers.host.split(':')[0] + (targetPort && targetPort !== 443 ? `:${targetPort}` : '');
    const url = `https://${path.posix.join(hostname, req.url)}`;
    logger.info('redirect: %s => %s', path.posix.join(req.headers.host, req.url), url);
    // We can use 301 for permanent redirect, but its bad for debugging, we may have it as
    // a configurable option.
    res.writeHead(302, { Location: url });
    res.end();
  }

  _startsWith(input, str) {
    return input.slice(0, str.length) === str && (input.length === str.length || input[str.length] === '/');
  }

  _getCertData(source, unbundle) {
    let data;
    if (source) {
      if (isArray(source)) {
        const sources = source;
        return flatten(map(sources, (_source) => this._getCertData(_source, unbundle)));
      }
      if (Buffer.isBuffer(source)) {
        data = source.toString('utf8');
      } else if (fs.existsSync(source)) {
        data = fs.readFileSync(source, 'utf8');
      }
    }
    return data;
  }

  _createCredentialContext(key, cert) {
    const opts = {};

    opts.key = this._getCertData(key);
    opts.cert = this._getCertData(cert);

    const credentials = tls.createSecureContext(opts);
    return credentials.context;
  }
};
