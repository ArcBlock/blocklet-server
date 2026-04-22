const { NODE_MODES } = require('@abtnode/constant');
const { BLOCKLET_MODES } = require('@blocklet/constant');
const { checkDockerInstalled } = require('./check-docker-installed');

async function checkNeedRunDocker(meta = {}, env = {}, nodeInfo = {}, isExternal) {
  if (!process.env.ABT_NODE_DATA_DIR) {
    return false;
  }
  if (meta.group === 'static') {
    return false;
  }

  if (env.BLOCKLET_MODE === BLOCKLET_MODES.DEVELOPMENT) {
    return false;
  }

  // Serverless mode does not support skipping Docker
  let isSkipDocker = !!env.SKIP_DOCKER;
  if (nodeInfo.mode === NODE_MODES.SERVERLESS && isExternal) {
    isSkipDocker = false;
  }
  if (isSkipDocker) {
    return false;
  }

  // Use Docker if enabled via environment variable or config
  const useDocker = env.USE_DOCKER || nodeInfo.enableDocker;
  if (!useDocker) {
    return false;
  }

  // Ensure Docker is installed
  if (!nodeInfo.isDockerInstalled) {
    if (!(await checkDockerInstalled())) {
      throw new Error('Docker mode is enabled, but the Docker CLI was not found.');
    }
  }
  return true;
}

module.exports = checkNeedRunDocker;
