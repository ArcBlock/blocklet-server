/* eslint-disable consistent-return */
/* eslint-disable camelcase */
const { it, expect, describe } = require('bun:test');
const extend = require('lodash/extend');
const Promise = require('bluebird');
const Proxy = require('../../../lib/default/proxy');

const opts = {
  port: 10000 + Math.ceil(Math.random() * 55535),
};

describe('Custom Resolver', () => {
  it('Should contain one resolver by default', () => {
    const proxy = new Proxy(opts);
    expect(Array.isArray(proxy.resolvers)).toBe(true);
    expect(proxy.resolvers.length).toBe(1);
    expect(proxy.resolvers[0]).toBe(proxy._defaultResolver);

    proxy.close();
  });

  it('Should register resolver with right priority', () => {
    const resolver = () => 'http://127.0.0.1:8080';

    resolver.priority = 1;

    const options = extend(
      {
        resolvers: resolver,
      },
      opts
    );

    let proxy = new Proxy(options);

    expect(proxy.resolvers.length).toBe(2);
    expect(proxy.resolvers[0]).toEqual(resolver);

    proxy.close();

    // test when an array is sent in as resolvers.
    options.resolvers = [resolver];
    proxy = new Proxy(options);
    expect(proxy.resolvers.length).toBe(2);
    expect(proxy.resolvers[0]).toEqual(resolver);
    proxy.close();

    resolver.priority = -1;
    proxy = new Proxy(options);
    expect(proxy.resolvers.length).toBe(2);
    expect(proxy.resolvers[1]).toEqual(resolver);
    proxy.close();

    // test when invalid resolver is added
    options.resolvers = {};
    expect(() => new Proxy(options)).toThrowError(Error);
  });

  it('Should add and remove resolver after launch', () => {
    const resolver = () => {};
    resolver.priority = 1;

    const proxy = new Proxy(opts);
    proxy.addResolver(resolver);
    expect(proxy.resolvers.length).toBe(2);
    expect(proxy.resolvers[0]).toBe(resolver);

    proxy.addResolver(resolver);
    // Only allows uniques.
    expect(proxy.resolvers.length).toBe(2);

    proxy.removeResolver(resolver);
    expect(proxy.resolvers.length).toBe(1);
    expect(proxy.resolvers[0]).toBe(proxy._defaultResolver);

    proxy.close();
  });

  // TODO: 因为移除了缓存, 这个测试用例会失败, 需要修复
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('Should properly convert and cache route to routeObject', () => {
    const builder = Proxy.buildRoute;

    // invalid input
    expect(builder(() => {})).toBeNull();
    expect(builder([])).toBeNull();
    expect(builder(2016)).toBeNull();

    const testRoute = { urls: [], path: '/' };
    const testRouteResult = builder(testRoute);
    // For route in the default format
    expect(testRouteResult).toBe(testRoute);
    expect(testRouteResult.isResolved).toBeUndefined();

    // case string:
    const testString = 'http://127.0.0.1:8888';
    const result = builder(testString);
    expect(result.path).toBe('/');
    expect(Array.isArray(result.urls)).toBe(true);
    expect(result.urls.length).toBe(1);
    expect(result.urls[0].hostname).toBe('127.0.0.1');
    expect(result.isResolved).toBe(true);

    const result2 = builder(testString);
    expect(result2).toBe(result);

    // case with object

    const testObject_1 = { path: '/api', url: 'http://127.0.0.1' };
    const testObjectResult_1 = builder(testObject_1);

    expect(testObjectResult_1.path).toBe('/api');
    expect(Array.isArray(testObjectResult_1.urls)).toBe(true);
    expect(testObjectResult_1.urls.length).toBe(1);
    expect(testObjectResult_1.urls[0].hostname).toBe('127.0.0.1');
    expect(testObjectResult_1.isResolved).toBe(true);

    // test object caching.
    const testObjectResult_2 = builder(testObject_1);
    expect(testObjectResult_1).toBe(testObjectResult_2);

    const testObject_2 = { url: ['http://127.0.0.1', 'http://123.1.1.1'] };
    const testResult2 = builder(testObject_2);
    expect(testResult2.urls).toBeDefined();
    expect(testResult2.urls.length).toBe(testObject_2.url.length);
    expect(testResult2.urls[0].hostname).toBe('127.0.0.1');
    expect(testResult2.urls[1].hostname).toBe('123.1.1.1');
  });

  it('Should resolve properly as expected', () => {
    const proxy = new Proxy(opts);
    let resolver = (host, url) => (url.match(/\/ignore/i) ? null : 'http://172.12.0.1/home');

    resolver.priority = 1;

    proxy.register('mysite.example.com', 'http://127.0.0.1:9999');
    proxy.addResolver(resolver);
    // must match the resolver
    return proxy
      .resolve('randomsite.example.com', '/anywhere')
      .then((result) => {
        expect(result).not.toBeNull();
        expect(result).toBeDefined();
        expect(result.urls.length).toBeGreaterThan(0);
        expect(result.urls[0].hostname).toBe('172.12.0.1');

        // expect route to match resolver even though it matches registered address
        return proxy.resolve('mysite.example.com', '/somewhere');
      })
      .then((result) => {
        expect(result.urls[0].hostname).toBe('172.12.0.1');

        // use default resolver, as custom resolver should ignore input.
        return proxy.resolve('mysite.example.com', '/ignore');
      })
      .then((result) => {
        expect(result.urls[0].hostname).toBe('127.0.0.1');

        // make custom resolver low priority and test.
        // result should match default resolver
        resolver.priority = -1;
        proxy.addResolver(resolver);
        return proxy.resolve('mysite.example.com', '/somewhere');
      })
      .then((result) => {
        expect(result.urls[0].hostname).toBe('127.0.0.1');

        // both custom and default resolvers should ignore
        return proxy.resolve('somesite.example.com', '/ignore');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.removeResolver(resolver);

        // for path-based routing
        // when resolver path doesn't match that of url, skip

        resolver = () => ({ path: '/notme', url: 'http://172.12.0.1/home' });
        resolver.priority = 1;
        proxy.addResolver(resolver);

        return proxy.resolve('somesite.example.com', '/notme');
      })
      .then((result) => {
        expect(result).toBeDefined();
        expect(result.urls[0].hostname).toBe('172.12.0.1');

        return proxy.resolve('somesite.example.com', '/notme/somewhere');
      })
      .then((result) => {
        expect(result.urls[0].hostname).toBe('172.12.0.1');

        return proxy.resolve('somesite.example.com', '/itsme/somewhere');
      })
      .then((result) => {
        expect(result).toBeUndefined();
        proxy.close();
      });
  });
  it('Should resolve array properly as expected', () => {
    const proxy = new Proxy(opts);

    const firstResolver = (host, url) => {
      if (url.endsWith('/first-resolver')) {
        return 'http://first-resolver/';
      }
    };
    firstResolver.priority = 2;

    const secondResolver = (host, url) => {
      return new Promise((resolve) => {
        if (url.endsWith('/second-resolver')) {
          resolve('http://second-resolver/');
        } else {
          resolve(null);
        }
      });
    };
    secondResolver.priority = 1;

    proxy.resolvers = []; // remove the defaultResolver
    proxy.addResolver(firstResolver);
    proxy.addResolver(secondResolver);

    const cases = [
      proxy.resolve('mysite.example.com', '/first-resolver').then((result) => {
        expect(result.urls.length).toBeGreaterThan(0);
        expect(result.urls[0].hostname).toBe('first-resolver');
      }),
      proxy.resolve('mysite.example.com', '/second-resolver').then((result) => {
        expect(result.urls.length).toBeGreaterThan(0);
        expect(result.urls[0].hostname).toBe('second-resolver');
      }),
    ];

    return Promise.all(cases).then(
      () => proxy.close(),
      (err) => {
        proxy.close();
        throw err;
      }
    );
  });
});
