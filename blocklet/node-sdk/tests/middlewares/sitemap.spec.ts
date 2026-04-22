// eslint-disable-next-line import/no-extraneous-dependencies
import { Request, Response } from 'express';
import { describe, it, expect, mock, afterAll } from 'bun:test';

import { sitemap } from '../../src/middlewares/sitemap';

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

describe('sitemap', () => {
  it('should work as expected', (done) => {
    // eslint-disable-next-line require-await
    const middleware = sitemap(async (addEntry) => {
      addEntry({ url: 'https://example.com' });
    });

    expect(typeof middleware).toBe('function');

    const req = { method: 'GET', headers: {} };
    const res = {
      header: mock(),
      send: mock(),
      status: mock(),
    };

    middleware(req as Request, res as unknown as Response);

    setTimeout(() => {
      expect(res.header).toBeCalledWith('Content-Type', 'application/xml');
      expect(res.send).toBeCalledWith(
        '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"><url><loc>https://example.com/</loc></url></urlset>'
      );
      done();
    }, 1000);
  });
});
