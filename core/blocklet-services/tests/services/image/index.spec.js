/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const { test, describe, expect, beforeAll, mock, beforeEach, afterAll } = require('bun:test');
const fs = require('fs-extra');
const path = require('path');
const { http } = require('follow-redirects');
const os = require('os');
const { default: axios } = require('axios');
const detectPort = require('detect-port');
const express = require('express');
const bodyParser = require('body-parser');
const { fromFile } = require('file-type');

const imageService = require('../../../api/libs/image');

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve();
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });

beforeEach(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('image-service', () => {
  const sourceDir = path.resolve(__dirname, '../../../tools/fixtures/images');
  const cacheDir = path.join(os.tmpdir(), Math.random().toString(16).slice(2));

  const httpRouter = express();
  httpRouter.use(bodyParser.json());
  httpRouter.use((req, res) => {
    const srcFilePath = path.join(sourceDir, req.path);
    if (fs.existsSync(srcFilePath) === false) {
      res.status(404).send('Not Found');
      return;
    }

    if (imageService.isImageAccepted(req) && imageService.isImageRequest(req)) {
      imageService.processAndRespond(req, res, {
        cacheDir,
        srcPath: srcFilePath,
        getSrc: async () => {
          const result = await fromFile(srcFilePath);
          return [fs.createReadStream(srcFilePath), result?.ext];
        },
      });
    } else {
      res.status(400).send('Bad Request');
    }
  });

  let port;
  const server = http.createServer(httpRouter);
  const fetch = (file, method = 'get', { headers } = {}) =>
    axios[method](`http://localhost:${port}/${file}`, { headers });

  const sources = ['no-ext', 'bot.jpeg', 'cat.gif', 'paper.webp', 'react.png', 'twitter.jpg'];
  const sizes = sources.map((file) => fs.statSync(path.join(sourceDir, file)).size);

  beforeAll(async () => {
    mock.restore();
    mock.clearAllMocks();
    port = await detectPort();
    server.listen(port);
    await sleep(400);
  });

  afterAll(() => {
    server.close();
    fs.removeSync(cacheDir);
  });

  test('should return 400 if request is not an image', () => {
    expect(fetch('error.svg')).rejects.toThrow(/400/);
    expect(fetch('notfound.svg')).rejects.toThrow(/404/);
    expect(fetch('bot.jpeg')).rejects.toThrow(/400/);
    expect(fetch('bot.jpeg', 'post')).rejects.toThrow(/400/); // invalid method
    expect(fetch('bot.jpeg?imageFilter=resize')).rejects.toThrow(/400/); // invalid w | h
    expect(fetch('bot.jpeg?imageFilter=resize&w=4000')).rejects.toThrow(/400/); // invalid param
  });

  test('should convert any to webp', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=convert&f=webp`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );

    // leverage cache
    await fetch(`${sources[0]}?imageFilter=convert&f=webp`, 'get', { headers: { Accept: 'image/webp' } });
  });

  test('should return original format and convert webp to png', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=convert&f=webp&e=1`, 'get', {
          headers: {
            Accept: 'image/*',
          },
        });
        expect(res.status).toBe(200);
        const ext = path.extname(file);
        if (ext && ext !== '.webp') {
          expect(res.headers['content-type']).toBe(`image/${path.extname(file).slice(1)}`);
        } else {
          expect(res.headers['content-type']).toBe('image/png');
        }
      })
    );
  });

  test('should resize any to webp', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
        expect(+res.headers['content-length']).toBeLessThanOrEqual(sizes[sources.indexOf(file)]);
      })
    );

    await fetch(`${sources[0]}?imageFilter=resize&amp;w=320`, 'get', { headers: { Accept: 'image/webp' } });
  });

  test('should convert any to jpeg', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=convert&f=jpeg`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/jpeg');
      })
    );
  }, 180_000);

  test('should resize any to jpeg', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=jpeg`);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/jpeg');
      })
    );
  });

  test('should resize with any mode to smaller size', async () => {
    await Promise.all(
      imageService.MODES.map(async (mode) => {
        const res = await fetch(`bot.jpeg?imageFilter=resize&w=50&h=50&f=webp&m=${mode}`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );
  });

  test('should resize with any quality to smaller size', async () => {
    const qualities = [80, 60, 40, 20];
    await Promise.all(
      qualities.map(async (q) => {
        const res = await fetch(`bot.jpeg?imageFilter=resize&w=50&h=50&f=webp&m=cover&q=${q}`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
        expect(+res.headers['content-length']).toBeLessThanOrEqual(sizes[sources.indexOf('bot.jpeg')]);
      })
    );
  });

  test('should rotate any format', async () => {
    await Promise.all(
      sources
        .filter((file) => !file.endsWith('.gif'))
        .map(async (file) => {
          const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp&r=90`, 'get', {
            headers: {
              Accept: 'image/webp',
            },
          });
          expect(res.status).toBe(200);
          expect(res.headers['content-type']).toBe('image/webp');
        })
    );
  });

  test('should grayscale any format', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp&g=1`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );
  });

  test('should sharpen any format', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp&s=200`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );
  });

  test('should blur any format', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp&b=3`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );
  });

  test('should negate any format', async () => {
    await Promise.all(
      sources.map(async (file) => {
        const res = await fetch(`${file}?imageFilter=resize&w=50&h=50&f=webp&n=1`, 'get', {
          headers: {
            Accept: 'image/webp',
          },
        });
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('image/webp');
      })
    );
  });

  test('should return 400 when upstream svg has extension', async () => {
    expect.assertions(2);
    try {
      await fetch('space.svg?imageFilter=resize&w=50&e=1', 'get');
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.response.status).toBe(400);
    }
  });

  test('should return png when upstream svg has no extension', async () => {
    expect.assertions(2);
    const res = await fetch('no-ext-svg?imageFilter=resize&w=50&f=png', 'get');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  test('should return 400 when upstream not image', async () => {
    expect.assertions(3);
    try {
      await fetch('no-ext-txt?imageFilter=resize&w=50&f=png&e=1', 'get');
    } catch (err) {
      expect(err).toBeTruthy();
      expect(err.response.status).toBe(400);
      expect(err.response.data).toMatch(/Input buffer contains unsupported image format/);
    }
  });
});
