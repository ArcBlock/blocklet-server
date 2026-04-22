import os from 'os';
import { BlockletGroup, BLOCKLET_INTERFACE_TYPE_WEB, STATIC_SERVER_ENGINE_DID } from '@blocklet/constant';

import { TEngine, TBlockletMeta } from './types';

/**
 * get blocklet engine info by platform
 * @param {object} meta blocklet meta
 */
export const getBlockletEngine = (meta: any): TEngine => {
  if (meta === undefined) {
    throw new Error('blocklet meta param is required');
  }
  const { engine } = meta;

  // if no engine info, use node as default
  if (!engine) {
    return { interpreter: 'node', source: '' };
  }

  // if engine is not an array, return it directly
  if (!Array.isArray(engine)) {
    return engine;
  }

  // find engine by platform
  const platform = os.platform();
  const match = engine.find((r) => r.platform === platform);
  if (!match) {
    throw new Error(`can not find a proper engine interpreter on ${platform}`);
  }
  return match;
};

export const canReceiveMessages = (meta: TBlockletMeta): boolean => {
  const engine = getBlockletEngine(meta);
  return ['bun', 'node'].includes(engine.interpreter);
};

export const isGatewayBlocklet = (meta: TBlockletMeta): boolean => meta?.group === BlockletGroup.gateway;
export const isPackBlocklet = (meta: TBlockletMeta): boolean => meta?.group === BlockletGroup.pack;

/**
 * Check if the engine is the built-in static-server engine
 * Static server engine is built into blocklet-service, so it doesn't need a separate process
 */
export const isStaticServerEngine = (engine: TEngine): boolean =>
  engine?.interpreter === 'blocklet' && (engine.source as any)?.name === STATIC_SERVER_ENGINE_DID;

export const hasStartEngine = (meta: any): boolean => {
  if (meta?.group === BlockletGroup.static) {
    return false;
  }
  const engine = getBlockletEngine((meta || {}) as any);
  if (engine.interpreter === 'blocklet') {
    // static-server engine is built into blocklet-service, treat as no engine
    return !isStaticServerEngine(engine);
  }
  if (meta?.main || meta?.docker?.image) {
    return true;
  }
  return false;
};

const hasStartEngineAndNotDocker = (meta: any): boolean => {
  if (meta?.group === BlockletGroup.static) {
    return false;
  }
  const engine = getBlockletEngine(meta || {});
  if (engine.interpreter === 'blocklet') {
    // static-server engine is built into blocklet-service, treat as no engine
    return !isStaticServerEngine(engine);
  }
  if (meta?.main) {
    return true;
  }
  return false;
};

export const hasMountPoint = (meta: TBlockletMeta): boolean => {
  const hasWebInterface = (meta?.interfaces || []).some((x) => x.type === BLOCKLET_INTERFACE_TYPE_WEB);
  return (hasStartEngineAndNotDocker(meta) || hasWebInterface) && isGatewayBlocklet(meta) === false;
};
