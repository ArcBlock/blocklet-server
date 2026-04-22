/* eslint-disable prettier/prettier */
/* eslint-disable no-await-in-loop */
import semver from 'semver';
import { LRUCache } from 'lru-cache';
import { isValid as isValidDid } from '@arcblock/did';
import { BlockletGroup, STATIC_SERVER_ENGINE_DID } from '@blocklet/constant';
import { findWebInterface, hasStartEngine } from '@blocklet/meta/lib/util';
import { titleSchema, descriptionSchema } from '@blocklet/meta/lib/schema';
import { validateMeta, fixAndValidateService } from '@blocklet/meta/lib/validate';
import { getSourceUrlsFromConfig, getBlockletMetaFromUrls, getBlockletMetaFromUrl } from '@blocklet/meta/lib/util-meta';
import { toBlockletDid } from '@blocklet/meta/lib/did';
import { getBlockletEngine } from '@blocklet/meta/lib/engine';
import { urlPathFriendly } from '@blocklet/meta/lib/url-path-friendly';
import { joinURL } from 'ufo';

import type { TBlockletMeta, TEngine } from '@blocklet/meta/lib/types';
import type { TBlockletState, TComponentState, TOptionalComponentState } from '@abtnode/types';

export const isDidMatchName = (did: string, name: string): boolean => {
  if (isValidDid(did) && name === did) {
    return true;
  }

  return toBlockletDid(name) === did;
};

export const filterDuplicateComponents = (components: TComponentState[] = [], currents: TComponentState[] = []) => {
  const arr = [];

  components.forEach((component) => {
    if (currents.some((x) => x.meta.did === component.meta.did)) {
      return;
    }

    const index = arr.findIndex((x) => x.meta.did === component.meta.did);
    if (index > -1) {
      const exist = arr[index];

      // Select the minimum version: if com1 declares 1.0.0 (resolves to 1.0.0) and com2 declares latest (resolves to 2.0.0), choose the minimum (1.0.0)
      if (semver.lt(component.meta.version, exist.meta.version)) {
        arr.splice(index, 1, component);
      }
    } else {
      arr.push(component);
    }
  });

  return arr;
};

/**
 * set bundleDid and bundleMeta in meta
 * update name and did to server index
 * in app structure 2.0, application's bundleDid, bundleName, meta, did will be same
 */
export const ensureMeta = (meta: TBlockletMeta, { name, did }: { name?: string; did?: string } = {}): TBlockletMeta => {
  if (name && did && !isDidMatchName(did, name)) {
    throw new Error(`name does not match with did: ${name}, ${did}`);
  }

  const newMeta = {
    ...meta,
  };

  if (!newMeta.did || !newMeta.name || !isDidMatchName(newMeta.did, newMeta.name)) {
    throw new Error(`name does not match with did in meta: ${newMeta.name}, ${newMeta.did}`);
  }

  if (!meta.bundleDid) {
    newMeta.bundleDid = meta.did;
    newMeta.bundleName = meta.name;
  }

  if (name) {
    newMeta.name = name;
    newMeta.did = did || toBlockletDid(name);
  }

  return newMeta;
};

export const validateBlockletMeta = (meta: TBlockletMeta, opts = {}): TBlockletMeta => {
  fixAndValidateService(meta);
  return validateMeta(meta, { ensureName: true, skipValidateDidName: true, schemaOptions: { ...opts } });
};

export const getComponentConfig = (meta: TBlockletMeta & { children: any[] }): any[] => {
  const components = meta.components || meta.children || [];

  // treat engine as component
  const engine: TEngine = getBlockletEngine(meta);
  if (engine?.interpreter === 'blocklet') {
    // @ts-ignore Static server is now part of the built-in engines
    if (engine.source?.name !== STATIC_SERVER_ENGINE_DID) {
      components.push({ source: engine.source, required: true });
    }
  }
  return components;
};

/**
 * This function has side effect to component (will set component.children: [] )
 * This function has side effect to dynamicComponents (will push dynamicComponent in dynamicComponents)
 */
type ParsedComponent = TComponentState & { dependencies?: any[] };
type ParamComponent = Pick<ParsedComponent, 'meta' | 'mountPoint' | 'bundleSource' | 'dependencies' | 'children'>;
export const parseComponents = async (
  component: ParamComponent,
  context: {
    ancestors?: TBlockletState[];
    dynamicComponents?: TComponentState[];
    continueOnError?: Boolean;
    didKey?: string;
  } = {},
  logger: Console = console,
): Promise<{ dynamicComponents: ParsedComponent[] }> => {
  const { ancestors = [], dynamicComponents = [], didKey = 'bundleDid' } = context;
  if (ancestors.length > 40) {
    throw new Error('The depth of component should not exceed 40');
  }

  // @ts-ignore
  const configs = getComponentConfig(component.meta) || [];

  if (!configs || !configs.length) {
    return {
      dynamicComponents,
    };
  }

  const promises = configs.map(async (config) => {
    const urls = getSourceUrlsFromConfig(config);

    let rawMeta;
    try {
      rawMeta = await getBlockletMetaFromUrls(urls, { logger });
    } catch (error) {
      throw new Error(`Failed get component meta. Component: ${urls.join(', ')}, reason: ${error.message}`);
    }

    if (rawMeta.group === BlockletGroup.gateway) {
      throw new Error(`Cannot add gateway component ${rawMeta.title || rawMeta.did}`);
    }

    validateBlockletMeta(rawMeta, { ensureDist: true });

    if (!rawMeta?.docker?.image && hasStartEngine(rawMeta) && !findWebInterface(rawMeta)) {
      throw new Error(`Web interface does not found in component ${rawMeta.title || rawMeta.name}`);
    }

    const meta = ensureMeta(rawMeta);

    // check circular dependencies
    if (ancestors.map((x) => x.meta?.[didKey]).indexOf(meta[didKey]) > -1) {
      throw new Error(`Blocklet components have circular dependencies: ${meta[didKey]}`);
    }

    if (config.title) {
      meta.title = config.title;
      meta.title = await titleSchema.validateAsync(config.title);
    }

    if (config.description) {
      meta.description = await descriptionSchema.validateAsync(config.description);
    }

    const mountPoint = config.mountPoint || `/${urlPathFriendly(meta.title || meta.name || meta.did)}`.toLowerCase();

    const child = {
      mountPoint,
      meta,
      bundleSource: config.source,
      dependencies: [],
      children: [],
    };

    // @ts-ignore
    dynamicComponents.push(child);
    component.dependencies = component.dependencies || [];
    component.dependencies.push({
      did: child.meta[didKey],
      required: !!config.required,
      version: config.source.version || 'latest',
    });

    // parse engine components recursively
    const engine = getBlockletEngine(meta);
    if (engine?.interpreter === 'blocklet') {
      // @ts-ignore Static server is now part of the built-in engines
      if (engine.source?.name !== STATIC_SERVER_ENGINE_DID) {
        await parseComponents(
          {
            // @ts-ignore
            meta: { components: [{ source: engine.source, required: true }] },
            dependencies: [],
            children: [],
          },
          { ancestors: [...ancestors, { meta }], dynamicComponents, continueOnError: context?.continueOnError },
        );
      }
    }

    // @ts-ignore
    await parseComponents(child, {
      ancestors: [...ancestors, { meta }],
      dynamicComponents,
      continueOnError: context?.continueOnError,
    });
  });

  if (context?.continueOnError) {
    await Promise.allSettled(promises);
  } else {
    await Promise.all(promises);
  }

  return {
    dynamicComponents,
  };
};

export const parseBlocklet = async (url: string): Promise<TComponentState[]> => {
  const meta = await getBlockletMetaFromUrl(url);
  const newChildMeta = ensureMeta(meta);

  // children
  const newChild: TComponentState = {
    // @ts-ignore
    meta: newChildMeta,
    mountPoint: '/',
    bundleSource: { url },
  };

  const { dynamicComponents } = await parseComponents(newChild);
  dynamicComponents.unshift(newChild);

  return dynamicComponents;
};

export const filterRequiredComponents = (component: ParamComponent, children: TBlockletState[]): TBlockletState[] => {
  const requiredComponents = (component.meta?.components || []).filter((v) => v.required);
  const requiredNameList = [
    ...requiredComponents.map((v) => v.name),
    ...requiredComponents.map((v) => (v as { source?: { name: string } }).source?.name),
  ];
  const requiredNames = new Set(requiredNameList);

  requiredNames.add(component.meta.name);

  return children.filter((child) => requiredNames.has(child.meta.name));
};

const dynamicComponentsCache = new LRUCache<string, TComponentState[]>({ max: 300, ttl: 60 * 60 * 1000 * 3 }); // 3 hours

const getComponentName = (component: { name: string; source?: { name: string } }) => {
  return component.source?.name || component.name;
};

export const parseOptionalComponents = async (
  blocklet: TBlockletState,
  logger = console,
): Promise<TOptionalComponentState[]> => {
  const { children } = blocklet || {};
  if (!children || !children.length) {
    return [];
  }

  const optionalComponents = [] as TOptionalComponentState[];
  const childrenNames = new Set(children.map((v) => v.meta.name));
  const hasOptionalChildren = new Set();
  const optionalNames = new Set();
  const appendNames = new Set();
  const dependenciesMap = {};

  children.forEach((child) => {
    child.meta.components?.forEach((component) => {
      const name = getComponentName(component);
      if (!childrenNames.has(name)) {
        hasOptionalChildren.add(child.meta.did);
        optionalNames.add(name);
        if (!dependenciesMap[name]) {
          dependenciesMap[name] = [];
        }
        dependenciesMap[name].push({
          parentDid: child.meta.did,
          parentName: child.meta.name,
          parentTitle: child.meta.title,
          required: !!component.required,
          mountPoint: !!component.mountPoint,
        });
      }
    });
  });

  for (const child of children) {
    if (!child.meta || !hasOptionalChildren.has(child.meta.did)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const hasNotFetchChild = child.meta.components.find((component) => {
      const name = getComponentName(component);
      return !childrenNames.has(name) && !appendNames.has(name);
    });

    if (!hasNotFetchChild) {
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      let dynamicComponents =
        blocklet.meta?.did === child.meta.did ? blocklet : dynamicComponentsCache.get(child.meta.did);
      if (!dynamicComponents) {
        const components = await parseComponents(child);
        dynamicComponents = components.dynamicComponents;
        dynamicComponentsCache.set(child.meta.did, dynamicComponents);
      }
      // @ts-ignore
      for (const component of dynamicComponents) {
        const { mountPoint, bundleSource, meta } = component;
        if (
          (optionalNames.has(meta.name) || optionalNames.has(meta.did)) === false ||
          appendNames.has(meta.did) ||
          appendNames.has(meta.name)
        ) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const optionalChild = {
          logoUrl: joinURL(bundleSource.store, 'assets', meta.did, `${meta.logo || 'logo.png'}?v=${meta.version}`),
          dependencies: dependenciesMap[meta.name] || [],
          mountPoint,
          bundleSource,
          meta,
        };
        appendNames.add(optionalChild.meta.name);
        appendNames.add(optionalChild.meta.did);
        optionalComponents.push(optionalChild);
      }
    } catch (err) {
      // FIXME: Some errors from parseComponents are expected; this should not throw
      logger.warn(`Can not parse optional child: ${child.meta.name}, error:`, err);
    }
  }

  return optionalComponents;
};
