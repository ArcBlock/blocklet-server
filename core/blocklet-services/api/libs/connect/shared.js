const { getChainInfo } = require('@blocklet/meta/lib/util');
const { getAppInfo, getMemberAppInfo } = require('@blocklet/sdk/lib/util/app-info');

module.exports = {
  appInfo: ({ request, baseUrl }) => {
    return getAppInfo({
      request,
      baseUrl,
      getBlocklet: request.getBlocklet,
      getNodeInfo: request.getNodeInfo,
    });
  },
  memberAppInfo: ({ request, baseUrl }) => {
    return getMemberAppInfo({
      request,
      baseUrl,
      getBlocklet: request.getBlocklet,
      getNodeInfo: request.getNodeInfo,
    });
  },

  chainInfo: async ({ request } = {}) => {
    if (!request || !request.getBlocklet) {
      return { type: 'arcblock', id: 'none', host: 'none' };
    }

    const blocklet = await request.getBlocklet();
    return getChainInfo(blocklet.configObj);
  },
};
