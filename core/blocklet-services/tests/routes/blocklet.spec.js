const { test, mock, describe, expect } = require('bun:test');
const { BlockletStatus, BlockletSource } = require('@blocklet/constant');

const os = require('os');
const path = require('path');
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const { init } = require('../../api/routes/blocklet');

describe('routers/blocklet', () => {
  const mockFns = {
    getBlocklet: {
      default: () => ({
        meta: { did: 'did1', title: 'Test App', description: 'Test App Desc' },
        status: BlockletStatus.stopped,
        source: BlockletSource.registry,
      }),
      metaLogo: () => ({
        env: { dataDir: '/path/to/data' },
      }),
      customLogo: () => ({
        meta: { logo: 'logo.png' },
        env: { appDir: '/path/to/app', cacheDir: os.tmpdir() },
      }),
      error: () => {
        throw new Error('test');
      },
      componentLogo: () => ({
        children: [
          {
            meta: { did: 'component1', logo: 'logo.png' },
            env: { appDir: '/path/to/app' },
          },
        ],
      }),
      appRunning: () => ({
        meta: { did: 'did1' },
        status: BlockletStatus.running,
        source: BlockletSource.registry,
        children: [
          { meta: { did: 'did1' }, status: BlockletStatus.running },
          { meta: { did: 'did2' }, status: BlockletStatus.stopped },
        ],
      }),
      appStopped: () => ({
        meta: { did: 'did2' },
        status: BlockletStatus.stopped,
        source: BlockletSource.registry,
        children: [
          { meta: { did: 'did1' }, status: BlockletStatus.stopped },
          { meta: { did: 'did2' }, status: BlockletStatus.stopped },
        ],
      }),
    },
  };

  const server = express();
  server.use(bodyParser.json());
  server.use((req, res, next) => {
    req.user = { role: 'owner' };
    req.getBlocklet = mockFns.getBlocklet[req.headers['expect-blocklet'] || 'default'];
    req.getBlockletInfo = () => ({
      did: 'did1',
      name: 'test',
      version: '1.0.0',
      description: 'test',
      passportColor: '#000000',
      appUrl: 'https://app.blocklet.io',
      secret: 'secret',
      tenantMode: 'tenant',
      wallet: { address: '0x123', secretKey: 'secret' },
      permanentWallet: { address: '0x123', secretKey: 'secret' },
    });
    res.sendStaticFile = (file) => res.send(file);
    res.sendFile = (file) => res.send(file);
    next();
  });

  const mockGetTransferAppOwnerSession = mock();
  const dataDir = path.join(os.tmpdir(), Date.now().toString());

  init(server, {
    startBlocklet: () => ({ meta: { did: 'did1' }, status: BlockletStatus.running, source: BlockletSource.registry }),
    ensureBlockletIntegrity: () => ({
      meta: { did: 'did1' },
      status: BlockletStatus.running,
      source: BlockletSource.registry,
    }),
    createAuditLog: () => {},
    getTransferAppOwnerSession: mockGetTransferAppOwnerSession,
    dataDirs: { services: dataDir, cache: dataDir, tmp: dataDir, data: dataDir },
  });

  test('should blocklet api work as expected', async () => {
    // detail
    const res1 = await request(server).get('/.well-known/service/api/blocklet/detail');
    expect(res1.status).toBe(200);
    expect(res1.body).toEqual({
      meta: expect.objectContaining({ did: 'did1' }),
      status: 'stopped',
      source: 'registry',
      environments: [],
      children: [],
      migratedFrom: [],
      configs: [],
      settings: undefined,
    });

    // start
    const res2 = await request(server).post('/.well-known/service/api/blocklet/start');
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual({
      meta: expect.objectContaining({ did: 'did1' }),
      status: 'running',
      source: 'registry',
      environments: [],
      children: [],
      migratedFrom: [],
      configs: [],
      settings: undefined,
    });

    // logo
    const res4 = await request(server).get('/.well-known/service/blocklet/logo').set('expect-blocklet', 'error');
    expect(res4.text).toBe('/images/blocklet.png');
    const res41 = await request(server).get('/.well-known/service/blocklet/logo').set('expect-blocklet', 'default');
    expect(res41.text).toBe('/images/blocklet.png');
    const res42 = await request(server).get('/.well-known/service/blocklet/logo').set('expect-blocklet', 'metaLogo');
    expect(res42.text).toBe('/images/blocklet.png'); // file does not exist
    const res43 = await request(server).get('/.well-known/service/blocklet/logo').set('expect-blocklet', 'customLogo');
    expect(res43.text).toBe('/images/blocklet.png'); // file does not exist

    // component logo
    const res5 = await request(server)
      .get('/.well-known/service/blocklet/logo-bundle/component1')
      .set('expect-blocklet', 'componentLogo');
    expect(res5.text).toBe('/images/blocklet.png'); // file does not exist

    const res6 = await request(server).get('/.well-known/service/blocklet/logo-bundle/did1');
    expect(res6.status).toBe(200);

    const res7 = await request(server).get('/.well-known/service/api/blocklet/transfer');
    expect(res7.status).toBe(400);
    expect(res7.text).toBe('transferId is required');
    mockGetTransferAppOwnerSession.mockReturnValueOnce({ xxx: 'yyy' });
    const res8 = await request(server).get('/.well-known/service/api/blocklet/transfer?transferId=xxx');
    expect(res8.status).toBe(200);
    expect(res8.text).toBe('{"xxx":"yyy"}');

    // open graph
    const res9 = await request(server).get('/.well-known/service/blocklet/og.png').set('expect-blocklet', 'customLogo');
    // 这个测试，有时候会返回 500，有时候会返回 400
    expect([500, 400]).toContain(res9.status);
  });

  test('/health', async () => {
    let res = await request(server).get('/.well-known/service/health');
    expect(res.status).toBe(503);
    expect(res.text).toMatch('not running');

    // app running: partial
    res = await request(server).get('/.well-known/service/health').set('expect-blocklet', 'appRunning');
    expect(res.status).toBe(200);
    const healthData = JSON.parse(res.text);
    expect(healthData).toMatchObject({
      message: 'ok',
      components: {
        did1: { running: true },
        did2: { running: false },
      },
      routing: {
        webInterfaceCount: 0,
        running: true,
        date: expect.any(String),
      },
    });
    expect(healthData.routing.date).toBeDefined();

    // app stopped
    res = await request(server).get('/.well-known/service/health').set('expect-blocklet', 'appStopped');
    expect(res.status).toBe(503);
    expect(res.text).toMatch(
      '{"message":"not running","components":{"did1":{"running":false},"did2":{"running":false}}}'
    );

    // component running
    res = await request(server).get('/.well-known/service/health/did1').set('expect-blocklet', 'appRunning');
    expect(res.status).toBe(200);
    expect(res.text).toMatch('"message":"ok"');

    // component not running
    res = await request(server).get('/.well-known/service/health/did2').set('expect-blocklet', 'appRunning');
    expect(res.status).toBe(503);
    expect(res.text).toMatch('"message":"not running"');

    // component not exists
    res = await request(server).get('/.well-known/service/health/did3').set('expect-blocklet', 'appRunning');
    expect(res.status).toBe(404);
    expect(res.text).toMatch('{"message":"component not found"}');
  });

  test('/manifest.json', async () => {
    const res = await request(server).get('/.well-known/service/manifest.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch('application/json');
    const data = JSON.parse(res.text);
    expect(data).toEqual({
      name: 'Test App - Dashboard',
      short_name: 'Test App - Dashboard',
      description: 'Test App Desc',
      start_url: '/.well-known/service/admin',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#ffffff',
      icons: [
        {
          src: '/.well-known/service/blocklet/logo',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: '/.well-known/service/blocklet/logo',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    });
  });
});
