const getCommonTemplate = require('./common');
const getIcon = require('./util/get-icon');

const getBlockletNotRunningTemplate = (blocklet, nodeInfo) => {
  return getCommonTemplate({
    title: 'Blocklet is not running',
    icon: getIcon(blocklet),
    appName: blocklet?.meta?.title,
    pageTitle: `${blocklet?.meta?.title}`,
    content: 'Please come back later',
    extra: `<p style="color:#999;font-size:0.875rem;font-family: Arial;text-align:center">
      Powered by <a href="https://www.arcblock.io" target="_blank">ArcBlock</a>'s <a href="https://www.blocklet.io" target="_blank">Blocklet Technology</a>, the decentralized web engine.
    </p>`,
    nodeInfo,
  });
};

module.exports = { getBlockletNotRunningTemplate };
