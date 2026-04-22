const omit = require('lodash/omit');
const { getConfigs } = require('@blocklet/meta/lib/util-config');
const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { getEmailServiceProvider } = require('@abtnode/auth/lib/email');

/**
 * Migrate blocklet authentication
 * @param {Object} manager - BlockletManager instance
 * @param {Object} params
 * @param {string} params.did - Blocklet DID
 * @returns {Promise<void>}
 */
async function migrateBlockletAuthentication(manager, { did }) {
  const blocklet = await manager.getBlocklet(did);
  if (blocklet.settings?.authentication) return;

  const authenticationList = [];

  const configs = getConfigs(blocklet, did);
  const allowWallet = configs.find((x) => x.key === 'DID_CONNECT_ALLOW_WALLET')?.value;
  if (['1', 'true', undefined, null].includes(allowWallet)) {
    // 默认是允许使用 wallet
    authenticationList.push({
      enabled: true,
      showQrcode: true,
      type: 'builtin',
      provider: LOGIN_PROVIDER.WALLET,
    });
  }

  const isEmailServiceEnabled = Boolean(getEmailServiceProvider(blocklet));
  if (isEmailServiceEnabled) {
    authenticationList.push({
      enabled: isEmailServiceEnabled,
      type: 'builtin',
      provider: LOGIN_PROVIDER.EMAIL,
    });
  }

  // 对旧的数据进行转换，并保存
  if (blocklet.settings?.oauth) {
    const oauthList = Object.keys(blocklet.settings?.oauth)
      .map((key) => ({
        ...omit(blocklet.settings?.oauth[key], 'order'),
        type: 'oauth',
        provider: key,
      }))
      .filter((x) => x.enabled === true);
    authenticationList.push(...oauthList);
  }
  authenticationList.push({
    enabled: true,
    type: 'builtin',
    provider: LOGIN_PROVIDER.PASSKEY,
  });
  const authentication = authenticationList.reduce((acc, curr, index) => {
    acc[curr.provider] = {
      ...omit(curr, ['provider']),
      order: index,
    };
    return acc;
  }, {});
  await manager.configAuthentication({ did, authentication: JSON.stringify(authentication) });
}

module.exports = {
  migrateBlockletAuthentication,
};
