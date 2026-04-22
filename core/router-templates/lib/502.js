const common = require('./common');

module.exports = (nodeInfo) =>
  common({
    status: 502,
    title: '502 - Bad gateway',
    content: 'Bad gateway: Upstream Blocklet or Daemon service is not available!',
    nodeInfo,
  });
