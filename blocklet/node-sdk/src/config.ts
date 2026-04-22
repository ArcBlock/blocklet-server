/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import path from 'path';
import fs from 'fs';
import { joinURL } from 'ufo';
import { EventEmitter } from 'events';
import axios from 'axios';
import Debug from 'debug';
import cloneDeep from 'lodash/cloneDeep';
import throttle from 'lodash/throttle';
import { DEFAULT_DID_DOMAIN } from '@abtnode/constant';
import { BLOCKLET_THEME_LIGHT, BLOCKLET_THEME_DARK, merge } from '@blocklet/theme';
import { blockletEnv as initialEnv } from '@blocklet/env';
import {
  BlockletInternalEvents,
  BlockletStatus,
  APP_CONFIG_DIR,
  APP_CONFIG_FILE_PATH,
  COMPONENT_ENV_FILE_NAME,
} from '@blocklet/constant';
import { getBlockletLanguages, getBlockletPreferences } from '@blocklet/env/lib/util';
import { isPreferenceKey } from '@blocklet/meta/lib/util';
import { TComponentInternalInfo } from '@blocklet/meta/lib/blocklet';
import { encode as encodeBase32 } from '@abtnode/util/lib/base32';
import sleep from '@abtnode/util/lib/sleep';

import { decrypt } from './security';
import { version } from './version';
import Notification from './service/notification';
import ServerVersion from './util/server-version';
import { parseEnvFile } from './util/parse-env-file';
import { parseDockerComponentEndpoint } from './util/parse-docker-endpoint';
import { BlockletService } from './service/blocklet';

const debug = Debug('@blocklet/sdk:config');
const events = new EventEmitter();
const configSettings = {
  loadFileTimeout: 120_000,
};
let blockletClient;

const Events = {
  componentAdded: 'componentAdded',
  componentUpdated: 'componentUpdated',
  componentStarted: 'componentStarted',
  componentStopped: 'componentStopped',
  componentRemoved: 'componentRemoved',
  envUpdate: 'envUpdate',
};

const AppConfigKeyMap = {
  BLOCKLET_APP_NAME: 'appName',
  BLOCKLET_APP_NAME_SLUG: 'appNameSlug',
  BLOCKLET_APP_DESCRIPTION: 'appDescription',
  BLOCKLET_APP_VERSION: 'appVersion',
  BLOCKLET_APP_URL: 'appUrl',
  BLOCKLET_APP_SPACE_ENDPOINT: 'appStorageEndpoint',
  BLOCKLET_APP_LANGUAGES: ['languages', getBlockletLanguages],
  BLOCKLET_APP_TENANT_MODE: 'tenantMode',
  BLOCKLET_APP_SALT: 'sessionSalt',
  ABT_NODE_VERSION: 'serverVersion',
  ABT_NODE: 'serverVersion', // for backup compatibility
  ASSET_CDN_HOST: 'assetCdnHost',
};

// eslint-disable-next-line import/no-mutable-exports
let logger = {
  info: console.info,
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
  warn: console.warn,
  error: console.error,
};

const setLogger = (newLogger: typeof logger) => {
  logger = newLogger;
};

const appDataDir = process.env.BLOCKLET_APP_DATA_DIR;
let appEnvFromDisk: Record<string, any> = {};
let envFromDisk: Record<string, any> = {};
let componentsFromDisk;
let configFile;

if (appDataDir) {
  try {
    configFile = path.join(appDataDir, APP_CONFIG_FILE_PATH);
    if (fs.existsSync(configFile)) {
      let configRaw = fs.readFileSync(configFile).toString();
      if (process.env.DOCKER_HOST_SERVER_DIR && process.env.DOCKER_CONTAINER_SERVER_DIR) {
        configRaw = configRaw.replace(
          new RegExp(process.env.DOCKER_HOST_SERVER_DIR, 'g'),
          process.env.DOCKER_CONTAINER_SERVER_DIR
        );
      }
      const config = JSON.parse(configRaw);
      appEnvFromDisk = config.env || {};
      componentsFromDisk = config.components;
    }
  } catch (error) {
    logger.error(error);
  }

  try {
    const envFile = path.join(appDataDir, APP_CONFIG_DIR, process.env.BLOCKLET_COMPONENT_DID, COMPONENT_ENV_FILE_NAME);
    envFromDisk = parseEnvFile(envFile, {
      apiKey: process.env.BLOCKLET_COMPONENT_API_KEY,
      componentDid: process.env.BLOCKLET_COMPONENT_DID,
    });
  } catch (error) {
    logger.error(error);
  }
}

const env: {
  appId: string;
  appPid: string;
  appIds: string[];
  appName: string;
  appNameSlug: string;
  appDescription: string;
  appUrl: string;
  isComponent: boolean;
  dataDir: string;
  cacheDir: string;
  mode: string;
  tenantMode: string;
  appStorageEndpoint: string;
  serverVersion: string;
  sessionSalt: string;
  assetCdnHost: string;
  languages: {
    code: string;
    name: string;
  }[];
  preferences: Record<string, any>;
  componentDid: string;
  initialized?: boolean;
  [key: string]: any;
} = {
  ...initialEnv,
  ...appEnvFromDisk,
  ...envFromDisk,
  componentDid: process.env.BLOCKLET_COMPONENT_DID,
  dataDir: process.env.BLOCKLET_DATA_DIR,
  cacheDir: process.env.BLOCKLET_CACHE_DIR,
  mode: process.env.BLOCKLET_MODE,
  tenantMode: process.env.BLOCKLET_APP_TENANT_MODE,
  sessionSalt: process.env.BLOCKLET_APP_SALT || '',
  assetCdnHost: process.env.ASSET_CDN_HOST,
  preferences: {
    ...initialEnv.preferences,
    ...appEnvFromDisk.preferences,
    ...envFromDisk.preferences,
  },
};

type MountPoint = TComponentInternalInfo & {
  webEndpoint?: string;
};

type TComponent = MountPoint;

type TComponents = Array<TComponent>;

const _fillWebEndpoint = (components: TComponents) => {
  components.forEach((x) => {
    if (x.port) {
      x.webEndpoint = parseDockerComponentEndpoint(`http://127.0.0.1:${x.port}`, x);
    }
  });
};

const initComponentStore = (): TComponents => {
  const components = componentsFromDisk
    ? cloneDeep(componentsFromDisk)
    : JSON.parse(process.env.BLOCKLET_MOUNT_POINTS || '[]') || [];
  _fillWebEndpoint(components);
  return components;
};

const componentStore: TComponents = initComponentStore();

let lastLoadTime = 0;

// Reduce the next load interval to maxTime; if already close to the deadline, leave it unchanged
const reduceNextLoadTime = (maxTime: number) => {
  if (typeof maxTime !== 'number' || maxTime < 0) {
    throw new Error('maxTime must be a positive number');
  }
  const now = Date.now();

  const elapsed = now - lastLoadTime;
  const remaining = configSettings.loadFileTimeout - elapsed;

  // If the remaining time is already shorter than maxTime, a reload is imminent; skip the adjustment
  if (remaining <= maxTime) return;

  // Adjust lastLoadTime so that the next load is triggered sooner, based on maxTime
  lastLoadTime = now - (configSettings.loadFileTimeout - maxTime);
};

const getComponents = () => {
  const now = Date.now();
  if (now - lastLoadTime < configSettings.loadFileTimeout) {
    return componentStore;
  }
  lastLoadTime = now;
  try {
    if (configFile && fs.existsSync(configFile)) {
      let configRaw = fs.readFileSync(configFile).toString();
      if (process.env.DOCKER_HOST_SERVER_DIR && process.env.DOCKER_CONTAINER_SERVER_DIR) {
        configRaw = configRaw.replace(
          new RegExp(process.env.DOCKER_HOST_SERVER_DIR, 'g'),
          process.env.DOCKER_CONTAINER_SERVER_DIR
        );
      }
      const config = JSON.parse(configRaw);
      componentsFromDisk = config.components;
      const componentsMap = {};
      for (const component of componentsFromDisk) {
        componentsMap[component.did] = component;
      }
      componentStore.length = 0;
      for (const component of componentsFromDisk) {
        componentStore.push(component);
      }
      _fillWebEndpoint(componentStore);
    }
  } catch (error) {
    logger.error(error);
  }

  return componentStore;
};

const updateComponentStoreInDocker = (components: TComponents) => {
  if (!components || !components.length) {
    return;
  }
  if (process.env.DOCKER_HOST_SERVER_DIR && process.env.DOCKER_CONTAINER_SERVER_DIR) {
    const raw = JSON.stringify({ v: components });
    const nextRaw = raw.replace(
      new RegExp(process.env.DOCKER_HOST_SERVER_DIR, 'g'),
      process.env.DOCKER_CONTAINER_SERVER_DIR
    );
    const nextComponents = JSON.parse(nextRaw).v;
    for (let i = 0; i < nextComponents.length; i++) {
      components[i] = nextComponents[i];
    }
  }
};

const _handleComponentUpdateOld = (data: { components: TComponents }) => {
  componentStore.splice(0, componentStore.length);
  componentStore.push(
    ...data.components.map((x) => {
      if (x.port) {
        x.webEndpoint = parseDockerComponentEndpoint(`http://127.0.0.1:${x.port}`, x);
      }
      return x;
    })
  );
  updateComponentStoreInDocker(componentStore);
};

const _setComponentStatus = (components: Partial<TComponent>[], status: number) => {
  const list = componentStore.filter((x) => components.find((y) => y.did === x.did));
  list.forEach((x) => {
    x.status = status;
  });
  return cloneDeep(list);
};

const _setUpdatedComponents = (components: TComponents) => {
  const list = cloneDeep(components || []);
  _fillWebEndpoint(list);

  list.forEach((newItem) => {
    const exist = componentStore.find((x) => x.did === newItem.did);
    newItem.status = exist ? exist.status : BlockletStatus.stopped;
    if (exist) {
      Object.assign(exist, newItem);
    } else {
      componentStore.push({ ...newItem, status: BlockletStatus.stopped });
    }
  });

  updateComponentStoreInDocker(componentStore);
  updateComponentStoreInDocker(list);

  return list;
};

const _handleComponentStarted = (data: { components: Partial<TComponent>[] }) => {
  const list = _setComponentStatus(data.components, BlockletStatus.running);
  debug('handle component started', data, list);
  events.emit(Events.componentStarted, list);
};

const _handleComponentStopped = (data: { components: Partial<TComponent>[] }) => {
  const list = _setComponentStatus(data.components, BlockletStatus.stopped);
  debug('handle component stopped', data, list);
  events.emit(Events.componentStopped, list);
};

const _handleComponentRemoved = (data: { components: Partial<TComponent>[] }) => {
  const list = componentStore.filter((x) => data.components.find((y) => y.did !== x.did));
  componentStore.splice(0, componentStore.length);
  componentStore.push(...list);
  debug('handle component removed', data, list);
  events.emit(Events.componentRemoved, data.components);
};

const _handleComponentUpdated = (data: { components: TComponents }) => {
  const list = _setUpdatedComponents(data.components);
  debug('handle component updated', data, list);
  events.emit(Events.componentUpdated, list);
};

const _handleComponentInstalled = (data: { components: TComponents }) => {
  const list = _setUpdatedComponents(data.components);
  debug('handle component installed', data, list);
  events.emit(Events.componentAdded, list);
};

const _handleAppConfigUpdate = (data) => {
  // ensure version in ServerVersion
  const serverVersion = data.configs.find((x) => x.key === 'ABT_NODE_VERSION')?.value;
  if (serverVersion) {
    ServerVersion.version = serverVersion;
  }

  const configs = data.configs || [];
  const updates = configs
    .filter((x) => !isPreferenceKey(x))
    .reduce((o, { key, value }) => {
      const item = AppConfigKeyMap[key];
      const k = Array.isArray(item) ? item[0] : item || key;
      const v = Array.isArray(item) ? item[1](value) : value;
      o[k] = v;
      return o;
    }, {});

  // Just do a merge
  updates.preferences = Object.assign(
    env.preferences || {},
    getBlockletPreferences(
      configs.reduce((acc, x) => {
        acc[x.key] = x.value;
        return acc;
      }, {})
    )
  );

  Object.assign(env, updates);
  debug('handle app config update', data, updates);
  events.emit(Events.envUpdate, updates);
};

const _handleAppSettingUpdate = (data) => {
  debug('handle app settings update', data);
  events.emit(Events.envUpdate, data);
};

const _handleComponentConfigUpdate = (data) => {
  try {
    const decrypted = decrypt(
      data.configs || '[]',
      process.env.BLOCKLET_COMPONENT_API_KEY,
      process.env.BLOCKLET_COMPONENT_DID
    );
    const configs = JSON.parse(decrypted);

    const updates = configs
      .filter((x) => !isPreferenceKey(x))
      .reduce((o, { key, value }) => {
        o[key] = value;
        return o;
      }, {});

    Object.assign(env, updates);
    const preferenceUpdates = getBlockletPreferences(
      configs.reduce((acc, x) => {
        acc[x.key] = x.value;
        return acc;
      }, {})
    );

    env.preferences = env.preferences || {};
    Object.assign(env.preferences, preferenceUpdates);
    debug('handle component config update', data, decrypted, { ...updates, preferences: preferenceUpdates });
    events.emit(Events.envUpdate, {
      ...updates,
      preferences: preferenceUpdates,
    });
  } catch (error) {
    logger.error('Failed to update component config', error.message);
  }
};

const DEFAULT_THEME_SETTINGS = {
  prefer: 'system' as const,
  light: BLOCKLET_THEME_LIGHT,
  dark: BLOCKLET_THEME_DARK,
};

let blockletJs: string = '';
const blockletSettings = {
  theme: DEFAULT_THEME_SETTINGS,
  federated: null,
  enableBlacklist: false,
};

// Single-flight: deduplicate concurrent requests into one
let _pendingBlockletRequest: Promise<Record<string, any>> | null = null;

const _requestBlockletJson = async (): Promise<Record<string, any>> => {
  const componentDid = process.env.BLOCKLET_COMPONENT_DID;
  const appUrl = `https://${encodeBase32(env.appPid)}.${DEFAULT_DID_DOMAIN}`;
  const { mountPoint } = componentStore.find((x) => x.did === componentDid);
  const url = joinURL(appUrl, mountPoint === '/' ? '' : mountPoint, '__blocklet__.js?type=json');

  const res = await axios.get(url, {
    timeout: 8000,
    headers: {
      'User-Agent': `BlockletSDK/${version}`,
    },
  });

  // Parse response data (originally the type='json' parsing path)
  let data: Record<string, any>;
  try {
    data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  } catch (e) {
    throw new Error('Invalid blocklet.json response');
  }

  if (typeof data !== 'object') {
    throw new Error('Invalid blocklet.json data');
  }

  logger.info(`Fetch blocklet.json succeed: ${componentDid} from ${appUrl}`);
  return data;
};

const _getBlockletData = (): Promise<Record<string, any>> => {
  if (_pendingBlockletRequest) {
    return _pendingBlockletRequest;
  }

  _pendingBlockletRequest = (async () => {
    try {
      return await _requestBlockletJson();
    } finally {
      _pendingBlockletRequest = null;
    }
  })();

  return _pendingBlockletRequest;
};

const fetchBlockletJs = async (type: 'js' | 'json' = 'js') => {
  const componentDid = process.env.BLOCKLET_COMPONENT_DID;
  const appUrl = `https://${encodeBase32(env.appPid)}.${DEFAULT_DID_DOMAIN}`;
  try {
    const data = await _getBlockletData();

    if (type === 'js') {
      // Generate a JS string from JSON data (mimics the server-side parseResponse format)
      const envStr = Object.entries(data)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(',');
      const jsStr = `window.blocklet = {${envStr}};`;

      blockletJs = jsStr;
      return jsStr;
    }
    blockletSettings.theme = {
      ...DEFAULT_THEME_SETTINGS,
      ...(data.theme || {}),
      light: merge(DEFAULT_THEME_SETTINGS.light, data.theme?.light || {}),
      dark: merge(DEFAULT_THEME_SETTINGS.dark, data.theme?.dark || {}),
    };

    return data;
  } catch (err) {
    logger.error(`Fetch blocklet.${type} failed: ${componentDid} from ${appUrl}`, err.message);
    return type === 'js' ? '' : {};
  }
};

const fetchBlockletData = async () => {
  try {
    if (!blockletClient) {
      blockletClient = new BlockletService();
    }
    const { blocklet } = await blockletClient.getBlocklet(false, true);
    blockletSettings.federated = blocklet.settings?.federated;
    blockletSettings.enableBlacklist = blocklet.settings?.session?.enableBlacklist;
    return blocklet;
  } catch (err) {
    logger.error('Failed to fetch blocklet data', err.message);
    return null;
  }
};

const getBlockletSettings = () => {
  return blockletSettings;
};

const refreshBlockletContext = throttle(
  async () => {
    // Add jitter to prevent multiple components from triggering simultaneously
    await sleep(Math.floor(Math.random() * 701) + 300);
    // FIXME: Ideally fetchBlockletJs should be refactored to use fetchBlockletData, but left unchanged to avoid breaking changes
    await Promise.all([fetchBlockletJs('js'), fetchBlockletJs('json'), fetchBlockletData()]);
  },
  5000,
  { trailing: true }
);

// Page group is dynamic, so we need to create it on the fly
const normalize = (prefix: string): string => `/${prefix}/`.replace(/\/+/g, '/');

const getBlockletJs = (pageGroup: string = '', pathPrefix: string = '', source: string = blockletJs): string => {
  let copy = source.slice(0);
  if (pageGroup) {
    copy = copy.replace('pageGroup: "",', `pageGroup: "${pageGroup}",`);
  }
  const componentDid = process.env.BLOCKLET_COMPONENT_DID;
  if (pathPrefix && componentDid) {
    const { mountPoint } = componentStore.find((x) => x.did === componentDid) || {};
    copy = copy
      .replace(`prefix: "${normalize(mountPoint)}",`, `prefix: "${normalize(pathPrefix)}",`)
      .replace('prefix: "/",', `prefix: "${normalize(pathPrefix)}",`);
  }
  return copy;
};

// prettier-ignore
const runInServer =
  (fn, type: 'new' | 'old') =>
  // eslint-disable-next-line consistent-return
    (...args) => {
      if (ServerVersion.gt('1.16.14')) {
        if (type === 'new') {
          return fn(...args);
        }
      } else if (type === 'old') {
        return fn(...args);
      }
    };

const inRuntimeEnv = !!process.env.BLOCKLET_APP_ASK || !!process.env.BLOCKLET_APP_SK;
if (inRuntimeEnv && !process.env.BLOCKLET_HOOK_NAME && process.env.BLOCKLET_MODE !== 'test') {
  Notification.on(BlockletInternalEvents.appConfigChanged, _handleAppConfigUpdate);
  Notification.on(BlockletInternalEvents.appSettingChanged, _handleAppSettingUpdate);
  Notification.on(BlockletInternalEvents.componentConfigChanged, _handleComponentConfigUpdate);

  // Reactive fetch
  Notification.on(BlockletInternalEvents.appConfigChanged, refreshBlockletContext);
  Notification.on(BlockletInternalEvents.appSettingChanged, refreshBlockletContext);
  Notification.on(BlockletInternalEvents.componentConfigChanged, refreshBlockletContext);

  Notification.on(BlockletInternalEvents.componentInstalled, runInServer(_handleComponentInstalled, 'new'));
  Notification.on(BlockletInternalEvents.componentUpgraded, runInServer(_handleComponentUpdated, 'new'));
  Notification.on(BlockletInternalEvents.componentUpdated, runInServer(_handleComponentUpdated, 'new'));
  Notification.on(BlockletInternalEvents.componentStarted, runInServer(_handleComponentStarted, 'new'));
  Notification.on(BlockletInternalEvents.componentStopped, runInServer(_handleComponentStopped, 'new'));
  Notification.on(BlockletInternalEvents.componentRemoved, runInServer(_handleComponentRemoved, 'new'));
  Notification.on(BlockletInternalEvents.componentInstalled, runInServer(refreshBlockletContext, 'new'));
  Notification.on(BlockletInternalEvents.componentUpgraded, runInServer(refreshBlockletContext, 'new'));
  Notification.on(BlockletInternalEvents.componentUpdated, runInServer(refreshBlockletContext, 'new'));
  Notification.on(BlockletInternalEvents.componentStarted, runInServer(refreshBlockletContext, 'new'));
  Notification.on(BlockletInternalEvents.componentStopped, runInServer(refreshBlockletContext, 'new'));
  Notification.on(BlockletInternalEvents.componentRemoved, runInServer(refreshBlockletContext, 'new'));

  // Do an initial fetch
  refreshBlockletContext();
}

export {
  logger,
  setLogger,
  env,
  // @deprecated, no safe, please use getComponents
  componentStore as components,
  getComponents,
  MountPoint, // @deprecated, for backward compatibility
  TComponent,
  events,
  Events,
  getBlockletJs,
  _handleComponentUpdateOld,
  _handleAppConfigUpdate,
  _handleAppSettingUpdate,
  _handleComponentInstalled,
  _handleComponentUpdated,
  _handleComponentStarted,
  _handleComponentStopped,
  _handleComponentRemoved,
  _handleComponentConfigUpdate,
  reduceNextLoadTime,
  getBlockletSettings,
  configSettings,
};

export default {
  logger,
  setLogger,
  env,
  getComponents,
  // @deprecated, no safe, please use getComponents
  get components() {
    return getComponents();
  },
  events,
  Events,
  fetchBlockletJs,
  getBlockletJs,
  getBlockletSettings,
  reduceNextLoadTime,
  configSettings,
};
