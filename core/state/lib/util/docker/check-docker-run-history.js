const path = require('path');
const fs = require('fs');

function checkDockerRunHistory(nodeInfo = {}) {
  if (!process.env.ABT_NODE_DATA_DIR) {
    return false;
  }

  if (!nodeInfo.isDockerInstalled) {
    return false;
  }
  if (nodeInfo.enableDocker) {
    return true;
  }
  const dockerEnvDir = path.join(process.env.ABT_NODE_DATA_DIR, 'tmp', 'docker');
  return fs.existsSync(dockerEnvDir);
}

module.exports = checkDockerRunHistory;
