const logger = require('@abtnode/logger')('@abtnode/docker-network');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
const { DBCache, getAbtNodeRedisAndSQLiteUrl } = require('@abtnode/db-cache');

const { checkDockerInstalled } = require('./check-docker-installed');

const lockNetwork = new DBCache(() => ({
  prefix: 'docker-network-locks',
  ttl: 1000 * 10,
  ...getAbtNodeRedisAndSQLiteUrl(),
}));

async function getDockerNetworks() {
  try {
    const stdout = await promiseSpawn('docker network ls --format "{{.Name}}"');
    return stdout || '';
  } catch (error) {
    logger.error('Error fetching network list:', error);
    return '';
  }
}

async function _createDockerNetwork(dockerNetworkName, retry = 0) {
  if (!process.env.ABT_NODE_DATA_DIR) {
    return;
  }
  if (!(await checkDockerInstalled())) {
    return;
  }
  const networks = await getDockerNetworks();
  try {
    if (!networks.includes(`${dockerNetworkName}-internal`)) {
      await promiseSpawn(`docker network create --internal ${dockerNetworkName}-internal`);
    } else {
      logger.info(`Network ${dockerNetworkName}-internal already exists. Skipping creation.`);
    }

    if (!networks.includes(dockerNetworkName)) {
      await promiseSpawn(`docker network create ${dockerNetworkName}`);
    } else {
      logger.info(`Network ${dockerNetworkName} already exists. Skipping creation.`);
    }
  } catch (error) {
    if (retry < 3 && error.message.includes('all predefined address pools')) {
      await promiseSpawn('docker network prune -f');
      await _createDockerNetwork(dockerNetworkName, retry + 1);
      return;
    }
    throw error;
  }
}

async function createDockerNetwork(dockerNetworkName) {
  // 创建网络添加锁，防止并发创建相同子网
  await lockNetwork.acquire(dockerNetworkName);
  try {
    await _createDockerNetwork(dockerNetworkName, 0);
  } catch (error) {
    if (/already exists in network/i.test(error?.message || '')) {
      logger.error('Error docker network already exists, but it can be ignored', error);
    } else {
      throw error;
    }
  } finally {
    lockNetwork.releaseLock(dockerNetworkName);
  }
}

async function removeDockerNetwork(dockerNetworkName) {
  try {
    const isDockerInstalled = await checkDockerInstalled();
    if (isDockerInstalled) {
      await promiseSpawn(`docker network rm ${dockerNetworkName}`);
      await promiseSpawn(`docker network rm ${dockerNetworkName}-internal`);
    }
    logger.info(`docker remove network ${dockerNetworkName} done`);
  } catch (_) {
    // 不需要打印, 因为上面的删除也是尝试性的, 在没有启用 docker 的情况, 不会有 docker network 存在
    // logger.error(`Error remove network ${dockerNetworkName}:`, error);
  }
}

module.exports = {
  createDockerNetwork,
  removeDockerNetwork,
};
