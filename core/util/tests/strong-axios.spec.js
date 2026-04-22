const { describe, expect, test, beforeAll, afterAll } = require('bun:test');
const express = require('express');
const detectPort = require('detect-port');
const axios = require('../lib/strong-axios');

const startServer = (port) => {
  const app = express();

  app.get('/', (req, res) => {
    res.send('get arcblock');
  });

  app.post('/', (req, res) => {
    res.send('post arcblock');
  });

  return app.listen(port);
};

describe('StrongAxios', () => {
  let port = null;
  let server = null;
  let endpoint = null;

  beforeAll(async () => {
    port = await detectPort();
    server = startServer(port);
    endpoint = `http://127.0.0.1:${port}`;
  });

  afterAll(() => {
    server.close();
  });

  test('should get as expected', async () => {
    const result = await axios.get(endpoint);
    expect(result.status).toBe(200);
    expect(result.data).toBeTruthy();
  });

  test('should post as expected', async () => {
    const result = await axios.post(endpoint);
    expect(result.status).toBe(200);
    expect(result.data).toBeTruthy();
  });
});
