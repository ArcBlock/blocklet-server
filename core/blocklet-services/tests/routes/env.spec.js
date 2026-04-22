const { describe, test, expect } = require('bun:test');
const express = require('express');
const request = require('supertest');

const { init } = require('../../api/routes/env');

describe('routers/env', () => {
  const server = express();
  server.use((req, res, next) => {
    req.getBlocklet = () => {
      return {
        appDid: 'blocklet app id',
      };
    };

    req.getBlockletInfo = () => {
      return {
        did: 'blocklet meta did',
      };
    };

    req.getServiceConfig = () => {
      return {};
    };

    req.getNodeInfo = () => {
      return {
        did: 'server did',
      };
    };

    req.getUserOrg = () => '';

    next();
  });

  init(server, {}, {});

  test('getDetail', async () => {
    const res1 = await request(server).get('/.well-known/service/api/env');
    expect(res1.status).toBe(200);
    expect(res1.text.startsWith('window.env = {')).toBeTruthy();
    expect(res1.text).toMatch('serverDid: "server did"');
    expect(res1.text).toMatch('appId: "blocklet app id"');
    expect(res1.text).toMatch('did: "blocklet meta did"');
    expect(res1.text).toMatch('appName');
    expect(res1.text).toMatch('pathPrefix');
    expect(res1.text).toMatch('apiPrefix');
    expect(res1.text).toMatch('webWalletUrl');
    expect(res1.text).toMatch('passportColor');

    const res2 = await request(server).get('/xxxxxx/.well-known/service/api/env');
    expect(res2.status).toBe(200);

    const res3 = await request(server).get('/xxxxx/env');
    expect(res3.status).toBe(404);
  });
});
