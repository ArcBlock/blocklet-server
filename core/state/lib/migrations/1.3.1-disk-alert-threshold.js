const { DISK_ALERT_THRESHOLD_PERCENT } = require('@abtnode/constant');

module.exports = async ({ states, printInfo }) => {
  printInfo('Try to add "diskAlertThreshold" field to abtnode state...');

  const info = await states.node.read();
  info.diskAlertThreshold = DISK_ALERT_THRESHOLD_PERCENT;

  await states.node.updateNodeInfo(info);
};
