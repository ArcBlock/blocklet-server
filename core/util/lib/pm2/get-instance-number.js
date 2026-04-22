const os = require('os');

const getServiceInstanceCount = () => {
  // unit: GB
  const memorySize = Math.floor(os.totalmem() / 1024 / 1024 / 1024) || 1;

  const cpuLength = os.cpus().length || 1;

  const customConfig = +process.env.ABT_NODE_MAX_CLUSTER_SIZE || Number.MAX_SAFE_INTEGER;

  return Math.max(Math.min(memorySize, cpuLength, customConfig), 1);
};

const getDaemonInstanceCount = () => {
  if (process.env.ABT_NODE_DAEMON_CLUSTER_SIZE === undefined) {
    return getServiceInstanceCount();
  }
  return +process.env.ABT_NODE_DAEMON_CLUSTER_SIZE || 1;
};

module.exports = {
  getDaemonInstanceCount,
  getServiceInstanceCount,
};
