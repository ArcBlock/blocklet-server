const { joinURL } = require('ufo');
const { getBlockletInfo } = require('@blocklet/meta/lib/info');
const { getBlockletLogos } = require('@abtnode/util/lib/blocklet');

const states = require('../states');

const getWalletAppNotification = async (blocklet, tempBlockletInfo) => {
  let blockletInfo = tempBlockletInfo;
  if (!blockletInfo) {
    const nodeInfo = await states.node.read();
    blockletInfo = getBlockletInfo(blocklet, nodeInfo.sk);
  }

  const { appLogo } = getBlockletLogos(blocklet);

  return {
    actions: [
      {
        name: 'Visit',
        link: blockletInfo.appUrl,
      },
    ],
    attachments: [
      {
        type: 'dapp',
        data: {
          url: blockletInfo.appUrl,
          appDID: blocklet.appPid,
          logo: joinURL(blockletInfo.appUrl, appLogo),
          title: blockletInfo.name,
          desc: blockletInfo.description,
        },
      },
    ],
  };
};

module.exports = {
  getWalletAppNotification,
};
