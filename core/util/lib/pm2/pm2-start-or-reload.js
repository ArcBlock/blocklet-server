/* eslint-disable no-await-in-loop */
/* eslint-disable consistent-return */
/* eslint-disable no-promise-executor-return */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const debug = require('debug')('@core/util:pm2-start-or-reload');
const pm2 = require('./async-pm2');

function getTempEnvPath(name) {
  const envPath = path.join(process.env.ABT_NODE_DATA_DIR || os.tmpdir(), 'tmp', `blocklet-${name}.temp-env.json`);
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return envPath;
}

function loadReloadEnv() {
  if (!process.env.RELOAD_PM2_APP_NAME) {
    return;
  }
  const tempEnvPath = getTempEnvPath(process.env.RELOAD_PM2_APP_NAME);
  if (!fs.existsSync(tempEnvPath)) {
    return;
  }
  try {
    const env = JSON.parse(fs.readFileSync(tempEnvPath, 'utf8'));
    Object.assign(process.env, env);
  } catch {
    //
  }

  try {
    fs.unlinkSync(tempEnvPath);
  } catch {
    //
  }
}

// wait for a single pm_id to come online
function waitProcOnlineById(id, timeout = 20_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      pm2.describe(id, (err, list) => {
        if (err) return reject(err);
        const info = Array.isArray(list) ? list[0] : list;
        if (info?.pm2_env?.status === 'online') return resolve();
        if (Date.now() - start > timeout) return reject(new Error('proc not online in time'));
        setTimeout(poll, 120);
      });
    })();
  });
}

async function rollingRestartWithEnv(config) {
  // eslint-disable-next-line camelcase
  const { name, listen_timeout = 20_000 } = config;
  const procs = await new Promise((resolve, reject) => {
    pm2.list((err, list) => (err ? reject(err) : resolve(list)));
  });

  // ensure a fixed order
  const targets = procs.filter((p) => p.name === name).sort((a, b) => a.pm_id - b.pm_id);

  for (const p of targets) {
    await new Promise((resolve, reject) => {
      pm2.reload(p.pm_id, {}, (err) => (err ? reject(err) : resolve()));
    });
    // wait for this specific pm_id to come back online (not at the name level)
    await waitProcOnlineById(p.pm_id, listen_timeout);
    // add a small buffer after the switch to avoid transient disruption
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function pm2ReloadWithEnv(config) {
  const { name, instances } = config;
  if (instances > 1) {
    await rollingRestartWithEnv(config);
  } else {
    await new Promise((resolve, reject) => {
      pm2.reload(name, {}, (err) => (err ? reject(err) : resolve()));
    });
  }
}

async function isProcessRunningByPm2(name) {
  const isHasRunning = await new Promise((resolve) => {
    pm2.list((err, list) => {
      if (err) return resolve(false);
      const proc = list.find((p) => p.name === name);
      resolve(!!proc);
    });
  });

  return isHasRunning;
}

async function getCurrentProcessCount(name) {
  const count = await new Promise((resolve) => {
    pm2.list((err, list) => {
      if (err) {
        return resolve(0);
      }

      const procs = list.filter((p) => p.name === name);
      resolve(procs.length);
    });
  });

  return count;
}

async function pm2StartOrReload(config = {}) {
  const { name, instances, execMode } = config;
  const tempEnvPath = getTempEnvPath(name);
  fs.writeFileSync(tempEnvPath, JSON.stringify(config.env));

  const isHasRunning = await isProcessRunningByPm2(name);

  if (isHasRunning) {
    // Check if we need to restart for cluster mode with different instance count
    debug('execMode', execMode, instances);
    if (execMode === 'cluster' && instances) {
      const currentCount = await getCurrentProcessCount(name);
      debug('current instance count', currentCount);

      if (currentCount !== instances) {
        try {
          await pm2.deleteAsync(name);
          debug('existing processes deleted', name);
        } catch (error) {
          debug('delete existing processes error', error);
        }
        await pm2.startAsync(config);
        return;
      }
    }

    await pm2ReloadWithEnv(config);
  } else {
    await pm2.startAsync(config);
  }
}

module.exports = {
  loadReloadEnv,
  isProcessRunningByPm2,
  getCurrentProcessCount,
  pm2StartOrReload,
};
