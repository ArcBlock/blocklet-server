const { describe, test, beforeEach, afterEach, expect, mock } = require('bun:test');
const express = require('express');
const request = require('supertest');
const axios = require('axios');
const { Readable } = require('stream');
const MockAdapter = require('axios-mock-adapter');
const isUrl = require('is-url');
const { init } = require('../../api/routes/csp-proxy');

require('express-async-errors');

describe('CSP Proxy API', () => {
  let server;
  let mockAxios;
  const validImageUrl = 'https://picsum.photos/600/400';
  const validJsonUrl = 'https://playground.staging.arcblock.io/__blocklet__.js?type=json';

  const createMockStream = (data = 'test data') => {
    const mockStream = new Readable({ read() {} });
    mockStream.push(data);
    mockStream.push(null);
    return mockStream;
  };

  const makeRequest = (url, referer = 'http://localhost:3000', host = 'localhost:3000') =>
    request(server).get('/.well-known/service/proxy').query({ url }).set('referer', referer).set('host', host);

  beforeEach(() => {
    const app = express();
    init(app);
    server = app;
    mockAxios = new MockAdapter(axios);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Input Validation', () => {
    test('should validate URL parameter', async () => {
      // Missing URL
      let res = await request(server)
        .get('/.well-known/service/proxy')
        .set('referer', 'http://localhost:3000')
        .set('host', 'localhost:3000');
      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid parameter: empty');

      const originalIsUrl = isUrl;
      // Invalid URL format
      global.isUrl = () => false; // mock 返回 false
      res = await makeRequest('invalid-url');
      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid parameter: invalid');

      // Non-HTTPS URL
      global.isUrl = () => true; // mock 返回 true
      res = await makeRequest('http://example.com/image.jpg');
      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid parameter: protocol');

      global.isUrl = originalIsUrl;
    });
  });

  describe('Security Validation', () => {
    test('should validate referer and prevent SSRF', async () => {
      // Missing referer
      let res = await request(server)
        .get('/.well-known/service/proxy')
        .query({ url: validImageUrl })
        .set('host', 'localhost:3000');
      expect(res.status).toBe(403);

      // Invalid referer domain
      res = await makeRequest(validImageUrl, 'http://malicious.com');
      expect(res.status).toBe(403);

      res = await makeRequest('https://192.168.1.1/image.jpg');
      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid parameter: internal');
    });

    test('should accept valid requests', async () => {
      const mockStream = createMockStream('image data');
      mockAxios.onGet(validImageUrl).reply(200, mockStream, { 'content-type': 'image/jpeg' });

      const res = await makeRequest(validImageUrl);
      expect(res.status).toBe(200);
    });
  });

  describe('Content Type Handling', () => {
    test.each([
      ['text/html', 'https://example.com/page.html'],
      ['text/javascript', 'https://example.com/script.js'],
      ['application/octet-stream', 'https://example.com/file.bin'],
      ['text/css', 'https://example.com/style.css'],
    ])('should reject %s (%s)', async (contentType, url) => {
      const mockStream = new Readable();
      mockStream.destroy = mock();

      mockAxios.onGet(url).reply(200, mockStream, { 'content-type': contentType });

      const res = await makeRequest(url);
      expect(res.status).toBe(400);
      expect(res.text).toBe('Invalid parameter: content-type');
      expect(mockStream.destroy).toHaveBeenCalled();
    });

    test('should accept allowed content types', async () => {
      // Accept image
      const imageStream = createMockStream('image data');
      mockAxios.onGet(validImageUrl).reply(200, imageStream, { 'content-type': 'image/jpeg' });
      let res = await makeRequest(validImageUrl);
      expect(res.status).toBe(200);

      // Accept JSON
      const jsonStream = createMockStream('{"test": "data"}');
      mockAxios.onGet(validJsonUrl).reply(200, jsonStream, { 'content-type': 'application/json; charset=utf-8' });
      res = await makeRequest(validJsonUrl);
      expect(res.status).toBe(200);
    });
  });

  describe('Security Headers and Configuration', () => {
    test('should set appropriate security headers', async () => {
      const jsonStream = createMockStream('{"test": "data"}');
      mockAxios.onGet(validJsonUrl).reply(200, jsonStream, { 'content-type': 'application/json' });

      let res = await makeRequest(validJsonUrl);
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('no-referrer');
      expect(res.headers['content-security-policy']).toBe("default-src 'none'; script-src 'none'; object-src 'none';");
      expect(res.headers['x-frame-options']).toBe('DENY');

      const imageStream = createMockStream('image data');
      mockAxios.onGet(validImageUrl).reply(200, imageStream, { 'content-type': 'image/jpeg' });
      res = await makeRequest(validImageUrl);
      expect(res.status).toBe(200);
      expect(res.headers['content-security-policy']).toBe("script-src 'none';");
      expect(res.headers['x-frame-options']).toBeUndefined();
    });

    test('should configure axios correctly and remove sensitive headers', async () => {
      const mockStream = createMockStream('image data');
      mockAxios.onGet(validImageUrl).reply(200, mockStream, {
        'content-type': 'image/jpeg',
        'set-cookie': 'session=abc123',
        authorization: 'Bearer token',
      });

      const res = await makeRequest(validImageUrl);
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.headers.authorization).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle various error types', async () => {
      mockAxios.onGet(validImageUrl).timeout();
      let res = await makeRequest(validImageUrl);
      expect(res.status).toBe(408);

      mockAxios.onGet(validImageUrl).reply(500);
      res = await makeRequest(validImageUrl);
      expect(res.status).toBe(500);

      mockAxios.onGet(validImageUrl).networkError();
      res = await makeRequest(validImageUrl);
      expect(res.status).toBe(400);
    });
  });

  describe('Detecting special URLs', () => {
    test('should reject special URLs', async () => {
      const urls400 = [
        'file:///etc/passwd',
        'expect://id',
        'https://2130706433/',
        'https://017700000001/',
        'https://example.com@127.0.0.1/',
        'https://127.0.0.1:443/',
        'https://[::1]:443/',
        'https://[::ffff:127.0.0.1]/',
        'https://3232235777/',
        'https://loca%25%36%31lhost/',
      ];

      const urls404 = ['https://httpbin.org/redirect-to?url=https://127.0.0.1', 'https://127.0.0.1@example.com/'];

      for (const url of urls400) {
        // eslint-disable-next-line no-await-in-loop
        const res = await makeRequest(url);
        expect(res.status).toBe(400);
        expect(res.text).toMatch('Invalid parameter');
      }

      for (const url of urls404) {
        // eslint-disable-next-line no-await-in-loop
        const res = await makeRequest(url);
        expect(res.status).toBe(404);
        expect(res.text).toMatch('Remote server error: 404');
      }
    });
  });
});
