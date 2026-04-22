const { test, expect, describe, beforeAll, beforeEach } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');
const http = require('http');
const detectPort = require('detect-port');
const os = require('os');
const { DBCache } = require('@abtnode/db-cache');
const downloadFile = require('../lib/download-file');

const lock = new DBCache(() => ({
  prefix: 'mock-bundle-downloader-lock',
  ttl: 1000 * 10,
  sqlitePath: ':memory:',
}));

class MockBundleDownloader {
  constructor() {
    this.isCancelled = false;
  }

  // eslint-disable-next-line no-unused-vars
  cancelDownload = async (rootDid) => {
    await lock.groupSet('download-ctrl', rootDid, 'canceled');
  };

  isCanceled = async (rootDid) => {
    const canceled = await lock.groupGet('download-ctrl', rootDid);
    return canceled === 'canceled';
  };
}

describe('DownloadFile', () => {
  let fastFile;
  let slowConnection;
  let bigFile;
  let downloadErrorUrl;
  let bundleDownloader;

  beforeAll(async () => {
    bundleDownloader = new MockBundleDownloader();
    const port = await detectPort();
    const endpoint = `http://127.0.0.1:${port}`;
    fastFile = `${endpoint}/file`;
    slowConnection = `${endpoint}/slow-connection`;
    bigFile = `${endpoint}/big-file`;
    downloadErrorUrl = `${endpoint}/download-error-url`;

    http
      .createServer((req, res) => {
        if (req.url === '/file') {
          res.end('file');
        }
        if (req.url === '/slow-connection') {
          setTimeout(() => {
            res.end('file');
          }, 2000);
        }
        if (req.url === '/big-file') {
          let n = 5;
          const timer = setInterval(() => {
            if (n <= 0) {
              clearInterval(timer);
              res.end(`${n}`);
              return;
            }
            res.write(`${n}`);
            n--;
          }, 1000);

          res.write(`${n}`);
          n--;
        }
        if (req.url === '/download-error-url') {
          res.statusCode = 401;
          res.end('download error');
        }
      })
      .listen(port);
  });

  beforeEach(async () => {
    await lock.flushAll();
  });

  test('should download success', async () => {
    const dest = path.join(os.tmpdir(), 'download-success');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    const res = await downloadFile(fastFile, dest);
    expect(res).toEqual(dest);
    const exist = fs.existsSync(dest);
    expect(exist).toEqual(true);
    fs.removeSync(dest);
  }, 15_000);

  test('should download fail if timeout', async () => {
    const dest = path.join(os.tmpdir(), 'download-fail');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    expect.assertions(1);
    try {
      await downloadFile(slowConnection, dest, {
        timeout: 10,
      });
    } catch (err) {
      expect(err).toBeTruthy();
    }
    fs.removeSync(dest);
  });

  test('should remove file after download fail', async () => {
    const dest = path.join(os.tmpdir(), 'download-fail-remove');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    try {
      await downloadFile(slowConnection, dest, {
        timeout: 10,
      });
    } catch {
      //
    }

    const exist = fs.existsSync(dest);
    expect(exist).toEqual(false);
  });

  test('should be successfully cancelled manually before received body data', async () => {
    const did = `z${Math.random().toString(36).substring(2, 29)}`;

    setTimeout(() => {
      bundleDownloader.cancelDownload(did);
    }, 500);

    const dest = path.join(os.tmpdir(), 'download-cancel-before-received-body-data');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }

    const res = await downloadFile(slowConnection, dest, {
      checkCanceled: () => bundleDownloader.isCanceled(did),
      delayTime: 3000,
    });
    expect(res).toEqual(downloadFile.CANCEL);

    const isCancelled = await bundleDownloader.isCanceled(did);

    expect(isCancelled).toEqual(true);

    const exist = fs.existsSync(dest);
    expect(exist).toEqual(false);
    fs.removeSync(dest);
  }, 20_000);

  test('should be successfully cancelled manually after received body data', async () => {
    const did = `z${Math.random().toString(36).substring(2, 29)}`;
    let isCancelled = await bundleDownloader.isCanceled(did);

    expect(isCancelled).toEqual(false);

    setTimeout(() => {
      bundleDownloader.cancelDownload(did);
    }, 500);

    const dest = path.join(os.tmpdir(), 'download-cancel');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    const res = await downloadFile(bigFile, dest, {
      checkCanceled: () => bundleDownloader.isCanceled(did),
      delayTime: 3000,
    });
    expect(res).toEqual(downloadFile.CANCEL);

    isCancelled = await bundleDownloader.isCanceled(did);

    expect(isCancelled).toEqual(true);

    const exist = fs.existsSync(dest);
    expect(exist).toEqual(false);
    fs.removeSync(dest);
  }, 30_000);

  test('should be successfully cancelled manually after received body data 2', async () => {
    let progressCount = 0;
    const dest = path.join(os.tmpdir(), 'download-cancel-after-received-body-data');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    const res = await downloadFile(bigFile, dest, {
      minProgressInterval: 2000,
      onProgress: () => {
        progressCount++;
      },
    });

    expect(res).toEqual(dest);
    // not necessarily 2, as it depends on minProgressInterval
    expect(progressCount).toBeGreaterThan(0);

    const exist = fs.existsSync(dest);
    expect(exist).toEqual(true);
    fs.removeSync(dest);
  }, 30_000);

  test('should throw an error when download error', async () => {
    const dest = path.join(os.tmpdir(), 'download-error');
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
    }
    try {
      await downloadFile(downloadErrorUrl, dest);
    } catch (error) {
      expect(error).toEqual(new Error('download error'));
    }
    expect(fs.existsSync(dest)).toBeFalsy();
  }, 15_000);
});
