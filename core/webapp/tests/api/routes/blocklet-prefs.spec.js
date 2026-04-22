const { test, expect, describe, beforeAll } = require('bun:test');

const mockAppDid = 'mockAppDid';
const mockVersion = 'mockVersion';
const mockAppUrl = 'mockAppUrl';

const path = require('path');
const express = require('express');
const request = require('supertest');

const { fromRandom } = require('@ocap/wallet');
const { init } = require('../../../api/routes/blocklet-preference');

const appDir = path.resolve(__dirname, '../../fixtures');

const address1 = fromRandom().address;
const address2 = fromRandom().address;

describe('blocklet prefs', () => {
  let node;
  let app;
  let hasPermission = false;

  beforeAll(() => {
    node = {
      collectorPath: path.dirname(require.resolve('@blocklet/form-collector')),
      themeBuilderPath: path.dirname(require.resolve('@blocklet/theme-builder')),
      getNodeInfo: () => ({
        webWalletUrl: 'https://web.wallet',
        routing: { adminPath: '/admin' },
      }),
      getRBAC: () => ({
        canAny: () => hasPermission,
      }),
      getBlocklet: ({ did }) => {
        if (did === address1) {
          return {
            appDid: mockAppDid,
            meta: {
              version: mockVersion,
            },
            env: {
              id: did,
              appDir,
            },
            configObj: {},
            environmentObj: {
              BLOCKLET_APP_URL: mockAppUrl,
            },
          };
        }

        if (did === address2) {
          return {
            appDid: mockAppDid,
            meta: {
              version: mockVersion,
              navigation: [{ title: 'a' }],
              theme: {
                background: '#eee',
              },
              copyright: {
                own: 'ArcBlock',
              },
            },
            env: {
              id: did,
              appDir,
            },
            configObj: {},
            children: [
              {
                meta: {
                  title: 'Child-1',
                  name: 'child-1',
                  did: 'child-did-1',
                  bundleName: 'child-name',
                  bundleDid: 'child-did',
                },
                env: {
                  id: `${address2}/${address1}`,
                  appDir,
                },
                configObj: {},
                mountPoint: '/abc',
              },
            ],
          };
        }
        throw new Error('cannot find blocklet');
      },
      on: () => {},
      configBlocklet: () => {},
    };

    app = express();

    app.use((req, res, next) => {
      req.user = { role: 'owner' };
      return next();
    });

    init(app, node);
  });

  test('should work as expected', async () => {
    let res = await request(app).get('/api/preferences');
    expect(res.body.code).toEqual('forbidden');

    hasPermission = true;
    res = await request(app).get('/api/preferences');
    expect(res.body.code).toEqual('bad_request');

    res = await request(app).get('/api/preferences?id=a');
    expect(res.body.code).toEqual('bad_request');

    res = await request(app).get('/api/preferences?id=b');
    expect(res.body.code).toEqual('bad_request');

    res = await request(app).get('/api/preferences?id=b/c');
    expect(res.body.code).toEqual('bad_request');

    res = await request(app).get(`/api/preferences?id=${address1}`);
    expect(res.body.form).toBeTruthy();
    expect(res.body.schema).toBeTruthy();

    res = await request(app).get(`/api/preferences?id=${address2}`);
    expect(res.body.form).toBeTruthy();
    expect(res.body.schema).toBeTruthy();

    res = await request(app).get(`/api/preferences?id=${address2}/${address1}`);
    expect(res.body.form).toBeTruthy();
    expect(res.body.schema).toBeTruthy();
  });
});
