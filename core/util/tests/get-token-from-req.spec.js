const { describe, test, expect } = require('bun:test');
const cookie = require('cookie-signature');

const { getTokenFromReq } = require('../lib/get-token-from-req');

describe('bearerToken', () => {
  const _token = 'test-token';
  const secret = 'SUPER_SECRET';

  test('finds a bearer token in post body under "access_token" and sets it to req.token', async () => {
    const req = { body: { access_token: _token } };
    const { _duplicate, token } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in query string under "access_token" and sets it to req.token', async () => {
    const req = { query: { access_token: _token } };
    const { _duplicate, token } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in headers under "authorization: bearer" and sets it to req.token', async () => {
    const req = { headers: { authorization: `Bearer ${_token}` } };
    const { _duplicate, token } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in post body under an arbitrary key and sets it to req.token', async () => {
    const req = { body: { test: _token } };
    const { _duplicate, token } = await getTokenFromReq(req, { bodyKey: 'test' });
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in query string under "access_token" and sets it to req.token', async () => {
    const req = { query: { test: _token } };
    const { _duplicate, token } = await getTokenFromReq(req, { queryKey: 'test' });
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in headers under "authorization: <anykey>" and sets it to req.token', async () => {
    const req = { headers: { authorization: `test ${_token}` } };
    const { _duplicate, token } = await getTokenFromReq(req, { headerKey: 'test' });
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in header SIGNED cookie[<anykey>] and sets it to req.token', async () => {
    // simulate the res.cookie signed prefix 's:'
    const signedCookie = encodeURI(`s:${cookie.sign(_token, secret)}`);
    const req = { headers: { cookie: `test=${signedCookie}; ` } };
    const { _duplicate, token } = await getTokenFromReq(req, { cookie: { key: 'test', signed: true, secret } });
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('finds a bearer token in header NON SIGNED cookie[<anykey>] and sets it to req.token', async () => {
    const req = { headers: { cookie: `test=${_token}; ` } };
    const { _duplicate, token } = await getTokenFromReq(req, { cookie: { key: 'test' } });
    expect(_duplicate).toEqual(false);
    expect(token).toEqual(_token);
  });

  test('aborts with 400 if token is provided in more than one location', async () => {
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
    const { _duplicate } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(true);
  });

  test('should prefer bear token if also exist in cookie', async () => {
    const req = {
      headers: {
        authorization: 'Bearer header-token',
        cookie: 'access_token=cookie-token;',
      },
    };
    const { _duplicate, token } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(false);
    expect(token).toEqual('header-token');
  });

  test('should abort 400 if same value exist in header and cookie', async () => {
    const req = {
      headers: {
        authorization: 'Bearer same-token',
        cookie: 'access_token=same-token;',
      },
    };
    const { _duplicate } = await getTokenFromReq(req);
    expect(_duplicate).toEqual(true);
  });
});
