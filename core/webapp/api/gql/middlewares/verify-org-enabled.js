/**
 * 验证是否开启了 org，如果没有开启，那么相关接口不应该被请求
 */

module.exports = async ({ teamDid }, context, node) => {
  const blocklet = await node.getBlocklet({ did: teamDid, useCache: true });
  const { org = {} } = blocklet.settings || {};
  if (!org?.enabled) {
    throw new Error('Org is not enabled, Can not request this api');
  }
};
