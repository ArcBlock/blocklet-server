const { getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { getFederatedMembers } = require('@abtnode/auth/lib/util/federated');
const get = require('lodash/get');

const { getFederatedMaster } = require('./federated');
const { api } = require('../libs/api');
const logger = require('../libs/logger')();

/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @return {Promise<string[]>}
 */
async function getFederatedTrustedIssuers(blocklet, trustAllFederated = false) {
  const masterSite = getFederatedMaster(blocklet);
  if (!masterSite) {
    return [];
  }

  /**
   * @type {string[]}
   */
  const trustedIssuers = [masterSite.appId, masterSite.appPid];
  const members = trustAllFederated ? getFederatedMembers(blocklet, 'approved') : [];
  const appUrls = [masterSite.appUrl, ...members.map((item) => item.appUrl)].filter(Boolean);
  await Promise.allSettled(
    appUrls.map(async (appUrl) => {
      try {
        const { data } = await api.get(`${appUrl}/__blocklet__.js`, { params: { type: 'json' } });
        const { appId, appPid, alsoKnownAs = [] } = data;
        trustedIssuers.push(appId);
        trustedIssuers.push(appPid);
        trustedIssuers.push(...alsoKnownAs);
      } catch (error) {
        logger.error('Failed to fetch __blocklet__.js', { error, appUrl });
      }
    })
  );

  return [...new Set(trustedIssuers.filter(Boolean))];
}

/**
 * @description
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @param {{ sourceAppPid?: string, trustAllFederated?: boolean }} [{ sourceAppPid }={}, { trustAllFederated = false }={}]
 * @return {Promise<string[]>}
 */
async function getTrustedIssuers(blocklet, { sourceAppPid, trustAllFederated = false } = {}) {
  const blockletIdList = getBlockletAppIdList(blocklet);
  let federatedTrustedIssuers = [];
  if ((sourceAppPid && blockletIdList.includes(sourceAppPid) === false) || trustAllFederated) {
    federatedTrustedIssuers = await getFederatedTrustedIssuers(blocklet, trustAllFederated);
  }

  const trustedPassports = (blocklet.trustedPassports || []).map((x) => x.issuerDid);
  // NOTICE: 在某个应用的页面登录时，需要将该应用自身颁发的通行证页放入 trustedIssuers，这样才能登录应用独立颁发的 Passport
  // 使用该通行证登录后，其他应用均会展示为 guest
  const trustedIssuers = [...blockletIdList, ...federatedTrustedIssuers, ...trustedPassports];

  return [...new Set(trustedIssuers.filter(Boolean))];
}

/**
 * 检测这个 blocklet 的子组件是否有 aigne 需求
 * 1. 有组件设置了 requirements.aigne 为 true
 * 2. 已经连接了 aigne hub
 * @param {import('@blocklet/server-js').BlockletState} blocklet
 * @returns {boolean}
 */
function hasAigneRequirement(blocklet) {
  const children = blocklet.children || [];
  const aigne = get(blocklet, 'settings.aigne', {});

  const isAigneConnected = !!(aigne.url && aigne.key);
  const hasChildWithAigneRequirement =
    children.length > 0 && children.some((child) => get(child, 'meta.requirements.aigne', false));

  return isAigneConnected || hasChildWithAigneRequirement;
}

module.exports = {
  getTrustedIssuers,
  getFederatedTrustedIssuers,
  hasAigneRequirement,
};
