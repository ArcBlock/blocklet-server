/* eslint-disable no-await-in-loop */
import get from 'lodash/get';
import uniq from 'lodash/uniq';
import { joinURL } from 'ufo';
import pLimit from 'p-limit';
// @ts-ignore
import { SLOT_FOR_IP_DNS_SITE } from '@abtnode/constant';
// eslint-disable-next-line import/no-extraneous-dependencies
import type { BlockletState, ComponentState } from '@blocklet/server-js';
// eslint-disable-next-line import/no-extraneous-dependencies
import type { Request } from 'express';
import {
  BlockletGroup,
  BlockletStatus,
  fromBlockletStatus,
  fromBlockletSource,
  BLOCKLET_INTERFACE_TYPE_WEB,
  BLOCKLET_CONFIGURABLE_KEY,
  CHAIN_INFO_CONFIG,
  CHAIN_PROP_MAP,
  BLOCKLET_PREFERENCE_PREFIX,
  BLOCKLET_INTERFACE_TYPE_SERVICE,
  BLOCKLET_INTERFACE_TYPE_DOCKER,
} from '@blocklet/constant';
import { hasMountPoint, hasStartEngine, isGatewayBlocklet, isPackBlocklet } from './engine';
import type { TBlockletMeta, TEnvironment } from './types';

type TConfig = TEnvironment & { key: string };

type TApp = BlockletState;
type TComponent = BlockletState | ComponentState;
type TComponentPro = TComponent & { configObj?: Record<string, string>; environmentObj?: Record<string, string> };

const getComponentId = (
  component?: { meta?: { did?: string } },
  ancestors: Array<{ meta?: { did?: string } }> = []
): string =>
  `${ancestors.map((x) => (x && x.meta ? x.meta.did : '')).join('/')}${ancestors.length ? '/' : ''}${
    component && component.meta ? component.meta.did : ''
  }`;

const getComponentName = (
  component?: { meta?: { name?: string } },
  ancestors: Array<{ meta?: { name?: string } }> = []
): string =>
  `${ancestors.map((x) => (x && x.meta ? x.meta.name : '')).join('/')}${ancestors.length ? '/' : ''}${
    component && component.meta ? component.meta.name : ''
  }`;

const getComponentBundleId = (component: { meta: { bundleName: string; version: string } }): string =>
  `${component.meta.bundleName}@${component.meta.version}`;

/**
 * a => ''
 * @a/b => ''
 * a/b => a
 * @a/b/c => @a/b
 * a/@b/c => a
 * @a/b/@c/d => @a/b
 * @a/b/@c/d/e => @a/b/@c/d
 * @a/b/@c/d/@e/f => @a/b/@c/d
 */
const getParentComponentName = (name?: string): string => {
  if (!name) {
    return '';
  }
  const arr = name.split('/');

  arr.pop();
  if (!arr.length) {
    return '';
  }
  if (arr[arr.length - 1].startsWith('@')) {
    arr.pop();
  }
  if (!arr.length) {
    return '';
  }
  return arr.join('/');
};

const forEachBlocklet = (
  blocklet: TComponentPro,
  cb: Function,
  {
    parallel = false,
    concurrencyLimit = 5,
    sync,
    params: inputParams,
    _parent,
    _root,
    _level = 0,
    _tasks: inputTasks,
    _ancestors = [],
    _limit,
  }: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
    params?: any;
    _parent?: any;
    _root?: any;
    _level?: number;
    _tasks?: any;
    _ancestors?: any[];
    _limit?: (fn: () => void) => void;
  } = {}
) => {
  const root = _root || _parent || blocklet;

  // id maybe meaningless if no meta in blocklet or _ancestors
  const id = getComponentId(blocklet, _ancestors);

  const newAncestors = _ancestors.concat(blocklet);

  // sync
  if (sync) {
    const params = cb(blocklet, {
      parent: _parent,
      root,
      level: _level,
      params: inputParams,
      ancestors: _ancestors,
      id,
    });

    if (blocklet.children) {
      for (const child of blocklet.children) {
        forEachBlocklet(child, cb, {
          sync,
          params,
          _parent: blocklet,
          _root: root,
          _level: _level + 1,
          _ancestors: newAncestors,
        });
      }
    }
    return null;
  }
  // serial
  if (!parallel) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        const params = await cb(blocklet, {
          parent: _parent,
          root,
          level: _level,
          ancestors: _ancestors,
          params: inputParams,
          id,
        });

        if (blocklet.children) {
          for (const child of blocklet.children) {
            await forEachBlocklet(child, cb, {
              params,
              _parent: blocklet,
              _root: root,
              _level: _level + 1,
              _ancestors: newAncestors,
            });
          }
        }
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  }

  // parallel
  const limit = _limit || pLimit(concurrencyLimit);

  const tasks = inputTasks || [];

  tasks.push(limit(() => cb(blocklet, { parent: _parent, root, level: _level, ancestors: _ancestors, id })));
  if (blocklet.children) {
    for (const child of blocklet.children) {
      forEachBlocklet(child, cb, {
        parallel,
        _parent: blocklet,
        _root: root,
        _level: _level + 1,
        _tasks: tasks,
        _ancestors: newAncestors,
        _limit: limit,
      });
    }
  }
  if (inputTasks) {
    return null;
  }
  return Promise.all(tasks);
};

const forEachBlockletSync = (blocklet: any, cb: Function) => forEachBlocklet(blocklet, cb, { sync: true });

const forEachComponentV2 = (
  blocklet: TApp,
  cb: Function,
  {
    parallel = false,
    concurrencyLimit = 5,
    sync,
  }: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
  } = {}
) => {
  // sync
  if (sync) {
    if (blocklet.children) {
      for (const child of blocklet.children) {
        cb(child);
      }
    }
    return null;
  }

  // serial
  if (!parallel) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        if (blocklet.children) {
          for (const child of blocklet.children) {
            await cb(child);
          }
        }
        resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  }

  // parallel
  const limit = pLimit(concurrencyLimit);

  const tasks = [];

  if (blocklet.children) {
    for (const child of blocklet.children) {
      tasks.push(limit(() => cb(child)));
    }
  }

  return Promise.all(tasks);
};

const forEachComponentV2Sync = (blocklet: any, cb: Function) => forEachComponentV2(blocklet, cb, { sync: true });

const forEachChild = (blocklet: any, cb: Function, params?: any): Promise<any> => {
  return forEachBlocklet(
    blocklet,
    (b: any, opt: any) => {
      if (opt.level === 0) {
        return {};
      }
      return cb(b, opt);
    },
    params
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const forEachChildSync = (blocklet: BlockletState, cb: Function) => forEachChild(blocklet, cb, { sync: true });

const findComponent = (
  blocklet: TComponent,
  isEqualFn: (component: TComponent, context: { ancestors: Array<TComponent> }) => boolean,
  {
    _ancestors = [],
    returnAncestors = false,
  }: {
    _ancestors?: Array<TComponent>;
    returnAncestors?: boolean;
  } = {}
): TComponent | { component: TComponent; ancestors: Array<TComponent> } => {
  if (!isEqualFn) {
    return null;
  }

  if (isEqualFn(blocklet, { ancestors: _ancestors })) {
    if (returnAncestors) {
      return {
        component: blocklet,
        ancestors: _ancestors,
      };
    }
    return blocklet;
  }

  for (const child of blocklet.children || []) {
    const ancestors = _ancestors.concat(blocklet);

    const component = findComponent(child, isEqualFn, { _ancestors: ancestors, returnAncestors });

    if (component) {
      return component;
    }
  }

  return null;
};

const findComponentById = (
  blocklet: TComponent,
  componentId: string | Array<string>,
  {
    returnAncestors = false,
  }: {
    returnAncestors?: boolean;
  } = {}
) => {
  if (Array.isArray(componentId)) {
    // eslint-disable-next-line no-param-reassign
    componentId = componentId.join('/');
  }

  return findComponent(
    blocklet,
    (component, { ancestors }) => {
      const id = getComponentId(component, ancestors);
      return componentId === id;
    },
    { returnAncestors }
  );
};

const findComponentV2 = (app: TApp, isEqualFn: (component: TComponent, app: TApp) => boolean) => {
  if (!isEqualFn) {
    return null;
  }

  for (const child of app.children || []) {
    if (isEqualFn(child, app)) {
      return child;
    }
  }

  return null;
};

const findComponentByIdV2 = (app: TApp, componentId: string | Array<string>) => {
  if (!componentId) {
    return null;
  }

  if (Array.isArray(componentId)) {
    // eslint-disable-next-line no-param-reassign
    componentId = componentId.join('/');
  }

  return findComponentV2(app, (component, _app) => {
    if (componentId.includes('/')) {
      const id = getComponentId(component, [_app]);
      return componentId === id;
    }

    return componentId === component.meta.did;
  });
};

const filterComponentsV2 = (app: TApp, isEqualFn: (component: TComponent, app: TApp) => boolean) => {
  if (!isEqualFn) {
    return [];
  }

  const list = [];

  for (const child of app.children || []) {
    if (isEqualFn(child, app)) {
      list.push(child);
    }
  }

  return list;
};

const isEnvShareableToClient = (env?: TConfig): boolean => {
  return (
    !!env &&
    !!(env.key || env.name) &&
    !env.secure &&
    env.shared !== false &&
    !BLOCKLET_CONFIGURABLE_KEY[env.key || env.name]
  );
};

/**
 * is env shareable between components
 */
const isEnvShareable = (env?: Partial<TConfig>, includeSecure: boolean = false): boolean => {
  return (
    !!env &&
    !!(env.key || env.name) &&
    !!env.shared &&
    !BLOCKLET_CONFIGURABLE_KEY[env.key || env.name] &&
    (includeSecure ? true : !env.secure)
  );
};

const isPreferenceKey = (x: Partial<TConfig>): Boolean => x.key.startsWith(BLOCKLET_PREFERENCE_PREFIX) === true;

const getSharedConfigObj = (app?: TComponentPro, component?: TComponentPro, includeSecure: boolean = false): any => {
  const res = {};

  if (!app || !component) {
    return res;
  }

  if (Array.isArray(app.configs)) {
    app.configs.forEach(({ key, value: value0, secure }) => {
      if (isPreferenceKey({ key })) {
        return;
      }

      // config in container is force shared to components
      if (!isEnvShareable({ key, secure, shared: true }, includeSecure)) {
        return;
      }

      const value = (app.configObj || {})[key] || value0;
      const config = (component.configs || []).find((x) => x.key === key);
      if (
        !config || // component does not have this config
        isEnvShareable(config, includeSecure) || // component config is shareable
        (!config.value && !(component.configObj || {})[config.key]) // component config is empty
      ) {
        res[key] = value;
      }
    });
  }

  if (Array.isArray(app.children)) {
    app.children
      .filter((x) => x.meta?.did !== component.meta?.did)
      .forEach((child) => {
        (child.configs || [])
          .filter((x) => isEnvShareable(x, includeSecure)) // only share shareable configs
          .filter((x) => !(app.configs || []).find((y) => y.key === x.key)) // only share configs that app does not have
          .forEach(({ key, value }) => {
            const config = (component.configs || []).find((x) => x.key === key);
            if (
              !config || // component does not have this config
              (!config.value && !(component.configObj || {})[config.key]) // component config is empty
            ) {
              res[key] = value;
            }
          });
      });
  }

  // share blocklet app chain config
  (app.configs || []).forEach(({ key, value }) => {
    if (
      ![
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_HOST,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_ID,
        BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_CHAIN_TYPE,
      ].includes(key)
    ) {
      return;
    }

    res[CHAIN_PROP_MAP[key]] = value;
  });

  return res;
};

const isConfigMissing = (item, sharedConfigObj) => {
  if (item.required) {
    if (
      // if the value and the shared value are both empty
      (!item.value && !sharedConfigObj[item.key]) ||
      // if CHAIN_HOST, CHAIN_ID, CHAIN_TYPE in sharedConfigObj and the shared value is empty
      (Object.values(CHAIN_PROP_MAP).includes(item.key) &&
        Object.keys(sharedConfigObj).includes(item.key) &&
        !sharedConfigObj[item.key])
    ) {
      return true;
    }
  }

  return false;
};

const getAppMissingConfigs = (app: any = {}): any[] => {
  const missingConfigs = [];

  forEachComponentV2Sync(app, (b) => {
    if (b.meta?.group === BlockletGroup.gateway) {
      return;
    }

    const configs = b.configs || [];

    const sharedConfigObj = getSharedConfigObj(app, b);

    configs.forEach((item) => {
      if (isConfigMissing(item, sharedConfigObj)) {
        missingConfigs.push({ did: b.meta.did, key: item.key, description: item.description });
      }
    });
  });
  return missingConfigs.filter((x) => !isPreferenceKey(x));
};

const getComponentMissingConfigs = (component: any = {}, app: any = {}) => {
  const missingConfigs = [];

  const configs = (component as any).configs || [];

  const sharedConfigObj = getSharedConfigObj(app, component);

  configs.forEach((item) => {
    if (isConfigMissing(item, sharedConfigObj)) {
      missingConfigs.push({ did: (component as any).meta.did, key: item.key, description: item.description });
    }
  });
  return missingConfigs;
};

const isFreeBlocklet = (meta: TBlockletMeta): boolean => {
  if (!meta.payment) {
    return true;
  }
  const priceList = (meta.payment.price || []).map((x) => x.value || 0);

  return priceList.every((x) => x === 0);
};

const isFreeComponent = (meta: TBlockletMeta): boolean => {
  if (!meta.payment) {
    return true;
  }
  if (!meta.payment.componentPrice) {
    return true;
  }
  return !meta.payment.componentPrice.length;
};

const wipeSensitiveData = (blocklet?: BlockletState) => {
  if (!blocklet) {
    return blocklet;
  }

  // Only clone the fields that need to be modified
  const clone = {
    ...blocklet,
    configs: (blocklet.configs || []).map((x) => ({ ...x })),
    environments: (blocklet.environments || []).map((x) => ({ ...x })),
    migratedFrom: (blocklet.migratedFrom || []).map((x) => ({ ...x })),
    settings: blocklet.settings ? { ...blocklet.settings, session: { ...blocklet.settings.session } } : undefined,
    children: (blocklet.children || []).map((child) => ({
      ...child,
      configs: (child.configs || []).map((x) => ({ ...x })),
      environments: (child.environments || []).map((x) => ({ ...x })),
    })),
  };

  forEachBlocklet(
    clone,
    (d) => {
      if (d.configs) {
        d.configs = d.configs.filter((x) => !isPreferenceKey(x));
        d.configs.forEach((x) => {
          if (x.secure) {
            x.value = x.value ? '__encrypted__' : '';
          }
        });
      }
      (d.environments || []).forEach((x) => {
        if (['BLOCKLET_APP_SK', 'BLOCKLET_APP_PSK', 'BLOCKLET_APP_SALT'].includes(x.key)) {
          x.value = '__encrypted__';
        }
      });
      (d.migratedFrom || []).forEach((x) => {
        x.appSk = '__encrypted__';
      });
      // @ts-ignore
      delete d.configObj;
      // @ts-ignore
      delete d.environmentObj;
      // @ts-ignore
      delete d.settings?.session?.salt;
    },
    { sync: true }
  );
  return clone;
};

const isDeletableBlocklet = (blocklet?: BlockletState): boolean => {
  if (!blocklet) {
    return false;
  }
  const config = blocklet.environments.find((x) => x.key === 'BLOCKLET_DELETABLE');

  if (!config) {
    return true;
  }
  return config.value === 'yes';
};

const hasRunnableComponent = (blocklet: BlockletState): boolean => {
  let has = false;
  forEachBlockletSync(blocklet, (x) => {
    if (x.meta.group !== BlockletGroup.gateway) {
      has = true;
    }
  });
  return has;
};

/**
 * Get the display name of a blocklet
 * @param {Object} blocklet Blocklet state object
 * @param {Boolean} onlyUseMeta Whether to prefer the name from metadata only
 * @returns blocklet display name
 */
const getAppName = (blocklet: BlockletState, onlyUseMeta: boolean = false): string => {
  if (!blocklet) {
    return '';
  }
  const { meta } = blocklet;

  let name;
  if (!onlyUseMeta && blocklet.environments) {
    const target = blocklet.environments.find((e) => e.key === 'BLOCKLET_APP_NAME');

    if (target && target.value) {
      name = target.value;
    }
  }
  return name || meta.title || meta.name;
};

/**
 * Get the display description of a blocklet
 * @param {Object} blocklet Blocklet state object
 * @param {Boolean} onlyUseMeta Whether to prefer the name from metadata only
 * @returns blocklet display description
 */
const getAppDescription = (blocklet: BlockletState, onlyUseMeta: boolean = false): string => {
  if (!blocklet) {
    return '';
  }
  const { meta } = blocklet;
  let description;
  if (!onlyUseMeta && blocklet.environments) {
    const target = blocklet.environments.find((e) => e.key === 'BLOCKLET_APP_DESCRIPTION');
    if (target && target.value) {
      description = target.value;
    }
  }

  return description || meta.description || meta.name;
};

// FIXME: getAppUrl may return an incorrect value if the 888-888-888-888 domain alias appears first in the sorted list
export function getAppUrl(blocklet: BlockletState): string {
  const appUrls = blocklet?.site?.domainAliases
    ?.sort((a, b) => {
      if (a.accessibility?.accessible && b.accessibility?.accessible) {
        return +a.isProtected - +b.isProtected;
      }
      // eslint-disable-next-line no-unsafe-optional-chaining
      return +b.accessibility?.accessible - +a.accessibility?.accessible;
    })
    ?.map((domainAlias) => {
      const protocol = domainAlias?.domainStatus?.isHttps ? 'https://' : 'http://';
      const value = domainAlias?.value;

      return `${protocol}${value}`;
    })
    .filter(Boolean);

  const appUrl = appUrls?.[0];

  return appUrl;
}

const fixBlockletStatus = (blocklet?: BlockletState): void => {
  if (!blocklet) {
    return;
  }
  forEachBlockletSync(blocklet, (b) => {
    b.status = fromBlockletStatus(b.status);
    if (b.greenStatus !== undefined) {
      b.greenStatus = fromBlockletStatus(b.greenStatus);
    }
    if (b.source !== undefined) {
      b.source = fromBlockletSource(b.source);
    }
  });
  if (blocklet.settings) {
    (blocklet.settings.children || []).forEach((child) => {
      forEachBlockletSync(child, (b) => {
        b.status = fromBlockletStatus(b.status);
        if (b.source !== undefined) {
          b.source = fromBlockletSource(b.source);
        }
      });
    });
  }
};

const findWebInterface = (blocklet?: BlockletState | TBlockletMeta): any => {
  if (!blocklet) {
    return null;
  }

  // @ts-ignore
  const meta: TBlockletMeta = blocklet.meta || blocklet || {};
  const { interfaces = [] } = meta;

  if (!Array.isArray(interfaces)) {
    return null;
  }
  return interfaces.find((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
};

const findDockerInterface = (blocklet?: BlockletState | TBlockletMeta): any => {
  if (!blocklet) {
    return null;
  }

  // @ts-ignore
  const meta: TBlockletMeta = blocklet.meta || blocklet || {};
  const { interfaces = [] } = meta;

  if (!Array.isArray(interfaces)) {
    return null;
  }
  return interfaces.find((x) => x.type === BLOCKLET_INTERFACE_TYPE_DOCKER);
};

const findWebInterfacePort = (blocklet?: BlockletState): any => {
  if (!blocklet) {
    return null;
  }

  const webInterface = findWebInterface(blocklet) || findDockerInterface(blocklet);

  const { ports, greenPorts } = blocklet as any;

  if (!webInterface) {
    return null;
  }

  if ((blocklet as unknown as ComponentState).greenStatus === BlockletStatus.running) {
    if (!greenPorts) {
      return null;
    }
    return greenPorts[webInterface.port];
  }

  if (!ports) {
    return null;
  }
  return ports[webInterface.port];
};

const findServiceFromMeta = (meta?: TBlockletMeta, ServiceName?: string): any => {
  const names = [ServiceName];

  const webInterface = findWebInterface(meta);

  if (!webInterface) {
    return null;
  }
  return (webInterface.services || []).find((x) => names.includes(x.name));
};

const getConnectAppUrl = ({ request, baseUrl }: { request: Partial<Request>; baseUrl: string }): string => {
  const blockletDid = request.headers['x-blocklet-did'] || '';

  const blockletRealDid = request.headers['x-blocklet-real-did'] || '';

  const pathPrefix = <string>request.headers['x-path-prefix'] || '/';

  const groupPathPrefix = <string>request.headers['x-group-path-prefix'] || '/';

  // Child blocklets should set appInfo.link to exactly the same path as the root blocklet
  let appUrl = baseUrl;
  if (blockletDid !== blockletRealDid && pathPrefix !== groupPathPrefix) {
    appUrl = joinURL(appUrl, '/').replace(pathPrefix, groupPathPrefix);
  }
  return appUrl;
};

const replaceSlotToIp = (url?: string, ip?: string): string => {
  const separator = (ip || '').includes(':') ? ':' : /\./; // ip v6 or v4
  return (url || '').replace(SLOT_FOR_IP_DNS_SITE, (ip || '').replace(new RegExp(separator, 'g'), '-'));
};

type ChainInfo = { type: 'arcblock' | 'ethereum' | 'solona'; id: string; host: string };
const getChainInfo = (env: Record<string, string>): ChainInfo => {
  // @ts-ignore
  const result: ChainInfo = Object.entries(CHAIN_INFO_CONFIG).reduce((info, x: [string, string[]]) => {
    const [envName, [key, value]] = x;
    info[key] = get(env, envName) || value;
    return info;
  }, {});

  if (result.type === 'ethereum' && result.id === 'none') {
    result.id = '1';
  }

  return result;
};

const getBlockletChainInfo = (blocklet?: TComponentPro): ChainInfo => {
  const emptyInfo = getChainInfo({});
  if (!blocklet) {
    return emptyInfo;
  }

  const chainInfoInRoot = getChainInfo(blocklet.configObj);
  if (chainInfoInRoot.host !== 'none') {
    return chainInfoInRoot;
  }

  let chainInfoInChild;
  forEachChildSync(blocklet as any, (b) => {
    if (chainInfoInChild && chainInfoInChild.host !== 'none') {
      return;
    }

    const chainInfo = getChainInfo(b.configObj);
    if (chainInfo.host !== 'none') {
      chainInfoInChild = chainInfo;
    }
  });

  return chainInfoInChild || emptyInfo;
};

const isExternalBlocklet = (blocklet?: BlockletState): boolean => !!blocklet?.controller;

const getBlockletAppIdList = (blocklet: Partial<BlockletState>): string[] => {
  const migratedFrom = Array.isArray(blocklet.migratedFrom) ? blocklet.migratedFrom.map((x) => x.appDid) : [];
  return uniq([blocklet.appDid, blocklet.appPid, ...migratedFrom].filter(Boolean));
};

const getBlockletServices = (
  blocklet: Partial<BlockletState>
): Array<{
  name: string;
  protocol: string;
  port: number;
  upstreamPort: number;
}> => {
  const services = [];

  if (!blocklet) {
    return services;
  }

  forEachBlockletSync(blocklet, (component) => {
    const interfaces = (component.meta?.interfaces || []).filter((x) => x.type === BLOCKLET_INTERFACE_TYPE_SERVICE);

    interfaces.forEach((x) => {
      const port = (x.port || {}) as { external: number; internal: number };
      services.push({
        name: x.name,
        protocol: x.protocol,
        port: Number(port.external),
        upstreamPort: Number(
          (component[component.greenStatus === BlockletStatus.running ? 'greenPorts' : 'ports'] || {})[port.internal]
        ),
      });
    });
  });

  return services;
};
const isInProgress = (status: string | number): boolean =>
  (
    [
      BlockletStatus.downloading,
      BlockletStatus.waiting,
      BlockletStatus.starting,
      BlockletStatus.installing,
      BlockletStatus.stopping,
      BlockletStatus.upgrading,
      'downloading',
      'waiting',
      'starting',
      'installing',
      'extracting',
      'stopping',
      'upgrading',
      'restarting',
      'deleting',
    ] as Array<string | number>
  ).includes(status);

const inProgressStatuses = [
  BlockletStatus.stopping,
  BlockletStatus.installing,
  BlockletStatus.downloading,
  BlockletStatus.restarting,
  BlockletStatus.starting,
  BlockletStatus.waiting,
  BlockletStatus.upgrading,
];

const isBeforeInstalled = (status: string | number): boolean =>
  (
    [
      BlockletStatus.added,
      BlockletStatus.waiting,
      BlockletStatus.downloading,
      BlockletStatus.installing,
      'added',
      'waiting',
      'downloading',
      'installing',
    ] as Array<string | number>
  ).includes(status);

const isRunning = (status: string | number): boolean =>
  ([BlockletStatus.running, 'running'] as Array<string | number>).includes(status);

const isAccessible = (status: string | number): boolean =>
  (
    [
      BlockletStatus.running,
      BlockletStatus.waiting,
      BlockletStatus.downloading,
      'running',
      'waiting',
      'downloading',
    ] as Array<string | number>
  ).includes(status);

const hasResourceType = (
  component: ComponentState,
  { type, did }: { type: string; did: string } = { type: '', did: '' }
): boolean => {
  if (!component) {
    return false;
  }

  return (
    !hasStartEngine(component.meta) &&
    component.meta?.resource?.bundles?.length > 0 &&
    (component.meta.resource.bundles || []).some((y) => y.type === type && y.did === did)
  );
};

const getMountPoints = (blocklet) => {
  const mountPoints = [];
  forEachBlockletSync(blocklet, (component, { level, params: children }) => {
    if (hasMountPoint(component.meta) === false) {
      return null;
    }

    const list = level > 1 ? children : mountPoints;

    if (!list) {
      return null;
    }

    const arr = [];
    list.push({
      title: component.meta?.title || '',
      name: component.meta?.bundleName || '',
      did: component.meta?.bundleDid || '',
      version: component.meta?.version || '',
      status:
        fromBlockletStatus(component.greenStatus) === 'running' ? 'running' : fromBlockletStatus(component.status),
      mountPoint: joinURL('/', component.mountPoint || ''),
      components: arr,
      capabilities: component.meta?.capabilities || {},
    });

    return arr;
  });

  return mountPoints;
};

const checkPublicAccess = (securityConfig) => {
  if (!securityConfig) {
    return true;
  }
  const accessRoles = securityConfig?.accessPolicy?.roles ?? null;
  const accessReverse = securityConfig?.accessPolicy?.reverse ?? false;

  if (accessRoles === null && accessReverse === false) {
    return true;
  }

  return false;
};

const nanoid = (length = 16) => [...Array(length)].map(() => Math.random().toString(36)[2]).join('');

function isBlockletRunning(blocklet: { status: string; greenStatus?: string }) {
  if (!blocklet) {
    return false;
  }

  return blocklet.status === 'running' || blocklet.greenStatus === 'running';
}

export {
  isFreeBlocklet,
  isFreeComponent,
  isBlockletRunning,
  forEachBlocklet,
  forEachBlockletSync,
  forEachChild,
  forEachChildSync,
  forEachComponentV2,
  forEachComponentV2Sync,
  isDeletableBlocklet,
  getSharedConfigObj,
  getAppMissingConfigs,
  getComponentMissingConfigs,
  isEnvShareableToClient,
  isEnvShareable,
  wipeSensitiveData,
  hasRunnableComponent,
  getAppName,
  getAppName as getDisplayName,
  getAppDescription,
  fixBlockletStatus,
  findWebInterface,
  findWebInterfacePort,
  findDockerInterface,
  findServiceFromMeta,
  checkPublicAccess,
  replaceSlotToIp,
  getComponentId,
  getComponentName,
  getComponentBundleId,
  findComponent,
  findComponentById,
  findComponentV2,
  findComponentByIdV2,
  filterComponentsV2,
  getParentComponentName,
  getConnectAppUrl,
  getChainInfo,
  getBlockletChainInfo,
  isExternalBlocklet,
  isPreferenceKey,
  getBlockletAppIdList,
  getBlockletServices,
  isInProgress,
  inProgressStatuses,
  isBeforeInstalled,
  isRunning,
  isAccessible,
  isGatewayBlocklet,
  isPackBlocklet,
  hasStartEngine,
  hasResourceType,
  getMountPoints,
  nanoid,
};

export default {
  isFreeBlocklet,
  isFreeComponent,
  isBlockletRunning,
  forEachBlocklet,
  forEachBlockletSync,
  forEachChild,
  forEachChildSync,
  forEachComponentV2,
  forEachComponentV2Sync,
  isDeletableBlocklet,
  getSharedConfigObj,
  getAppMissingConfigs,
  getComponentMissingConfigs,
  isEnvShareableToClient,
  isEnvShareable,
  wipeSensitiveData,
  hasRunnableComponent,
  getAppName,
  getAppDescription,
  getAppUrl,
  getDisplayName: getAppName,
  fixBlockletStatus,
  findWebInterface,
  findWebInterfacePort,
  findDockerInterface,
  findServiceFromMeta,
  checkPublicAccess,
  replaceSlotToIp,
  getComponentId,
  getComponentName,
  getComponentBundleId,
  findComponent,
  findComponentById,
  findComponentV2,
  findComponentByIdV2,
  filterComponentsV2,
  getParentComponentName,
  getConnectAppUrl,
  getChainInfo,
  getBlockletChainInfo,
  isExternalBlocklet,
  isPreferenceKey,
  getBlockletServices,
  isInProgress,
  inProgressStatuses,
  isBeforeInstalled,
  isRunning,
  isAccessible,
  isGatewayBlocklet,
  isPackBlocklet,
  hasStartEngine,
  hasResourceType,
  getMountPoints,
  nanoid,
};
