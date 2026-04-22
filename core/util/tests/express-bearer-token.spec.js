const { test, expect, describe } = require('bun:test');
const cookie = require('cookie-signature');

const bearerToken = require('../lib/express-bearer-token');

describe('bearerToken', () => {
  const token = 'test-token';
  const secret = 'SUPER_SECRET';

  test('finds a bearer token in post body under "access_token" and sets it to req.token', (done) => {
    const req = { body: { access_token: token } };
    bearerToken('secret')(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in query string under "access_token" and sets it to req.token', (done) => {
    const req = { query: { access_token: token } };
    bearerToken()(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in headers under "authorization: bearer" and sets it to req.token', (done) => {
    const req = { headers: { authorization: `Bearer ${token}` } };
    bearerToken()(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in post body under an arbitrary key and sets it to req.token', (done) => {
    const req = { body: { test: token } };
    bearerToken({ bodyKey: 'test' })(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in query string under "access_token" and sets it to req.token', (done) => {
    const req = { query: { test: token } };
    bearerToken({ queryKey: 'test' })(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in headers under "authorization: <anykey>" and sets it to req.token', (done) => {
    const req = { headers: { authorization: `test ${token}` } };
    bearerToken({ headerKey: 'test' })(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in header SIGNED cookie[<anykey>] and sets it to req.token', (done) => {
    // simulate the res.cookie signed prefix 's:'
    const signedCookie = encodeURI(`s:${cookie.sign(token, secret)}`);
    const req = { headers: { cookie: `test=${signedCookie}; ` } };
    bearerToken({ cookie: { key: 'test', signed: true, secret } })(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token in header NON SIGNED cookie[<anykey>] and sets it to req.token', (done) => {
    const req = { headers: { cookie: `test=${token}; ` } };
    bearerToken({ cookie: { key: 'test' } })(req, {}, () => {
      expect(req.token).toEqual(token);
      done();
    });
  });

  test('finds a bearer token and sets it to req[<anykey>]', (done) => {
    const req = { body: { access_token: token } };
    const reqKey = 'test';
    bearerToken({ reqKey })(req, {}, () => {
      expect(req[reqKey]).toEqual(token);
      done();
    });
  });

  test('aborts with 400 if token is provided in more than one location', (done) => {
    const req = {
      query: {
        access_token: 'query-token',
      },
      body: {
        access_token: 'query-token',
      },
      headers: {
        authorization: 'Bearer header-token',
        cookie: 'access_token=cookie-token;',
      },
    };
    const res = {
      status(code) {
        res.code = code;
        return res;
      },
      send(msg) {
        expect(res.code).toEqual(400);
        expect(msg).toEqual('Access token found in multiple locations');
        done();
      },
    };
    bearerToken()(req, res);
  });

  test('should prefer bear token if also exist in cookie', (done) => {
    const req = {
      headers: {
        authorization: 'Bearer header-token',
        cookie: 'access_token=cookie-token;',
      },
    };
    bearerToken({ cookie: { key: 'access_token' } })(req, {}, () => {
      expect(req.token).toEqual('header-token');
      done();
    });
  });

  test('should abort 400 if same value exist in header and cookie', (done) => {
    const req = {
      headers: {
        authorization: 'Bearer same-token',
        cookie: 'access_token=same-token;',
      },
    };
    const res = {
      status(code) {
        res.code = code;
        return res;
      },
      send(msg) {
        expect(res.code).toEqual(400);
        expect(msg).toEqual('Access token found in multiple locations');
        done();
      },
    };
    bearerToken({ cookie: { key: 'access_token' } })(req, res);
  });
});
