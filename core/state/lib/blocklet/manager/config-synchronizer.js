const path = require('path');
const throttle = require('lodash/throttle');
const fs = require('fs-extra');
const logger = require('@abtnode/logger')('@abtnode/core:config-synchronizer');
const { encrypt } = require('@blocklet/sdk/lib/security');
const {
  APP_CONFIG_FILE_PATH,
  APP_CONFIG_DIR,
  COMPONENT_ENV_FILE_NAME,
  APP_CONFIG_PUBLIC_DIR,
} = require('@blocklet/constant');

const { findComponentByIdV2, getSharedConfigObj, getBlockletAppIdList } = require('@blocklet/meta/lib/util');
const { getBlockletLanguages, getBlockletPreferences } = require('@blocklet/env/lib/util');
const { getComponentsInternalInfo } = require('@blocklet/meta/lib/blocklet');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');

const { getBlockletConfigObj } = require('../../util/blocklet');

const getValueFromEnvironments = (environments, key) => {
  const env = (environments || []).find((x) => x.key === key);
  return env ? env.value : undefined;
};

const isAppObj = (x) => typeof x === 'object' && x !== null && !!x.meta;

class ConfigSynchronizer {
  constructor({ manager, states, wait = 2000 }) {
    this.manager = manager;
    this.wait = wait;
    this.throttles = new Map();
    this.states = states;
  }

  async syncAppConfig(did, { serverVersion: inputServerVersion } = {}) {
    try {
      const app = isAppObj(did) ? did : await this.manager.getBlocklet(did);
      const dataDir = getValueFromEnvironments(app.environments, 'BLOCKLET_DATA_DIR');
      if (!dataDir) {
        return;
      }

      const serverVersion = inputServerVersion || (await this.states.node.read()).version;
      const env = {
        appId: app.appDid,
        appPid: app.appPid,
        appIds: getBlockletAppIdList(app),
        appName: app.meta.title,
        appDescription: app.meta.description,
        appUrl: getValueFromEnvironments(app.environments, 'BLOCKLET_APP_URL'),
        appStorageEndpoint: getValueFromEnvironments(app.environments, 'BLOCKLET_APP_SPACE_ENDPOINT'),
        languages: getBlockletLanguages(getValueFromEnvironments(app.environments, 'BLOCKLET_APP_LANGUAGES')),
        preferences: getBlockletPreferences(
          (app.configs || []).reduce((acc, x) => {
            acc[x.key] = x.value;
            return acc;
          }, {})
        ),
        serverVersion,
        initialized: app?.settings?.initialized,
      };
      const components = getComponentsInternalInfo(app);

      const config = { env, components };

      await fs.outputFile(path.join(dataDir, APP_CONFIG_FILE_PATH), JSON.stringify(config));
    } catch (error) {
      logger.error('sync app config failed', { error });
    }
  }

  async syncComponentConfig(did, rootDid, { serverSk }) {
    try {
      const app = await this.manager.getBlocklet(rootDid);
      const dataDir = getValueFromEnvironments(app.environments, 'BLOCKLET_DATA_DIR');
      if (!dataDir) {
        return;
      }

      const component = findComponentByIdV2(app, did);

      const hasResources = !!component.meta.resource?.bundles?.length;

      const env = {
        ...component.configObj,
        ...getSharedConfigObj(app, component, true),
      };

      const componentApiKey = getComponentApiKey({
        serverSk,
        app,
        component,
      });

      await fs.outputFile(
        path.join(dataDir, APP_CONFIG_DIR, component.meta.did, COMPONENT_ENV_FILE_NAME),
        encrypt(JSON.stringify(env), componentApiKey, component.meta.did)
      );

      if (hasResources) {
        const publicEnv = {
          ...getBlockletConfigObj(component, { excludeSecure: true }),
          ...getSharedConfigObj(app, component, true),
        };
        await fs.outputFile(
          path.join(dataDir, APP_CONFIG_PUBLIC_DIR, component.meta.did, COMPONENT_ENV_FILE_NAME),
          JSON.stringify(publicEnv)
        );
      }
    } catch (error) {
      logger.error('sync component config failed', { error });
    }
  }

  async throttledSyncAppConfig(did, { wait = this.wait } = {}) {
    if (!this.throttles.has(did)) {
      let pendingPromise = null;
      let resolvePending = null;
      let rejectPending = null;

      const throttledFn = throttle(
        async () => {
          try {
            await this.syncAppConfig(did);
            if (resolvePending) {
              resolvePending();
              resolvePending = null;
              rejectPending = null;
            }
          } catch (error) {
            if (rejectPending) {
              rejectPending(error);
              resolvePending = null;
              rejectPending = null;
            }
          } finally {
            throttledFn.cancel();
            this.throttles.delete(did);
            pendingPromise = null;
          }
        },
        wait,
        { leading: false, trailing: true }
      );

      this.throttles.set(did, () => {
        // 如果已经有待执行的 Promise，返回同一个
        if (pendingPromise) {
          return pendingPromise;
        }

        // 创建新的 Promise
        pendingPromise = new Promise((resolve, reject) => {
          resolvePending = resolve;
          rejectPending = reject;
        });

        // 调用 throttle 函数
        throttledFn();

        return pendingPromise;
      });
    }
    await this.throttles.get(did)();
  }
}

module.exports = ConfigSynchronizer;
