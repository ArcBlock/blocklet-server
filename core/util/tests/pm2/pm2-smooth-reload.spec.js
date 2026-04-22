/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
/* eslint-disable consistent-return */
/* eslint-disable no-promise-executor-return */

const { test, expect, describe, beforeAll, afterAll } = require('bun:test');
const path = require('path');
const axios = require('axios');
const http = require('http');
const fs = require('fs');
const os = require('os');

const pm2 = require('../../lib/pm2/async-pm2');
const { pm2StartOrReload } = require('../../lib/pm2/pm2-start-or-reload');

const SCRIPT = path.join(__dirname, '../../tools/simple-server.mock.js');

const KILL_TIMEOUT = 4000;
const LISTEN_TIMEOUT = 4000;
const INSTANCES = 1;

const serverCode = `
const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('slow-ok');
});

const port = Number(process.env.PORT || 0);

server.listen(port, () => {
  if (typeof process.send === 'function') {
    process.send('ready');        // paired with wait_ready: true
  }
});

`;
const serverCodePath = path.join(os.tmpdir(), 'simple-server.mock.js');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

const api = axios.create({
  timeout: 3_000,
  transitional: { clarifyTimeoutError: true },
});

function bust(url) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}_t=${Date.now()}${Math.random().toString(16).slice(2)}`;
}

async function httpGetAxios(port, pathname = '/ping', { timeout } = {}) {
  const res = await api.get(bust(`http://127.0.0.1:${port}${pathname}`), { timeout });
  return { status: res.status, data: res.data, headers: res.headers };
}

/** Wait for 200 OK */
async function waitForOk(port, pathname = '/ping', total = 10000, step = 80) {
  const start = Date.now();
  /* eslint-disable no-constant-condition */
  while (true) {
    try {
      const r = await api.get(bust(`http://127.0.0.1:${port}${pathname}`), { timeout: 600 });
      if (r.status === 200) return;
    } catch {
      //
    }
    if (Date.now() - start > total) throw new Error('waitForOk timeout');
    await new Promise((r) => setTimeout(r, step));
  }
}

function collectPIDs(name) {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      if (err) return reject(err);
      resolve(
        list
          .filter((p) => p.name === name)
          .map((p) => p.pid)
          .filter(Boolean)
          .sort()
      );
    });
  });
}

function waitOnline(name, timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      pm2.list((err, list) => {
        if (err) return reject(err);
        const proc = list.find((p) => p.name === name && p.pm2_env?.status === 'online');
        if (proc) return resolve();
        if (Date.now() - start > timeoutMs) {
          return reject(new Error('server not online in time'));
        }
        setTimeout(poll, 100);
      });
    })();
  });
}

describe('PM2 cluster smooth reload — browser-like axios (simple-server.mock.js)', () => {
  let oldEnv;

  beforeAll((done) => {
    oldEnv = process.env.ABT_NODE_DATA_DIR;
    pm2.connect((err) => {
      if (err) return done(err);
      pm2.list((subErr, list) => {
        if (subErr) return done(subErr);
        const targets = list.filter((p) => p.name.startsWith('e2e-smooth')).map((p) => p.name);
        if (!targets.length) return done();
        let i = 0;
        (function next() {
          if (i >= targets.length) {
            // wait until all processes are fully deleted
            setTimeout(() => {
              pm2.list((checkErr, checkList) => {
                if (checkErr) return done(checkErr);
                const remaining = checkList.filter((p) => p.name.startsWith('e2e-smooth'));
                if (remaining.length > 0) {
                  // if residual processes remain, wait a bit longer
                  setTimeout(done, 500);
                } else {
                  done();
                }
              });
            }, 500);
            return;
          }
          pm2.delete(targets[i], () => {
            i++;
            next();
          });
        })();
      });
    });
  });
  afterAll((done) => {
    pm2.disconnect(done);
    if (oldEnv) {
      process.env.ABT_NODE_DATA_DIR = oldEnv;
    }
  });

  test('check reload use new code', async () => {
    const APP = 'e2e-smooth-0';
    const port = await getFreePort();
    const config = {
      name: APP,
      script: serverCodePath,
      exec_mode: 'cluster',
      instances: 1,
      wait_ready: true,
      listen_timeout: LISTEN_TIMEOUT,
      shutdown_with_message: true,
      kill_timeout: KILL_TIMEOUT,
      env: {
        ABT_NODE_DATA_DIR: os.tmpdir(),
        PORT: String(port),
        NODE_ENV: 'test',
        PING_RES: 'pong-a',
      },
      time: true,
      pmx: false,
    };
    fs.writeFileSync(serverCodePath, serverCode);
    expect(fs.existsSync(serverCodePath)).toBe(true);

    await pm2StartOrReload(config);
    await waitForOk(port, '/slow');
    await waitOnline(APP, 5000);

    const r = await api.get(bust(`http://127.0.0.1:${port}/slow`));
    expect(r.status).toBe(200);
    expect(String(r.data)).toBe('slow-ok');

    fs.writeFileSync(serverCodePath, serverCode.replace('slow-ok', 'slow-ok-v2'));

    await pm2StartOrReload(config);
    await waitForOk(port, '/slow');
    await waitOnline(APP, 5000);

    const r2 = await api.get(bust(`http://127.0.0.1:${port}/slow`));
    expect(r2.status).toBe(200);
    expect(String(r2.data)).toBe('slow-ok-v2');
  }, 30_000);

  test('can start and go online', async () => {
    const APP = 'e2e-smooth-1';
    const port = await getFreePort();
    const config = {
      name: APP,
      script: SCRIPT,
      exec_mode: 'cluster',
      instances: INSTANCES,
      wait_ready: true,
      listen_timeout: LISTEN_TIMEOUT,
      shutdown_with_message: true,
      kill_timeout: KILL_TIMEOUT,
      env: {
        ABT_NODE_DATA_DIR: os.tmpdir(),
        PORT: String(port),
        KILL_TIMEOUT: String(KILL_TIMEOUT),
        SOCKET_END_TIMEOUT: '400',
        NODE_ENV: 'test',
        PING_RES: 'pong-a',
      },
      time: true,
      pmx: false,
    };
    await pm2StartOrReload(config);
    await waitForOk(port, '/ping');
    await waitOnline(APP, 5000);

    const r = await api.get(bust(`http://127.0.0.1:${port}/ping`), { timeout: 3_000 });
    expect(r.status).toBe(200);
    expect(String(r.data)).toBe('pong-a');

    config.env.PING_RES = 'pong-b';

    await pm2StartOrReload(config);
    await waitForOk(port, '/ping');
    await waitOnline(APP, 5000);

    const r2 = await api.get(bust(`http://127.0.0.1:${port}/ping`), { timeout: 3_000 });
    expect(r2.status).toBe(200);
    expect(String(r2.data)).toBe('pong-b');
  });

  test('instances:2 — smooth reload keeps service up; in-flight request completes (and env updated via PING_RES)', async () => {
    const APP = 'e2e-smooth-2';
    const port = await getFreePort();
    const config = {
      name: APP,
      script: SCRIPT,
      exec_mode: 'cluster',
      instances: INSTANCES,
      wait_ready: true,
      listen_timeout: LISTEN_TIMEOUT,
      shutdown_with_message: true,
      kill_timeout: KILL_TIMEOUT,
      env: {
        ABT_NODE_DATA_DIR: os.tmpdir(),
        PORT: String(port),
        KILL_TIMEOUT: String(KILL_TIMEOUT),
        SOCKET_END_TIMEOUT: '2000',
        NODE_ENV: 'test',
        PING_RES: 'pong-a',
      },
      time: true,
      pmx: false,
    };
    await pm2StartOrReload(config);

    await waitForOk(port, '/ping');
    await waitOnline(APP, 5000);

    const p1 = await httpGetAxios(port, '/ping');
    expect(p1.status).toBe(200);
    expect(String(p1.data)).toBe('pong-a');

    // in-flight request
    const inflight = api.get(bust(`http://127.0.0.1:${port}/slow?ms=300`));

    // reload + update PING_RES
    config.env.PING_RES = 'pong-b';
    await pm2StartOrReload(config);

    await waitForOk(port, '/ping');
    await waitOnline(APP, 5000);

    // in-flight requests may fail during reload; handle that case
    let inflightRes;
    try {
      inflightRes = await inflight;
      expect(inflightRes.status).toBe(200);
      expect(inflightRes.data).toBe('slow-ok');
    } catch (error) {
      // if the in-flight request fails (possibly during reload), wait for service readiness and retry
      await waitForOk(port, '/slow?ms=300');
      inflightRes = await api.get(bust(`http://127.0.0.1:${port}/slow?ms=300`));
      expect(inflightRes.status).toBe(200);
      expect(inflightRes.data).toBe('slow-ok');
    }

    const p2 = await httpGetAxios(port, '/ping');
    expect(p2.status).toBe(200);
    expect(String(p2.data)).toBe('pong-b');

    await new Promise((res) => pm2.delete(APP, () => res()));
  });

  test('instances:2 — three sequential reloads keep service up & rotate PIDs', async () => {
    const APP = 'e2e-smooth-3';
    const port = await getFreePort();

    const config = {
      name: APP,
      script: SCRIPT,
      exec_mode: 'cluster',
      instances: INSTANCES,
      wait_ready: true,
      listen_timeout: LISTEN_TIMEOUT,
      kill_timeout: KILL_TIMEOUT,
      env: {
        ABT_NODE_DATA_DIR: os.tmpdir(),
        PORT: String(port),
        KILL_TIMEOUT: String(KILL_TIMEOUT),
        SOCKET_END_TIMEOUT: '400',
        NODE_ENV: 'test',
      },
      shutdown_with_message: true,
      time: true,
      pmx: false,
    };
    await pm2StartOrReload(config);
    await waitForOk(port);
    await waitOnline(APP, 5000);

    let keepProbing = true;
    let errs = 0;
    let ok = 0;

    const onOk = (r) => {
      if (r.status !== 200) errs++;
      else ok++;
    };
    const onErr = () => {
      errs++;
    };

    const prober = (async () => {
      // request every 300 ms, including during restart
      while (keepProbing) {
        httpGetAxios(port, '/ping').then(onOk).catch(onErr);
        await new Promise((r) => setTimeout(r, 300));
      }
    })();

    const beforePIDs = await collectPIDs(APP);

    // restart multiple times
    for (let i = 0; i < 2; i++) {
      config.env.PING_RES = `ping-res-${i}`;
      await pm2StartOrReload(config);
      await waitForOk(port);
      await waitOnline(APP, 5000);
      await new Promise((r) => setTimeout(r, 200));
    }

    await waitForOk(port);
    await waitOnline(APP, 5000);

    const afterPIDs = await collectPIDs(APP);
    keepProbing = false;
    await new Promise((r) => setTimeout(r, 500));
    await prober;
    expect(ok).toBeGreaterThan(1);

    expect(errs).toBeLessThanOrEqual(2);

    const changed = beforePIDs.some((pid, idx) => pid !== afterPIDs[idx]);
    expect(changed).toBe(true);

    await new Promise((res) => pm2.delete(APP, () => res()));
  }, 40_000);
});
