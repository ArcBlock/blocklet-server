import { describe, it, expect, beforeEach, afterEach, beforeAll, mock, afterAll } from 'bun:test';

import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response } from 'express';
// @ts-ignore
import { BLOCKLET_THEME_LIGHT, BLOCKLET_THEME_DARK } from '@blocklet/theme';

import { setEnvironment } from '../../tools/environment';
import { fallback } from '../../src/middlewares/fallback';

mock.module('@arcblock/ws', () => {
  const mockChannel = {
    join: mock(() => mockChannel),
    receive: mock(() => mockChannel),
    on: mock(() => mockChannel),
    leave: mock(() => mockChannel),
    push: mock(() => mockChannel),
  };

  const WsClient = mock(() => ({
    connect: mock(async () => {}),
    on: mock(() => {}),
    off: mock(() => {}),
    emit: mock(() => {}),
    channel: mock(() => mockChannel),
    close: mock(() => {}),
  }));

  return {
    WsClient,
    // WsServer,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('fallback', () => {
  beforeAll(() => {
    setEnvironment();
  });

  const file = 'test.html';
  const dir = join(tmpdir(), 'blocklet-sdk/middleware/fallback');
  const source =
    '<html><head><title>Test</title><script src="__blocklet__.js"></script></head><body><p>Test content</p></body></html>';

  const filePath = join(dir, file);

  let mockReqCount = 0;
  const mockReq = () => {
    mockReqCount++;
    return {
      method: 'GET',
      accepts: () => true,
      headers: {
        'x-page-group': `group${mockReqCount}`,
        'x-path-prefix': `prefix${mockReqCount}`,
      },
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let mockResCount = 0;
  const mockRes = () => {
    mockResCount++;
    return {
      type: mock(),
      send: mock(),
      setHeader: mock(),
    };
  };

  beforeEach(() => {
    mkdirSync(dir, { recursive: true });
    mock.restore();
    // Clear cache before each test
    (fallback as any).responseCache?.clear();
  });

  afterEach(() => {
    if (existsSync(filePath)) {
      rmSync(filePath);
    }
  });

  it('should skip when request static resources', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, { root: dir });
    expect(typeof middleware).toBe('function');

    const req: any = mockReq();
    const res = mockRes();

    req.path = '/path/to/a.js';

    middleware(req as Request, res as unknown as Response, (result) => {
      expect(result).toBeUndefined();
      expect(res.type).toBeCalledTimes(0);
      expect(res.send).toBeCalledTimes(0);
      expect(res.setHeader).toBeCalledTimes(0);
      done();
    });
  });

  it('should work as expected without pageData function', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, { root: dir });

    expect(typeof middleware).toBe('function');

    const req: any = mockReq();
    const res = mockRes();

    middleware(req as Request, res as unknown as Response, (result) => {
      expect(res.send).toBeCalledTimes(1);
      expect(res.setHeader).toBeCalledTimes(5); // Added ETag and X-Cache headers
      expect(result).toContain('Test');
      expect(result).toContain('og:description');
      expect(result).toContain('og:title');
      expect(result).toContain('og:image');
      expect(result).toContain('/.well-known/service/blocklet/og.png');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/"[A-Za-z0-9+/=]+"/));
      done();
    });
  });

  it('should work as expected with pageData function', (done) => {
    writeFileSync(filePath, source);

    const d1 = {
      title: 'Test title',
      description: 'Test description',
      ogImage: 'https://www.arcblock.io?key=value&nocache',
      embed: '/api/embed',
    };

    const middleware = fallback(file, {
      root: dir,
      getPageData: () => d1,
    });

    const req: any = mockReq();
    const res = mockRes();

    middleware(req as Request, res as unknown as Response, (result) => {
      expect(res.send).toBeCalledTimes(1);
      expect(res.setHeader).toBeCalledTimes(5); // Added ETag and X-Cache headers
      expect(result).toContain(d1.title);
      expect(result).toContain(d1.description);
      expect(result).toContain(d1.ogImage);
      expect(result).toContain(d1.embed);
      expect(result).toContain('og:description');
      expect(result).toContain('og:title');
      expect(result).toContain('og:image');
      expect(result).toContain('blocklet-open-embed');
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      done();
    });
  });

  it('should handle response caching correctly', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, { root: dir });

    const req: any = mockReq();
    const res1 = mockRes();
    const res2 = mockRes();

    // First request should miss cache
    middleware(req as Request, res1 as unknown as Response, () => {
      expect(res1.send).toBeCalledTimes(1);
      expect(res1.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      const firstETag = res1.setHeader.mock.calls.find((call) => call[0] === 'ETag')[1];

      // Second request should hit cache
      middleware(req as Request, res2 as unknown as Response, () => {
        expect(res2.send).toBeCalledTimes(1);
        expect(res2.setHeader).toHaveBeenCalledWith('X-Cache', 'HIT');
        expect(res2.setHeader).toHaveBeenCalledWith('ETag', firstETag);
        done();
      });
    });
  });

  it('should handle pageData timeout', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, {
      root: dir,
      // eslint-disable-next-line no-promise-executor-return
      getPageData: () => new Promise((resolve) => setTimeout(resolve, 500)),
      timeout: 200,
    });

    const req: any = mockReq();
    const res = mockRes();

    middleware(req as Request, res as unknown as Response, (error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Operation timed out after 200 ms');
      done();
    });
  });

  it('should validate pageData length', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, {
      root: dir,
      getPageData: () =>
        Promise.resolve({
          title: 'a'.repeat(2000),
          description: 'b'.repeat(2000),
        }),
    });

    const req: any = mockReq();
    const res = mockRes();

    middleware(req as Request, res as unknown as Response, (error) => {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Title too long');
      done();
    });
  });

  it('should generate different cache keys for different page groups', (done) => {
    writeFileSync(filePath, source);
    const pageData1 = { title: 'title1' };
    const pageData2 = { title: 'title2' };

    let callCount = 0;
    const middleware = fallback(file, {
      root: dir,
      getPageData: () => {
        callCount++;
        return callCount === 1 ? pageData1 : pageData2;
      },
    });

    const req1: any = mockReq();
    const req2: any = mockReq();
    const res = mockRes();

    // First request with group1
    middleware(req1 as Request, res as unknown as Response, () => {
      expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
      const firstETag = res.setHeader.mock.calls.find((call) => call[0] === 'ETag')[1];

      // Second request with group2 should miss cache
      middleware(req2 as Request, res as unknown as Response, () => {
        expect(res.setHeader).toHaveBeenCalledWith('X-Cache', 'MISS');
        // @ts-ignore
        const secondETag = res.setHeader.mock.calls.findLast((call) => call[0] === 'ETag')[1];
        expect(firstETag).not.toBe(secondETag);
        done();
      });
    });
  });

  it('should inject theme style and script correctly', (done) => {
    writeFileSync(filePath, source);
    const middleware = fallback(file, { root: dir });

    const req: any = mockReq();
    const res = mockRes();

    middleware(req as Request, res as unknown as Response, (result) => {
      // Verify theme style injection
      expect(result).toContain('<style id="blocklet-theme-style">');
      expect(result).toContain(':root {');
      expect(result).toContain(
        `--blocklet-background-default-color: ${BLOCKLET_THEME_LIGHT.palette.background.default}`
      );
      expect(result).toContain(`--blocklet-text-primary-color: ${BLOCKLET_THEME_LIGHT.palette.text.primary}`);
      expect(result).toContain("[data-theme='dark']");
      expect(result).toContain(
        `--blocklet-background-default-color: ${BLOCKLET_THEME_DARK.palette.background.default}`
      );
      expect(result).toContain(`--blocklet-text-primary-color: ${BLOCKLET_THEME_DARK.palette.text.primary}`);

      // Verify theme script injection
      expect(result).toContain('<script id="blocklet-theme-script">');
      expect(result).toContain("document.documentElement.setAttribute('data-theme', 'dark')");
      expect(result).toContain("document.documentElement.removeAttribute('data-theme')");

      done();
    });
  });
});
