const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

// 一定时间内使用缓存, 减少 docker stats 的开销
const CACHE_DURATION = 1000 * 10;
const cache = {};

async function getDockerRuntimeInfo(dockerName) {
  const now = Date.now();
  if (cache[dockerName] && now - cache[dockerName].timestamp < CACHE_DURATION) {
    return cache[dockerName].data;
  }

  let data;
  try {
    const infoRaw = await promiseSpawn(`docker stats --no-stream --format "{{json .}}" ${dockerName}`, { mute: true });
    const stats = JSON.parse(infoRaw);

    const memoryUsage = stats.MemUsage
      ? parseFloat(stats.MemUsage.split('/')[0].replace('MiB', '').trim()) * 1024 * 1024
      : 0;
    const cpuUsage = stats.CPUPerc ? parseFloat(stats.CPUPerc.replace('%', '').trim()) : 0;

    data = {
      memoryUsage,
      cpuUsage,
    };
  } catch (error) {
    data = {
      memoryUsage: 0,
      cpuUsage: 0,
    };
  }
  cache[dockerName] = {
    timestamp: now,
    data,
  };
  return cache[dockerName].data;
}

module.exports = getDockerRuntimeInfo;
