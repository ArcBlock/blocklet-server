import type { Request, Response } from 'express';
import { describe, expect, beforeEach, afterAll, mock, it } from 'bun:test';

describe('CDN middleware', () => {
  const testHtml = `
<!doctype html>
<html lang="en">
  <head>
    <script
      type="module"
      crossorigin
      src="/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/assets/polyfills-CBUhampF.js"></script>

    <script type="module">
      window.__toCdnUrl = (filePath) => {
        const blockletBase = '/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/';
        return window.blocklet.ASSET_CDN_HOST
          ? '//' + window.blocklet.ASSET_CDN_HOST + blockletBase + filePath
          : blockletBase + filePath;
      };
    </script>

    <script src="__blocklet__.js"></script>

    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#4F6AF5" />
    <link rel="blocklet-open-embed" type="application/json" href="{{&blockletOpenEmbed}}" />
    <meta property="og:title" content="{{ogTitle}}" data-react-helmet="true" />
    <meta property="og:description" content="{{ogDescription}}" data-react-helmet="true" />
    <meta property="og:image" content="{{&ogImage}}" data-react-helmet="true" />
    <meta name="twitter:card" content="summary_large_image" data-react-helmet="true" />
    <meta name="twitter:image:src" content="{{&ogImage}}" data-react-helmet="true" />
    <meta name="twitter:image" content="{{&ogImage}}" data-react-helmet="true" />
    <meta name="twitter:description" content="{{ogDescription}}" data-react-helmet="true" />
    <meta name="twitter:title" content="{{ogTitle}}" data-react-helmet="true" />
    <title>{{ogTitle}}</title>
    <link rel="icon" href="/favicon.ico?imageFilter=resize&w=32" />
    <!-- INJECT_HEAD_ELEMENTS -->
    <!-- INJECT_PAGES_KIT_CUSTOM_COMPONENTS -->

    <link
      rel="stylesheet"
      crossorigin
      href="/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/static/static/index-DPkP-55N.css" />
    <link
      rel="modulepreload"
      crossorigin
      href="/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/assets/react-vendor-Ct0FM6Kg.js" />
    <link
      rel="modulepreload"
      crossorigin
      href="/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/assets/utils-vendor-BqzFp5bB.js" />
  </head>
  <body style="margin: 0; padding: 0">
    <noscript> You need to enable JavaScript to run this app. </noscript>
    <div id="app">
      <div id="loading-id"></div>
    </div>
    <script
      type="module"
      crossorigin
      src="/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/assets/index-BZj5pX0r.js"></script>
  </body>
</html>
`;

  const TEST_DID = 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu';
  const ORIGINAL_ENV = { ...process.env };

  const importCdn = () => import('../../src/middlewares/cdn');

  const createRequest = (overrides: Partial<Request> = {}) =>
    ({
      method: 'GET',
      path: '/',
      accepts: mock(() => 'html'),
      ...overrides,
    }) as unknown as Request;

  const createResponse = () => {
    const originalSend = mock((payload: unknown) => payload);

    return {
      originalSend,
      response: { send: originalSend } as unknown as Response,
    };
  };

  beforeEach(() => {
    mock.restore();
    process.env = { ...ORIGINAL_ENV };
    process.env.BLOCKLET_COMPONENT_DID = TEST_DID;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
    mock.restore();
  });

  it('should transform HTML string response before sending to client', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest();
    const { response, originalSend } = createResponse();
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(
      req,
      response,
      next
    );

    (response.send as unknown as (body: unknown) => unknown)(testHtml);

    expect(originalSend).toHaveBeenCalledTimes(1);
    const sentPayload = originalSend.mock.calls[0]![0] as string;
    expect(sentPayload).toContain(
      'src="//cdn.example.com/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/assets/index-BZj5pX0r.js"'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should transform HTML Buffer responses', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest();
    const { response, originalSend } = createResponse();
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(
      req,
      response,
      next
    );

    (response.send as unknown as (body: unknown) => unknown)(Buffer.from(testHtml));

    expect(originalSend).toHaveBeenCalledTimes(1);
    const bufferPayload = originalSend.mock.calls[0]![0] as Buffer;
    expect(Buffer.isBuffer(bufferPayload)).toBe(true);
    expect(bufferPayload.toString('utf8')).toContain(
      'href="//cdn.example.com/.blocklet/proxy/z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu/static/static/index-DPkP-55N.css"'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should leave non-HTML responses unmodified', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest();
    const { response, originalSend } = createResponse();
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(
      req,
      response,
      next
    );

    const jsonResponse = JSON.stringify({ status: 'ok' });
    (response.send as unknown as (body: unknown) => unknown)(jsonResponse);

    expect(originalSend).toHaveBeenCalledWith(jsonResponse);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should skip transforming for non-HTML requests', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest({ method: 'POST', accepts: mock(() => false) } as any);
    const originalSend = mock();
    const res = { send: originalSend } as unknown as Response;
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(req, res, next);

    expect(res.send).toBe(originalSend);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should skip transforming for asset file requests', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest({ path: '/assets/logo.svg' });
    const originalSend = mock();
    const res = { send: originalSend } as unknown as Response;
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(req, res, next);

    expect(res.send).toBe(originalSend);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should skip transforming for well-known service requests', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest({ path: '/.well-known/service/blocklet/logo' });
    const originalSend = mock();
    const res = { send: originalSend } as unknown as Response;
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(req, res, next);

    expect(res.send).toBe(originalSend);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should skip transforming in development environment', async () => {
    process.env.NODE_ENV = 'development';
    process.env.ASSET_CDN_HOST = 'cdn.example.com';

    const { cdn } = await importCdn();

    const req = createRequest();
    const { response, originalSend } = createResponse();
    const next = mock();

    cdn({ did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', getAssetCdnHost: () => 'cdn.example.com' })(
      req,
      response,
      next
    );

    (response.send as unknown as (body: unknown) => unknown)(testHtml);

    expect(originalSend).toHaveBeenCalledWith(testHtml);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
