const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

const { checkDockerInstalled } = require('./check-docker-installed');
const parseDockerName = require('./parse-docker-name');
const promiseDebounce = require('../promise-debounce');

async function cleanPm2NotHasContainer() {
  const isDockerInstalled = await checkDockerInstalled();
  if (!isDockerInstalled) {
    return;
  }

  try {
    const containerList = await promiseSpawn('docker ps -a --format {{.Names}}');
    const containerNames = containerList.split('\n').filter((v) => {
      const name = v.trim().replace(/^"|"$/g, '');
      return name.startsWith('blocklet-');
    });

    // 获取 PM2 进程列表
    const pm2List = await new Promise((resolve, reject) => {
      pm2.list((err, list) => {
        if (err) reject(err);
        else resolve(list.filter((process) => process.pm2_env.status !== 'stopped'));
      });
    });

    const pm2Names = new Set(pm2List.map((process) => parseDockerName(process.name, 'blocklet')));
    const containersToStop = containerNames.filter((containerName) => !pm2Names.has(containerName));

    for (const containerName of containersToStop) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await promiseSpawn(`docker rm -fv ${containerName}`);
      } catch (_) {
        //
      }
    }
  } catch (e) {
    logger.error('dockerContainerPrune failed', { error: e });
  }
}

const debounceCleanPm2NotHasContainer = promiseDebounce(cleanPm2NotHasContainer, 1000 * 60);

// 添加 PM2 事件监听
pm2.launchBus((err, bus) => {
  if (err) {
    logger.error('Failed to launch PM2 bus', { error: err });
    return;
  }

  // 监听进程在线状态变更
  bus.on('process:event', (packet) => {
    if (['stop', 'exit', 'restart'].includes(packet.event)) {
      debounceCleanPm2NotHasContainer();
    }
  });

  // 监听新进程启动
  bus.on('process:spawn', () => {
    debounceCleanPm2NotHasContainer();
  });

  logger.info('PM2 listeners set up successfully');
});

// 初始执行一次清理
debounceCleanPm2NotHasContainer();

module.exports = {
  debounceDockerContainerPrune: debounceCleanPm2NotHasContainer,
};
