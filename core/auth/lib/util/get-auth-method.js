const get = require('lodash/get');

const isServerLaunchedByLauncher = (info) =>
  get(info, 'ownerNft.holder') &&
  get(info, 'ownerNft.issuer') &&
  get(info, 'launcher.tag') &&
  get(info, 'launcher.chainHost') &&
  get(info, 'launcher.did') === get(info, 'ownerNft.issuer');

const getServerAuthMethod = (info, type, launcherSessionId = '', authorized = false) => {
  if (launcherSessionId) {
    /*
     * 需要用户提供 Ownership NFT 的情况:
     * - 通过 Blocklet Launcher Launch
     * - Server 是通过 Blocklet Launcher Launch 的
     * - Server 没有初始化
     */
    if (isServerLaunchedByLauncher(info) && !info.initialized && type !== 'serverless') {
      return 'nft';
    }

    return 'launcher';
  }

  if (type === 'serverless') {
    return 'nft';
  }

  if (authorized) {
    return 'session';
  }

  if (info.initialized) {
    return 'vc';
  }

  /*
   * 下面的情况也需要提供 NFT
   * - 没有 launcherSessionId
   * - Blocklet Server 没有初始化
   * - Blocklet Server 是通过 Blocklet Launcher Launch
   */
  if (isServerLaunchedByLauncher(info)) {
    return 'nft';
  }

  return 'vc';
};

module.exports = { getServerAuthMethod };
