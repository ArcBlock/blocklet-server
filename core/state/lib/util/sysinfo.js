const maxBy = require('lodash/maxBy');
const SysInfo = require('systeminformation');

const TIMEOUT_MS = 3000; // 各模块超时 3 秒
const FS_CACHE_MS = 30_000; // fsSize 每 30 秒刷新一次
const OS_CACHE_MS = 120_000; // osInfo 每 120 秒刷新一次

const SAFE_EMPTY = {
  cpu: {
    avgLoad: 0,
    currentLoad: 0,
    physicalCores: 0,
    cores: 0,
    currentLoadUser: 0,
    currentLoadSystem: 0,
    currentLoadIdle: 0,
  },
  mem: {
    total: 0,
    free: 0,
    used: 0,
    active: 0,
    available: 0,
    buffers: 0,
    cached: 0,
  },
  os: {
    platform: '',
    distro: '',
    release: '',
    arch: '',
    hostname: '',
  },
  disks: [
    {
      device: '',
      mountPoint: '',
      total: 0,
      used: 0,
      free: 0,
    },
  ],
};

// 缓存状态
let lastResult = SAFE_EMPTY;
let runningPromise = null;

// 模块级缓存
let fsSizeCache = null;
let fsSizeTime = 0;
let osInfoCache = null;
let osInfoTime = 0;

// 超时包装
function runWithTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('systeminformation timeout')), ms)),
  ]);
}

async function getFsSizeSafe() {
  const now = Date.now();
  if (fsSizeCache && now - fsSizeTime < FS_CACHE_MS) return fsSizeCache;

  try {
    const res = await runWithTimeout(SysInfo.fsSize(), TIMEOUT_MS);
    fsSizeCache = res;
    fsSizeTime = now;
    return res;
  } catch (err) {
    console.warn('[getSysInfo] fsSize error or timeout:', err.message);
    return fsSizeCache || [];
  }
}

async function getOsInfoSafe() {
  const now = Date.now();
  if (osInfoCache && now - osInfoTime < OS_CACHE_MS) return osInfoCache;

  try {
    const res = await runWithTimeout(SysInfo.osInfo(), TIMEOUT_MS);
    osInfoCache = res;
    osInfoTime = now;
    return res;
  } catch (err) {
    console.warn('[getSysInfo] osInfo error or timeout:', err.message);
    return osInfoCache || {};
  }
}

function getSysInfo() {
  if (runningPromise) return runningPromise.catch(() => lastResult);

  runningPromise = (async () => {
    try {
      const [mem, currentLoad, fsSize, osInfo] = await Promise.all([
        runWithTimeout(SysInfo.mem(), TIMEOUT_MS),
        runWithTimeout(SysInfo.currentLoad(), TIMEOUT_MS),
        getFsSizeSafe(),
        getOsInfoSafe(),
      ]);

      let drives = fsSize;
      if (osInfo.platform === 'darwin') {
        const systemDrives = (fsSize || []).filter((x) => x.type === 'APFS');
        const rootDrive = systemDrives.find((x) => x.mount === '/');
        if (rootDrive) {
          const maxUsedDrive = maxBy(systemDrives, (x) => x.used);
          rootDrive.used = maxUsedDrive.used;
          drives = [rootDrive];
        } else {
          drives = [];
        }
      }

      const result = {
        cpu: { ...SAFE_EMPTY.cpu, ...currentLoad },
        mem: { ...SAFE_EMPTY.mem, ...mem },
        os: { ...SAFE_EMPTY.os, ...osInfo },
        disks:
          drives && drives.length
            ? drives
                .map((x) => ({
                  device: x.fs || '',
                  mountPoint: x.mount || '',
                  total: x.size || 0,
                  used: x.used || 0,
                  free: x.size ? x.size - x.used : 0,
                }))
                .filter((x) => x.total >= 0)
            : SAFE_EMPTY.disks,
      };

      lastResult = result;
      return result;
    } catch (err) {
      console.warn('[getSysInfo] error or timeout:', err.message);
      return lastResult;
    } finally {
      runningPromise = null;
    }
  })();

  return runningPromise;
}

module.exports.getSysInfo = getSysInfo;
