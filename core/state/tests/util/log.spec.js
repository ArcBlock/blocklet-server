const { test, expect, describe, afterEach } = require('bun:test');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { createDownloadLogStream } = require('../../lib/util/log');

// Use system unzip command instead of unzipper library for Bun compatibility, performance better(MacOS): 20s => 50ms
const extractZip = (zipFile, destDir) => {
  fs.ensureDirSync(destDir);
  execSync(`unzip -o "${zipFile}" -d "${destDir}"`, { stdio: 'pipe' });
};

describe('createDownloadLogStream', () => {
  const tmpFile = path.join(__dirname, 'tmp.zip');
  const tmpLogDir = path.join(__dirname, 'logs');

  afterEach(() => {
    fs.removeSync(tmpFile);
    fs.removeSync(tmpLogDir);
  });

  const node = {
    dataDirs: {
      logs: path.join(__dirname, './server-data/logs'),
    },
    getNodeInfo: () => ({
      did: 'serverDid',
      routing: {
        provider: 'nginx',
      },
    }),
    getRouterProvider: () => ({
      getLogDir: () => path.join(__dirname, './server-data/router'),
      getLogFilesForToday: () => ({
        access: path.join(__dirname, './server-data/router/access.log'),
        error: path.join(__dirname, './server-data/router/error.log'),
      }),
    }),

    getBlocklet: () => ({
      env: {
        logsDir: path.join(__dirname, './server-data/logs/blocklet-abc'),
      },
      children: [
        {
          env: {
            logsDir: path.join(__dirname, './server-data/logs/blocklet-abc/did1'),
          },
        },
        {
          env: {
            logsDir: path.join(__dirname, './server-data/logs/blocklet-abc/did2'),
          },
        },
      ],
    }),
  };

  process.env.PM2_HOME = path.join(__dirname, './server-data/pm2-home');

  const now = new Date(2023, 0, 1);

  test('should download server log for 1 day', async () => {
    const stream = await createDownloadLogStream({ node, did: 'serverDid', days: 1, now });
    const fsStream = fs.createWriteStream(tmpFile);
    stream.pipe(fsStream);

    await new Promise((resolve, reject) => {
      fsStream.on('finish', resolve);
      fsStream.on('error', reject);
    });

    extractZip(tmpFile, tmpLogDir);

    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access-2022-12-30.log'))).toBeFalsy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access-2022-12-31.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/daemon-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/pm2.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/router/access.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/router/error.log'))).toBeTruthy();
  }, 20000);

  test('should download server log for 7 day', async () => {
    const stream = await createDownloadLogStream({ node, did: 'serverDid', days: 7, now });
    const fsStream = fs.createWriteStream(tmpFile);
    stream.pipe(fsStream);

    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      fsStream.on('finish', resolve);
      fsStream.on('error', reject);
    });

    // Extract the zip file
    extractZip(tmpFile, tmpLogDir);

    // Assert files exist
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access-2022-12-30.1.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access-2022-12-30.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access-2022-12-31.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-server/access.log'))).toBeTruthy();
  }, 20000);

  test('should download blocklet log for 1 day', async () => {
    const stream = await createDownloadLogStream({ node, did: 'blockletDid', days: 1, now });
    const fsStream = fs.createWriteStream(tmpFile);
    stream.pipe(fsStream);

    await new Promise((resolve, reject) => {
      fsStream.on('finish', resolve);
      fsStream.on('error', reject);
    });

    extractZip(tmpFile, tmpLogDir);

    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/info-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/info-error-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/info-error-2022-12-31.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/info-error-2022-12-30.log.gz'))).toBeFalsy();

    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did1/info-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did1/info-error-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did1/info-error-2022-12-31.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did1/info-error-2022-12-30.log.gz'))).toBeFalsy();

    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did2/info-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did2/info-error-2023-01-01.log'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did2/info-error-2022-12-31.log.gz'))).toBeTruthy();
    expect(fs.existsSync(path.join(tmpLogDir, 'logs/blocklet-abc/did2/info-error-2022-12-30.log.gz'))).toBeFalsy();
  }, 20000);
});
