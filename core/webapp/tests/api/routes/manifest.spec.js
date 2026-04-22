const { test, expect, describe, beforeAll } = require('bun:test');
const express = require('express');
const request = require('supertest');
const { init } = require('../../../api/routes/manifest');

describe('blocklet info', () => {
  let node;
  let app;

  beforeAll(() => {
    node = {
      getNodeInfo: () => ({
        did: 'serverDid123',
        name: 'Test Server',
        description: 'Test Server Description',
      }),
    };

    app = express();

    app.use((_req, res, next) => {
      res.sendFile = file => res.send(file);

      next();
    });

    init(app, node);
  });

  // NOTICE: should NOT use expect().rejects/resolves with supertest!
  test('should work as expected', async () => {
    // invalid param or blocklet
    const res = await request(app).get('/manifest.json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch('application/json');
    const data = JSON.parse(res.text);
    expect(data).toEqual({
      name: 'Test Server',
      short_name: 'Test Server',
      description: 'Test Server Description',
      start_url: './dashboard',
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#ffffff',
      icons: [
        {
          src: './images/node-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: './images/node-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    });
  });
});
