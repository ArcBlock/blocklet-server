const logger = require('@abtnode/logger')('@abtnode/core:util:blocklet');
const promiseSpawn = require('@abtnode/util/lib/promise-spawn');

let lastTime = 0;
let lastResultPromise = null;

function checkDockerInstalled() {
  const now = Date.now();
  if (now - lastTime < 5000 && lastResultPromise) {
    return lastResultPromise;
  }
  lastTime = now;
  lastResultPromise = (async () => {
    if (process.env.ABT_NODE_NOT_ALLOW_DOCKER) return false;
    if (process.env.NODE_ENV === 'test') return false;
    try {
      await promiseSpawn('docker ps', { mute: true });
      logger.info('Docker is installed');
      return true;
    } catch {
      return false;
    }
  })();
  return lastResultPromise;
}
module.exports = {
  checkDockerInstalled,
};
