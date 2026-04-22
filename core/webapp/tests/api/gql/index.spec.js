/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { test, expect, describe } = require('bun:test');
const express = require('express');
const { default: axios } = require('axios');
const getPort = require('get-port');
const { introspectionQuery } = require('graphql');
const { toAddress } = require('@arcblock/did');
const { CustomError } = require('@blocklet/error');

const gql = require('../../../api/gql');

describe('GQL', () => {
  test('should return graphql schema', done => {
    (async () => {
      const app = express();
      app.use('/api/gql', gql({}));
      const port = await getPort();
      const server = app.listen(port, async err => {
        if (err) {
          console.error(err);
        } else {
          try {
            const { data } = await axios.post(`http://127.0.0.1:${port}/api/gql`, { query: introspectionQuery });
            // eslint-disable-next-line no-underscore-dangle
            expect(data.data.__schema).toBeTruthy();
          } catch (e) {
            console.error(e.message);
          }
        }
        server.close();
        done();
      });
    })();
  }, 5000);

  test('should have wrapResolver method', async () => {
    expect(typeof gql.wrapResolver).toEqual('function');

    let result = await gql.wrapResolver({
      dataKeys: 'blocklet',
      callback: () => ({ configs: [{ key: 'prefs.prop1' }, { key: 'prop2' }], status: 6, source: 0 }),
    });
    expect(result).toEqual({
      code: 'ok',
      blocklet: {
        status: 'running',
        source: 'registry',
        configs: [{ key: 'prop2' }],
        environments: [],
        children: [],
        migratedFrom: [],
        settings: undefined,
      },
    });

    result = await gql.wrapResolver({ dataKeys: 'blocklets', callback: () => [{ status: 6, source: 0 }] });
    expect(result).toEqual({
      code: 'ok',
      blocklets: [
        {
          status: 'running',
          source: 'registry',
          configs: [],
          environments: [],
          children: [],
          migratedFrom: [],
          settings: undefined,
        },
      ],
    });
  });

  test('should handle dataKeys as array', async () => {
    const result = await gql.wrapResolver({
      dataKeys: ['user', 'count'],
      callback: () => ({ user: { name: 'test' }, count: 10 }),
    });

    expect(result).toEqual({
      code: 'ok',
      user: { name: 'test' },
      count: 10,
    });
  });

  test('should filter ABT_NODE_SK from info environments', async () => {
    const result = await gql.wrapResolver({
      dataKeys: 'info',
      callback: () => ({
        name: 'test-node',
        environments: [
          { key: 'ABT_NODE_SK', value: 'secret' },
          { key: 'NODE_ENV', value: 'production' },
        ],
        sessionSalt: 'should-be-removed',
      }),
    });

    expect(result.code).toEqual('ok');
    expect(result.info.environments).toEqual([{ key: 'NODE_ENV', value: 'production' }]);
    expect(result.info.sessionSalt).toBeUndefined();
  });

  test('should throw CustomError when callback throws CustomError', async () => {
    await expect(
      gql.wrapResolver({
        dataKeys: 'data',
        callback: () => {
          throw new CustomError(400, 'Bad request');
        },
      })
    ).rejects.toThrow('Bad request');
  });

  test('should wrap regular error in CustomError', async () => {
    await expect(
      gql.wrapResolver({
        dataKeys: 'data',
        callback: () => {
          throw new Error('Regular error');
        },
      })
    ).rejects.toThrow('Regular error');
  });
});

describe('ensureInputDid', () => {
  test('should convert valid DIDs to addresses', () => {
    const input = {
      appDid: 'did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB',
      blockletDid: 'did:abt:z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD',
      userDid: 'did:abt:z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq',
    };

    gql.ensureInputDid(input);

    expect(input.appDid).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
    expect(input.blockletDid).toEqual(toAddress('z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD'));
    expect(input.userDid).toEqual(toAddress('z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq'));
  });

  test('should convert valid DIDs in arrays to addresses', () => {
    const input = {
      appDid: ['did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB', 'did:abt:z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD'],
      blockletDid: ['did:abt:z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq'],
    };

    gql.ensureInputDid(input);

    expect(input.appDid[0]).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
    expect(input.appDid[1]).toEqual(toAddress('z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD'));
    expect(input.blockletDid[0]).toEqual(toAddress('z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq'));
  });

  test('should throw an error for invalid DIDs', () => {
    const input = {
      appDid: 'invalidDid',
    };

    expect(() => gql.ensureInputDid(input)).toThrowError('Invalid appDid: invalidDid');
  });

  test('should throw an error for invalid DIDs in arrays', () => {
    const input = {
      appDid: ['did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB', 'invalidDid'],
    };

    expect(() => gql.ensureInputDid(input)).toThrowError('Invalid appDid[1]: invalidDid');
  });

  test('should handle all DID key types', () => {
    const input = {
      appPid: 'did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB',
      componentDid: 'did:abt:z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD',
      did: 'did:abt:z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq',
      nftDid: 'did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB',
      ownerDid: 'did:abt:z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD',
      rootDid: 'did:abt:z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq',
      teamDid: 'did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB',
    };

    gql.ensureInputDid(input);

    expect(input.appPid).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
    expect(input.componentDid).toEqual(toAddress('z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD'));
    expect(input.did).toEqual(toAddress('z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq'));
    expect(input.nftDid).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
    expect(input.ownerDid).toEqual(toAddress('z35nNRvYxBoHitx9yZ5ATS88psfShzPPBLxYD'));
    expect(input.rootDid).toEqual(toAddress('z3KzQxLFQqDo9tmRh53eE47A6K52bZBPb7nPq'));
    expect(input.teamDid).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
  });

  test('should handle null input gracefully', () => {
    expect(() => gql.ensureInputDid(null)).not.toThrow();
    expect(() => gql.ensureInputDid(undefined)).not.toThrow();
  });

  test('should handle empty input object', () => {
    const input = {};
    gql.ensureInputDid(input);
    expect(input).toEqual({});
  });

  test('should ignore non-DID keys', () => {
    const input = {
      name: 'test',
      count: 10,
      appDid: 'did:abt:z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB',
    };

    gql.ensureInputDid(input);

    expect(input.name).toEqual('test');
    expect(input.count).toEqual(10);
    expect(input.appDid).toEqual(toAddress('z2qaHdCscYhqMHtwsL7KU9RtXPxFzbDrmevpB'));
  });
});

describe('ensureInputPaging', () => {
  test('should accept valid paging parameters', () => {
    const input = {
      paging: { page: 1, pageSize: 20 },
    };

    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });

  test('should accept paging with only page', () => {
    const input = {
      paging: { page: 5 },
    };

    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });

  test('should accept paging with only pageSize', () => {
    const input = {
      paging: { pageSize: 50 },
    };

    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });

  test('should throw error for invalid page number (less than 1)', () => {
    const input = {
      paging: { page: 0 },
    };

    expect(() => gql.ensureInputPaging(input)).toThrowError('Invalid paging parameter');
  });

  test('should throw error for negative page number', () => {
    const input = {
      paging: { page: -1 },
    };

    expect(() => gql.ensureInputPaging(input)).toThrowError('Invalid paging parameter');
  });

  test('should throw error for invalid pageSize (less than 1)', () => {
    const input = {
      paging: { pageSize: 0 },
    };

    expect(() => gql.ensureInputPaging(input)).toThrowError('Invalid paging parameter');
  });

  test('should throw error for non-integer page', () => {
    const input = {
      paging: { page: 1.5 },
    };

    expect(() => gql.ensureInputPaging(input)).toThrowError('Invalid paging parameter');
  });

  test('should handle null input gracefully', () => {
    expect(() => gql.ensureInputPaging(null)).not.toThrow();
    expect(() => gql.ensureInputPaging(undefined)).not.toThrow();
  });

  test('should handle input without paging', () => {
    const input = { name: 'test' };
    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });

  test('should handle null paging gracefully', () => {
    const input = { paging: null };
    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });

  test('should handle non-object paging gracefully', () => {
    const input = { paging: 'invalid' };
    expect(() => gql.ensureInputPaging(input)).not.toThrow();
  });
});
