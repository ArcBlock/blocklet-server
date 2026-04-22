const { test, expect, describe, mock, beforeAll, afterAll } = require('bun:test');

const mockName = 'mockBlockletName';
const mockDescription = 'mockBlockletDescription';
const mockAppDid = 'mockAppDid';
const mockVersion = 'mockVersion';
const mockAppUrl = 'https://bbqaxe7iadfimddcg4rfrptfuzxmmv5b6vpnupuni44.did.abtnet.io';

mock.module('@blocklet/meta/lib/info', () => {
  return () => ({ did: '', name: mockName, description: mockDescription });
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const express = require('express');
const request = require('supertest');
const { init } = require('../../../api/routes/blocklet-seo');

describe('blocklet seo', () => {
  let node;
  let app;

  beforeAll(() => {
    node = {
      getNodeInfo: () => ({
        did: 'serverDid123',
        webWalletUrl: 'https://web.wallet',
      }),
      getBlocklet: ({ did }) => {
        if (did === 'a') {
          return {
            appDid: mockAppDid,
            meta: {
              version: mockVersion,
            },
            environmentObj: {
              BLOCKLET_APP_URL: mockAppUrl,
              BLOCKLET_APP_LANGUAGES: 'zh',
            },
            status: 6,
            children: [],
          };
        }

        // blocklet with dirty navigation data: root path "/" and duplicate links
        if (did === 'b') {
          return {
            appDid: mockAppDid,
            meta: {
              version: mockVersion,
              navigation: [
                { title: 'Root Dash', link: '/', section: ['dashboard'] },
                { title: 'Admin Maker', link: '/admin/maker', section: ['dashboard'] },
                { title: 'Admin Maker Dup', link: '/admin/maker', section: ['dashboard'] },
                { title: 'Public Page', link: '/blog', section: ['header'] },
              ],
            },
            environmentObj: {
              BLOCKLET_APP_URL: mockAppUrl,
              BLOCKLET_APP_LANGUAGES: 'zh',
            },
            status: 6,
            children: [],
          };
        }

        return null;
      },
      on: () => {},
      getBlockletSecurityRule: () => {
        return null;
      },
      getBlockletSecurityRules: () => {
        return {
          securityRules: [],
        };
      },
    };

    app = express();

    app.use((_req, res, next) => {
      res.sendFile = file => res.send(file);

      next();
    });

    init(app, node);
  });

  test('should robots.txt as expected', async () => {
    const res = await request(app).get('/robots.txt').set('x-blocklet-did', 'a');
    expect(res.text).toEqual(`User-agent: *
Sitemap: ${mockAppUrl}/sitemap.xml
Allow: /
Disallow: /.well-known/service/admin`);
  });

  test('should sitemap.xml as expected', async () => {
    const res = await request(app).get('/sitemap.xml').set('x-blocklet-did', 'a');
    expect(res.text).toMatch(mockAppUrl);
  });

  test('should filter out root path and deduplicate disallow entries in robots.txt', async () => {
    const res = await request(app).get('/robots.txt').set('x-blocklet-did', 'b');
    const lines = res.text.split('\n');
    const disallowLines = lines.filter(l => l.startsWith('Disallow:'));

    // should not contain bare "Disallow: /" (root path)
    expect(disallowLines).not.toContain('Disallow: /');

    // should not have duplicates
    const uniqueDisallowLines = [...new Set(disallowLines)];
    expect(disallowLines).toEqual(uniqueDisallowLines);

    // should still contain the admin path
    expect(disallowLines).toContain('Disallow: /.well-known/service/admin');

    // should contain valid component paths (joinURL adds trailing slash)
    expect(disallowLines).toContain('Disallow: /admin/maker/');
  });

  test('should return 404 for robots.txt when blocklet is null', async () => {
    const res = await request(app).get('/robots.txt').set('x-blocklet-did', 'nonexistent');
    expect(res.status).toBe(404);
  });

  test('should return 404 for sitemap.xml when blocklet is null', async () => {
    const res = await request(app).get('/sitemap.xml').set('x-blocklet-did', 'nonexistent');
    expect(res.status).toBe(404);
  });
});
