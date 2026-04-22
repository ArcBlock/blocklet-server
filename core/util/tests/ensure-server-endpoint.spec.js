const { it, expect, describe, beforeEach, afterEach, afterAll } = require('bun:test');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { WELLKNOWN_DID_RESOLVER_PREFIX, DEFAULT_DID_DOMAIN } = require('@abtnode/constant');
const ensureServerEndpoint = require('../lib/ensure-server-endpoint');
const { encode: encodeBase32 } = require('../lib/base32');

describe('ensureServerEndpoint', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  it('should handle service endpoint with valid blocklet json', async () => {
    const endpoint = 'https://example.com';
    const serverDid = 'did:abt:example';
    const mockBlockletData = {
      serverDid,
      appPid: 'test-pid',
      appName: 'Test App',
      appDescription: 'Test Description',
    };

    mock
      .onGet('https://example.com/__blocklet__.js?type=json')
      .reply(200, mockBlockletData, { 'content-type': 'application/json' });

    const encodedDid = encodeBase32(serverDid);
    const expectedDomain = `${encodedDid}.${DEFAULT_DID_DOMAIN}`;

    mock
      .onGet(`https://${expectedDomain}${WELLKNOWN_DID_RESOLVER_PREFIX}`)
      .reply(200, { services: [{ path: '/api' }] }, { 'content-type': 'application/json' });

    const result = await ensureServerEndpoint(endpoint);
    expect(result).toEqual({
      endpoint: `https://${expectedDomain}/api`,
      appPid: 'test-pid',
      appName: 'Test App',
      appDescription: 'Test Description',
    });
  });

  it('should handle localhost development endpoint', async () => {
    const endpoint = 'http://localhost:3000';

    mock.onGet('http://localhost:3000/__blocklet__.js?type=json').reply(404);

    const result = await ensureServerEndpoint(endpoint);
    expect(result).toEqual({
      endpoint: 'http://localhost:3000',
      appPid: '',
    });
  });

  it('should handle server endpoint without blocklet json', async () => {
    const endpoint = 'https://example.com';

    mock.onGet('https://example.com/__blocklet__.js?type=json').reply(404);

    mock
      .onGet('https://example.com/.well-known/did.json')
      .reply(200, { services: [{ path: '/api' }] }, { 'content-type': 'application/json' });

    const result = await ensureServerEndpoint(endpoint);
    expect(result).toEqual({
      endpoint: 'https://example.com/api',
      appPid: '',
    });
  });

  it('should throw error for invalid endpoint with invalid did.json', async () => {
    const endpoint = 'https://example.com';

    mock.onGet('https://example.com/__blocklet__.js?type=json').reply(404);

    mock.onGet('https://example.com/.well-known/did.json').reply(200, {}, { 'content-type': 'text/plain' });

    await expect(ensureServerEndpoint(endpoint)).rejects.toThrow('Invalid endpoint');
  });

  it('should throw error when both blocklet json and did.json requests fail', async () => {
    const endpoint = 'https://example.com';

    mock.onGet('https://example.com/__blocklet__.js?type=json').reply(404);

    mock.onGet('https://example.com/.well-known/did.json').networkError();

    await expect(ensureServerEndpoint(endpoint)).rejects.toThrow();
  });
});
