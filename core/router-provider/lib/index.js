/* eslint-disable no-await-in-loop */

const kill = require('fkill');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');
/* eslint-disable no-restricted-syntax, global-require */
const logger = require('@abtnode/logger')(`${require('../package.json').name}:provider:index`);
/* eslint-disable import/order */
const debug = require('debug')(`${require('../package.json').name}:provider:index`);
const sleep = require('@abtnode/util/lib/sleep');

const Nginx = require('./nginx');
const Default = require('./default');

const providerMap = new Map([['default', Default]]);

if (process.platform !== 'win32') {
  providerMap.set('nginx', Nginx);
}

const getProviderNames = () =>
  [...providerMap.keys()].sort((x) => {
    if (x === 'nginx') {
      return -1;
    }

    return 1;
  });

/**
 * Get provider by name
 * @param {string} type provider type name
 */
const getProvider = (name) => {
  if (!providerMap.has(name)) {
    logger.error(`getProvider:provider name [${name}] does not exist`);
    return null;
  }

  return providerMap.get(name);
};

/**
 * List routing provider meta and check status
 */
const listProviders = (configDir) =>
  Promise.all(getProviderNames().map((x) => providerMap.get(x).describe({ configDir })));

const findExistsProvider = () => {
  for (const name of getProviderNames()) {
    try {
      const Provider = providerMap.get(name);
      const exists = Provider.exists();
      if (exists) {
        return name;
      }
    } catch (error) {
      debug(error);
      console.error(`provider ${name} exists check failed:`, error.message);
    }
  }

  return 'default';
};

const clearRouterByConfigKeyword = async (keyword) => {
  if (!keyword) {
    debug('clear router by config directory prefix, config directory prefix is empty');
    return '';
  }

  debug('clear router by config directory prefix, config :', keyword);
  for (const [key, Provider] of providerMap.entries()) {
    const status = await Provider.getStatus(keyword);
    if (status.managed) {
      try {
        await kill(status.pid);
        debug('killed pid:', status.pid);
        debug('killed router:', key);
      } catch {
        // do nothing
      }
      return key;
    }
  }

  return '';
};

const checkDockerInstalled = async () => {
  try {
    await promiseSpawn('docker --version', { mute: true });
    await promiseSpawn('docker ps -a', { mute: true });
    return true;
  } catch (_) {
    return false;
  }
};

const clearDockerContainer = async () => {
  try {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const list = await promiseSpawn('docker ps -a -q --filter "name=^blocklet-"');
      if (!list) {
        return;
      }

      await promiseSpawn('docker rm -f $(docker ps -a -q --filter "name=^blocklet-")');
      await sleep(1000);
      attempts++;
    }

    logger.error('Failed to remove all containers');
  } catch (e) {
    logger.error(e);
  }
};

module.exports = {
  checkDockerInstalled,
  clearDockerContainer,
  clearRouterByConfigKeyword,
  findExistsProvider,
  getProvider,
  getProviderNames,
  listProviders,
};
