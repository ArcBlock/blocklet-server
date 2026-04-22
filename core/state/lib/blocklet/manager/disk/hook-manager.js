const get = require('lodash/get');
const { forEachBlocklet, forEachComponentV2, isExternalBlocklet } = require('@blocklet/meta/lib/util');

const states = require('../../../states');
const {
  getRuntimeEnvironments,
  getConfigFromPreferences,
  getAppConfigsFromComponent,
  getHookArgs,
} = require('../../../util/blocklet');
const hooks = require('../../hooks');
const checkNeedRunDocker = require('../../../util/docker/check-need-run-docker');
const { dockerExec } = require('../../../util/docker/docker-exec');
const { installExternalDependencies } = require('../../../util/install-external-dependencies');
const { getBlocklet } = require('../../../util/blocklet');

const afterRunScripts = new Set(['postStart', 'preStop', 'preConfig', 'preUninstall']);

/**
 * Run user hook
 * @param {Object} manager - BlockletManager instance
 * @param {string} name - Hook name
 * @param {Object} blocklet - Blocklet state
 * @param {Object} context - Context
 * @returns {Promise<void>}
 */
async function _runUserHook(manager, name, blocklet, context) {
  const nodeInfo = await states.node.read();
  const nodeEnvironments = await states.node.getEnvironments(nodeInfo);
  const hookFn = async (b, { ancestors }) => {
    const env = getRuntimeEnvironments(b, nodeEnvironments, ancestors);
    const needRunDocker = await checkNeedRunDocker(b.meta, env, nodeInfo, isExternalBlocklet(blocklet));
    const hookArgs = getHookArgs(b);

    if (name === 'preInstall') {
      await installExternalDependencies({
        appDir: b.env.appDir,
        nodeInfo,
      });
    }

    if (needRunDocker) {
      const script = b.meta.scripts?.[name];
      if (script && afterRunScripts.has(name)) {
        return dockerExec({
          blocklet,
          meta: b.meta,
          script,
          hookName: name,
          nodeInfo,
          env,
          ...hookArgs,
        });
      }
      return null;
    }

    return hooks[name](b.meta.title, {
      hooks: Object.assign(b.meta.hooks || {}, b.meta.scripts || {}),
      env,
      appDir: b.env.appDir,
      did: blocklet.meta.did, // root blocklet did
      notification: states.notification,
      context,
      teamManager: manager.teamManager,
      ...hookArgs,
    });
  };

  await forEachBlocklet(blocklet, hookFn, { parallel: true, concurrencyLimit: 4 });
}

/**
 * Set configs from meta
 * @param {Object} manager - BlockletManager instance
 * @param {string} did - Blocklet DID
 * @param {string} [childDid] - Child blocklet DID
 * @returns {Promise<void>}
 */
async function _setConfigsFromMeta(manager, did, childDid) {
  const blocklet = await getBlocklet({ states, dataDirs: manager.dataDirs, did });

  const setConfig = async (app, component) => {
    const b = component || app;
    const environments = [...get(b.meta, 'environments', []), ...getConfigFromPreferences(b)];

    // write configs to db
    await states.blockletExtras.setConfigs([app.meta.did, component?.meta?.did].filter(Boolean), environments);

    if (component) {
      const envsInApp = await states.blockletExtras.getConfigs([blocklet.meta.did]);
      const envsInComponent = await states.blockletExtras.getConfigs([app.meta.did, component.meta.did]);

      const configs = getAppConfigsFromComponent({ environments }, envsInApp, envsInComponent);
      if (configs.length) {
        await states.blockletExtras.setConfigs(app.meta.did, configs);
      }
    }

    // chain config
    await manager._ensureAppChainConfig(
      blocklet.meta.did,
      environments.map((x) => ({ key: x.name, value: x.default })),
      { force: false }
    );
  };

  if (!childDid) {
    await setConfig(blocklet);
    await forEachComponentV2(blocklet, async (component) => {
      await setConfig(blocklet, component);
    });
  } else {
    const component = blocklet.children.find((x) => x.meta.did === childDid);

    await setConfig(blocklet, component);
  }
}

module.exports = {
  _runUserHook,
  _setConfigsFromMeta,
  afterRunScripts,
};
