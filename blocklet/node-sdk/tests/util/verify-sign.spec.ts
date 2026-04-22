import { beforeEach, describe, it, expect, spyOn, mock, afterAll, afterEach } from 'bun:test';
import type { Request } from 'express';
import { SIG_VERSION } from '@blocklet/constant';
import { fromRandom } from '@ocap/wallet';
import stableStringify from 'json-stable-stringify';
import { getVerifyData, getSignData, sign, verify } from '../../src/util/verify-sign';

const wallet = fromRandom();

const testBody = {
  key: 'value',
  _number: 1,
  _boolean: true,
  _null: null,
  _undefined: undefined,
  _array: [
    'string',
    1,
    true,
    null,
    undefined,
    {
      key: 'value',
      _number: 1,
      _boolean: true,
      _null: null,
      _undefined: undefined,
    },
  ],
  _object: {
    key: 'value',
    _number: 1,
    _boolean: true,
    _null: null,
    _undefined: undefined,
  },
} as unknown as Record<string, any>;

// NOTICE: body processing removes undefined object values and converts undefined array values to null (JSON.stringify behavior)
const processedBody = {
  key: 'value',
  _number: 1,
  _boolean: true,
  _null: null,
  _array: [
    'string',
    1,
    true,
    null,
    null,
    {
      key: 'value',
      _number: 1,
      _boolean: true,
      _null: null,
    },
  ],
  _object: {
    key: 'value',
    _number: 1,
    _boolean: true,
    _null: null,
  },
} as unknown as Record<string, any>;

const testQuery = {
  key: 'value',
  _number: 1,
  _boolean: true,
  _null: null,
  _undefined: undefined,
  _array: [
    'string',
    1,
    true,
    null,
    undefined,
    {
      key: 'value',
      _number: 1,
      _boolean: true,
      _null: null,
      _undefined: undefined,
    },
  ],
  _object: {
    key: 'value',
    _number: 1,
    _boolean: true,
    _null: null,
    _undefined: undefined,
  },
} as unknown as Record<string, any>;

// NOTICE: query processing removes undefined object values, converts booleans and numbers to strings, null to an empty string, and undefined array values to empty strings
const processedQuery = {
  key: 'value',
  _number: '1',
  _boolean: 'true',
  _null: '',
  _array: [
    'string',
    '1',
    'true',
    '',
    {
      key: 'value',
      _number: '1',
      _boolean: 'true',
      _null: '',
    },
  ],
  _object: {
    key: 'value',
    _number: '1',
    _boolean: 'true',
    _null: '',
  },
};

mock.module('../../src/service/signature', () => {
  return {
    remoteSign: mock(() => {
      return { signature: '', publicKey: '' };
    }),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('getVerifyData', () => {
  beforeEach(() => {
    process.env.BLOCKLET_APP_SK = wallet.secretKey;
    process.env.CHAIN_TYPE = 'default';
  });

  it('should return the correct data for a valid request with default type', () => {
    const iat = Date.now() / 1000;
    const exp = iat + 60 * 5;
    const req = {
      get: mock((header) => {
        const headers = {
          'x-component-sig': 'test-sig',
          'x-component-sig-version': SIG_VERSION.DEFAULT,
          'x-component-sig-iat': iat,
          'x-component-sig-exp': exp,
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: testBody,
      method: 'POST',
      originalUrl: '/test/url',
      query: testQuery,
    } as unknown as Request;

    const result = getVerifyData(req);

    expect(result).toMatchObject({
      sig: 'test-sig',
      data: {
        iat,
        exp,
        body: testBody,
        query: testQuery,
        method: 'post',
        url: '/test/url',
      },
    });
  });

  it('should return the correct data for a valid request with blocklet type', () => {
    const iat = Date.now() / 1000;
    const exp = iat + 60 * 5;
    const req = {
      get: mock((header) => {
        const headers = {
          'x-blocklet-sig': 'test-sig',
          'x-blocklet-sig-version': SIG_VERSION.DEFAULT,
          'x-blocklet-sig-iat': iat,
          'x-blocklet-sig-exp': exp,
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: testBody,
      method: 'POST',
      originalUrl: '/test/url',
      query: testQuery,
    } as unknown as Request;

    const result = getVerifyData(req, 'blocklet');

    expect(result).toMatchObject({
      sig: 'test-sig',
      data: {
        iat,
        exp,
        body: testBody,
        query: testQuery,
        method: 'post',
        url: '/test/url',
      },
    });
  });

  it('should return correct data for a valid request with search params', () => {
    const iat = Date.now() / 1000;
    const exp = iat + 60 * 5;
    const req = {
      get: mock((header) => {
        const headers = {
          'x-component-sig': 'test-sig',
          'x-component-sig-version': SIG_VERSION.DEFAULT,
          'x-component-sig-iat': iat,
          'x-component-sig-exp': exp,
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: {},
      method: 'GET',
      originalUrl: '/test/url?key=value',
      query: {},
    } as unknown as Request;

    const result = getVerifyData(req);

    expect(result).toMatchObject({
      sig: 'test-sig',
      data: {
        iat,
        exp,
        body: {},
        query: { key: 'value' },
        method: 'get',
        url: '/test/url',
      },
    });
  });

  it('should return correct data for a valid request with search/query params', () => {
    const iat = Date.now() / 1000;
    const exp = iat + 60 * 5;
    const req = {
      get: mock((header) => {
        const headers = {
          'x-component-sig': 'test-sig',
          'x-component-sig-version': SIG_VERSION.DEFAULT,
          'x-component-sig-iat': iat,
          'x-component-sig-exp': exp,
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: {},
      method: 'GET',
      originalUrl: '/test/url?key=value',
      query: { key2: 'value2' },
    } as unknown as Request;

    const result = getVerifyData(req);

    expect(result).toMatchObject({
      sig: 'test-sig',
      data: {
        iat,
        exp,
        body: {},
        query: { key: 'value', key2: 'value2' },
        method: 'get',
        url: '/test/url',
      },
    });
  });

  it('should throw an error for an invalid iat or exp', () => {
    const req = {
      get: mock((header) => {
        const headers = {
          'x-component-sig': 'test-sig',
          'x-component-sig-version': SIG_VERSION.DEFAULT,
          'x-component-sig-iat': 'invalid',
          'x-component-sig-exp': 'invalid',
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: testBody,
      method: 'POST',
      originalUrl: '/test/url',
      query: testQuery,
    } as unknown as Request;

    expect(() => getVerifyData(req)).toThrow('invalid sig');
  });

  it('should throw an error for an expired sig', () => {
    const iat = Date.now() / 1000 - 60 * 6;
    const exp = iat + 60 * 5;
    const req = {
      get: mock((header) => {
        const headers = {
          'x-component-sig': 'test-sig',
          'x-component-sig-version': SIG_VERSION.DEFAULT,
          'x-component-sig-iat': iat,
          'x-component-sig-exp': exp,
        };
        return (headers as Record<string, string | number>)[header];
      }),
      body: testBody,
      method: 'POST',
      originalUrl: '/test/url',
      query: testQuery,
    } as unknown as Request;

    expect(() => getVerifyData(req)).toThrow('expired sig');
  });
});

describe('getSignData', () => {
  beforeEach(() => {
    process.env.BLOCKLET_APP_SK = wallet.secretKey;
    process.env.CHAIN_TYPE = 'default';
  });

  it('should return the correct signature data', async () => {
    const data = testBody;
    const params = testQuery;
    const method = 'POST';
    const url = '/test/url';

    const result = await getSignData({ data, params, method, url });

    expect(result).toHaveProperty('sig');
    expect(result).toHaveProperty('iat');
    expect(result).toHaveProperty('exp');
    expect(result).toHaveProperty('version', SIG_VERSION.DEFAULT);
    expect(await verify(result.raw, result.sig)).toBeTruthy();
  });

  it('should return the correct signature data with empty search', async () => {
    const data = testBody;
    const params = {};
    const method = 'POST';
    const url = '/test/url?';

    const result = await getSignData({ data, params, method, url });

    expect(result).toHaveProperty('sig');
    expect(result).toHaveProperty('iat');
    expect(result).toHaveProperty('exp');
    expect(result).toHaveProperty('version', SIG_VERSION.DEFAULT);
    expect(await verify(result.raw, result.sig)).toBeTruthy();
  });

  it('should return the correct signature data with query params', async () => {
    const data = testBody;
    const params = { key2: 'value2' };
    const method = 'POST';
    const url = '/test/url?key=value';

    const result = await getSignData({ data, params, method, url });

    expect(result).toHaveProperty('sig');
    expect(result).toHaveProperty('iat');
    expect(result).toHaveProperty('exp');
    expect(result).toHaveProperty('version', SIG_VERSION.DEFAULT);
    expect(result).toHaveProperty('raw');
    expect(result).toHaveProperty('raw.query');
    expect(result).toHaveProperty('raw.query.key', 'value');
    expect(result).toHaveProperty('raw.query.key2', 'value2');
    expect(await verify(result.raw, result.sig)).toBeTruthy();
  });

  it('should include the correct iat and exp values', async () => {
    const data = testBody;
    const params = testQuery;
    const method = 'POST';
    const url = '/test/url';

    const now = Math.floor(Date.now() / 1000);
    spyOn(Date, 'now').mockImplementation(() => now * 1000);

    const result = await getSignData({ data, params, method, url });

    expect(result.iat).toBe(now);
    expect(result.exp).toBe(now + 60 * 5);
    expect(await verify(result.raw, result.sig)).toBeTruthy();
  });

  it('should correctly sign the data', async () => {
    const data = testBody;
    const params = testQuery;
    const method = 'POST';
    const url = '/test/url';

    const result = await getSignData({ data, params, method, url });

    const expected = await sign({
      body: processedBody,
      query: processedQuery,
      method: method.toLowerCase(),
      url,
      iat: result.iat,
      exp: result.exp,
    });
    expect(result).toHaveProperty('sig', expected);

    const diffMethodSig = await sign({
      body: processedBody,
      query: processedQuery,
      method: 'POST',
      url,
      iat: result.iat,
      exp: result.exp,
    });
    expect(result.sig).not.toBe(diffMethodSig);

    const diffUrlSig = await sign({
      body: processedBody,
      query: processedQuery,
      method: method.toLowerCase(),
      url: `${url}1`,
      iat: result.iat,
      exp: result.exp,
    });
    expect(result.sig).not.toBe(diffUrlSig);
  });
});

describe('sign function', () => {
  let remoteSign: any;

  beforeEach(async () => {
    const signatureService = await import('../../src/service/signature');
    remoteSign = signatureService.remoteSign as any;
    remoteSign.mockReset();
  });

  afterEach(() => {
    delete process.env.BLOCKLET_APP_SK;
    delete process.env.BLOCKLET_APP_PK;
    delete process.env.CHAIN_TYPE;
    delete process.env.BLOCKLET_DID;
    delete process.env.BLOCKLET_REAL_DID;
  });

  describe('local signing (with secret key)', () => {
    beforeEach(() => {
      process.env.BLOCKLET_APP_SK = wallet.secretKey;
      process.env.CHAIN_TYPE = 'default';
    });

    it('should sign data locally when secret key is available', async () => {
      const data = { test: 'data' };
      const signature = await sign(data);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(remoteSign).not.toHaveBeenCalled();
    });

    it('should produce verifiable signature', async () => {
      const data = { test: 'data', nested: { value: 123 } };
      const signature = await sign(data);

      expect(await verify(data, signature)).toBeTruthy();
      expect(remoteSign).not.toHaveBeenCalled();
    });

    it('should accept custom type and appSk parameters', async () => {
      const customWallet = fromRandom();
      const data = { test: 'data' };
      const signature = await sign(data, { type: 'default', appSk: customWallet.secretKey });

      expect(signature).toBeTruthy();
      expect(await verify(data, signature, { appSk: customWallet.secretKey })).toBeTruthy();
      expect(remoteSign).not.toHaveBeenCalled();
    });

    it('should not fallback to remote signing when local signing fails', async () => {
      const data = { test: 'data' };
      const invalidSk = 'invalid-secret-key';

      await expect(sign(data, { appSk: invalidSk })).rejects.toThrow();
      expect(remoteSign).not.toHaveBeenCalled();
    });
  });

  describe('remote signing (without secret key)', () => {
    beforeEach(() => {
      delete process.env.BLOCKLET_APP_SK;
      process.env.BLOCKLET_APP_PK = wallet.publicKey;
      process.env.CHAIN_TYPE = 'default';
      process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
      process.env.BLOCKLET_REAL_DID = 'did:component:test123';
      process.env.BLOCKLET_COMPONENT_API_KEY = 'test-api-key';
    });

    it('should use remote signing when secret key is not available', async () => {
      const data = { test: 'data' };
      const testSignature = await wallet.sign(JSON.stringify(data));

      remoteSign.mockResolvedValue({
        signature: testSignature,
        publicKey: wallet.publicKey,
      });

      const signature = await sign(data);

      expect(signature).toBe(testSignature);
      expect(remoteSign).toHaveBeenCalledTimes(1);
      expect(remoteSign).toHaveBeenCalledWith(JSON.stringify(data), expect.objectContaining({ keyType: 'sk' }));
    });

    it('should return verifiable signature from remote signing', async () => {
      const data = { test: 'remote', value: 456 };
      // Create a real signature using the test wallet
      const realSignature = await wallet.sign(JSON.stringify(data));

      remoteSign.mockResolvedValue({
        signature: realSignature,
        publicKey: wallet.publicKey,
      });

      const signature = await sign(data);

      // Verify the signature is valid
      expect(await verify(data, signature, { appPk: wallet.publicKey })).toBeTruthy();
      expect(remoteSign).toHaveBeenCalledWith(JSON.stringify(data), expect.objectContaining({ keyType: 'sk' }));
    });

    it('should throw error when remote signing returns empty signature', async () => {
      remoteSign.mockResolvedValue({ signature: '', publicKey: wallet.publicKey });

      const data = { test: 'data' };
      await expect(sign(data)).rejects.toThrow('Empty signature returned from blocklet-service');
    });

    it('should throw error when remote signing returns null signature', async () => {
      remoteSign.mockResolvedValue({ signature: null, publicKey: wallet.publicKey });

      const data = { test: 'data' };
      await expect(sign(data)).rejects.toThrow('Empty signature returned from blocklet-service');
    });

    it('should throw error when remote signing fails', async () => {
      remoteSign.mockRejectedValue(new Error('Network error'));

      const data = { test: 'data' };
      await expect(sign(data)).rejects.toThrow('Network error');
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        string: 'test',
        number: 123,
        boolean: true,
        nullValue: null as unknown,
        array: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };

      const testSignature = await wallet.sign(stableStringify(complexData));
      remoteSign.mockResolvedValue({
        signature: testSignature,
        publicKey: wallet.publicKey,
      });

      const signature = await sign(complexData);

      expect(signature).toBe(testSignature);
      expect(remoteSign).toHaveBeenCalledWith(stableStringify(complexData), expect.objectContaining({ keyType: 'sk' }));
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', async () => {
      process.env.BLOCKLET_APP_SK = wallet.secretKey;
      const signature = await sign({});

      expect(signature).toBeTruthy();
      expect(await verify({}, signature)).toBeTruthy();
    });

    it('should handle null data', async () => {
      process.env.BLOCKLET_APP_SK = wallet.secretKey;
      const signature = await sign(null as any);

      expect(signature).toBeTruthy();
    });

    it('should handle undefined data', async () => {
      process.env.BLOCKLET_APP_SK = wallet.secretKey;
      const signature = await sign(undefined as any);

      expect(signature).toBeTruthy();
    });
  });
});
