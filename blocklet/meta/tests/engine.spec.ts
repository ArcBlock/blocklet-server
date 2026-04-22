import os from 'os';
import { describe, expect, it, spyOn } from 'bun:test';
import { BlockletGroup, STATIC_SERVER_ENGINE_DID } from '@blocklet/constant';
import { getBlockletEngine, hasStartEngine, isStaticServerEngine } from '../src/index';
import { canReceiveMessages, hasMountPoint, isGatewayBlocklet, isPackBlocklet } from '../src/engine';

describe('getBlockletEngine', () => {
  it('should throw error is there no param passed to getBlockletEngine function', () => {
    expect(() => getBlockletEngine(undefined)).toThrowError(/blocklet meta param is required/);
  });
  it('should return default engine if there is no engine in blocklet meta', () => {
    expect(getBlockletEngine({})).toEqual({ interpreter: 'node', source: '' });
  });
  it('should return the engine if the engine in blocklet meta is an object', () => {
    const engine = { interpreter: 'node', source: '' };
    expect(getBlockletEngine({ engine })).toEqual(engine as any);
  });
  it('should throw error if there is platform specified engine', () => {
    const mockedPlatform = spyOn(os, 'platform').mockImplementation(() => 'linux');
    const engine = [{ interpreter: 'node', platform: 'darwin' }];
    expect(() => getBlockletEngine({ engine })).toThrowError(/can not find a proper engine interpreter on linux/);
    expect(mockedPlatform.mock.calls.length).toEqual(1);
  });
  it('should return specified engine', () => {
    const mockedPlatform = spyOn(os, 'platform').mockImplementation(() => 'linux');
    const engine = [
      { interpreter: 'node', platform: 'darwin' },
      { interpreter: 'binary', platform: 'linux' },
    ];
    expect(getBlockletEngine({ engine })).toEqual({ interpreter: 'binary', platform: 'linux' });
    expect(mockedPlatform.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('should use bun engine', () => {
    const mockedPlatform = spyOn(os, 'platform').mockImplementation(() => 'linux');
    const engine = [{ interpreter: 'bun', platform: 'linux' }];
    expect(getBlockletEngine({ engine })).toEqual({ interpreter: 'bun', platform: 'linux' });
    expect(mockedPlatform.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('isStaticServerEngine', () => {
  it('should be defined', () => {
    expect(typeof isStaticServerEngine).toEqual('function');
  });

  it('should return false for null/undefined engine', () => {
    expect(isStaticServerEngine(null as any)).toBe(false);
    expect(isStaticServerEngine(undefined as any)).toBe(false);
  });

  it('should return false for non-blocklet interpreter', () => {
    const engine = { interpreter: 'node', source: { name: STATIC_SERVER_ENGINE_DID } };
    expect(isStaticServerEngine(engine as any)).toBe(false);
  });

  it('should return false for blocklet interpreter without source', () => {
    const engine = { interpreter: 'blocklet' };
    expect(isStaticServerEngine(engine as any)).toBe(false);
  });

  it('should return false for blocklet interpreter with different engine DID', () => {
    const engine = {
      interpreter: 'blocklet',
      source: { name: 'z1someOtherEngineDid', store: 'https://store.blocklet.dev' },
    };
    expect(isStaticServerEngine(engine as any)).toBe(false);
  });

  it('should return true for blocklet interpreter with static server engine DID', () => {
    const engine = {
      interpreter: 'blocklet',
      source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
    };
    expect(isStaticServerEngine(engine as any)).toBe(true);
  });

  it('should return false for blocklet interpreter with string source', () => {
    const engine = { interpreter: 'blocklet', source: 'some-source-string' };
    expect(isStaticServerEngine(engine as any)).toBe(false);
  });
});

describe('hasStartEngine', () => {
  it('should be defined', () => {
    expect(typeof hasStartEngine).toEqual('function');
  });

  it('should return true if meta.main is truthy', () => {
    const meta: any = { main: 'main' };
    expect(hasStartEngine(meta)).toBe(true);
  });

  it('should return true if meta.docker.image is truthy', () => {
    const meta: any = { docker: { image: 'some-image' } };
    expect(hasStartEngine(meta)).toBe(true);
  });

  it('should return true if interpreter is blocklet with non-static-server engine', () => {
    const meta: any = {
      engine: {
        interpreter: 'blocklet',
        source: { name: 'z1someOtherEngineDid', store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasStartEngine(meta)).toBe(true);
  });

  it('should return false if interpreter is blocklet with static server engine', () => {
    const meta: any = {
      engine: {
        interpreter: 'blocklet',
        source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false if meta.main is falsy and interpreter is not blocklet', () => {
    const meta: any = { engine: { interpreter: 'binary' } };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false for node interpreter without main', () => {
    const meta: any = { engine: { interpreter: 'node' } };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false for main with static server engine (blocklet interpreter takes precedence)', () => {
    const meta: any = {
      main: 'index.js',
      engine: {
        interpreter: 'blocklet',
        source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false for docker.image with static server engine (blocklet interpreter takes precedence)', () => {
    const meta: any = {
      docker: { image: 'some-image' },
      engine: {
        interpreter: 'blocklet',
        source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false for static group blocklet', () => {
    const meta: any = { group: BlockletGroup.static, main: 'index.js' };
    expect(hasStartEngine(meta)).toBe(false);
  });

  it('should return false for undefined meta', () => {
    expect(hasStartEngine(undefined)).toBe(false);
  });

  it('should return false for null meta', () => {
    expect(hasStartEngine(null)).toBe(false);
  });
});

describe('hasMountPoint', () => {
  it('should be defined', () => {
    expect(typeof hasMountPoint).toEqual('function');
  });

  it('should return false for gateway blocklet', () => {
    const meta: any = { group: 'gateway', main: 'index.js' };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return true for blocklet with main and not gateway', () => {
    const meta: any = { main: 'index.js' };
    expect(hasMountPoint(meta)).toBe(true);
  });

  it('should return true for blocklet with web interface', () => {
    const meta: any = { interfaces: [{ type: 'web' }] };
    expect(hasMountPoint(meta)).toBe(true);
  });

  it('should return false for static server engine without web interface', () => {
    const meta: any = {
      engine: {
        interpreter: 'blocklet',
        source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return true for static server engine with web interface', () => {
    const meta: any = {
      engine: {
        interpreter: 'blocklet',
        source: { name: STATIC_SERVER_ENGINE_DID, store: 'https://store.blocklet.dev' },
      },
      interfaces: [{ type: 'web' }],
    };
    expect(hasMountPoint(meta)).toBe(true);
  });

  it('should return true for non-static-server blocklet engine without web interface', () => {
    const meta: any = {
      engine: {
        interpreter: 'blocklet',
        source: { name: 'z1someOtherEngineDid', store: 'https://store.blocklet.dev' },
      },
    };
    expect(hasMountPoint(meta)).toBe(true);
  });

  it('should return false for static group blocklet', () => {
    const meta: any = { group: BlockletGroup.static, main: 'index.js' };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return false for docker blocklet without web interface', () => {
    const meta: any = { docker: { image: 'some-image' } };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return true for docker blocklet with web interface', () => {
    const meta: any = { docker: { image: 'some-image' }, interfaces: [{ type: 'web' }] };
    expect(hasMountPoint(meta)).toBe(true);
  });

  it('should return false for blocklet with non-web interfaces only', () => {
    const meta: any = { interfaces: [{ type: 'api' }] };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return false for blocklet with no interfaces and no main', () => {
    const meta: any = { interfaces: [] };
    expect(hasMountPoint(meta)).toBe(false);
  });

  it('should return false for blocklet with undefined interfaces', () => {
    const meta: any = {};
    expect(hasMountPoint(meta)).toBe(false);
  });
});

describe('canReceiveMessages', () => {
  it('should be defined', () => {
    expect(typeof canReceiveMessages).toEqual('function');
  });

  it('should return true for node interpreter', () => {
    const meta: any = { engine: { interpreter: 'node', source: '' } };
    expect(canReceiveMessages(meta)).toBe(true);
  });

  it('should return true for bun interpreter', () => {
    const meta: any = { engine: { interpreter: 'bun', source: '' } };
    expect(canReceiveMessages(meta)).toBe(true);
  });

  it('should return false for binary interpreter', () => {
    const meta: any = { engine: { interpreter: 'binary', source: '' } };
    expect(canReceiveMessages(meta)).toBe(false);
  });

  it('should return false for blocklet interpreter', () => {
    const meta: any = { engine: { interpreter: 'blocklet', source: '' } };
    expect(canReceiveMessages(meta)).toBe(false);
  });

  it('should return true for default engine (no engine specified)', () => {
    const meta: any = {};
    expect(canReceiveMessages(meta)).toBe(true);
  });
});

describe('isGatewayBlocklet', () => {
  it('should be defined', () => {
    expect(typeof isGatewayBlocklet).toEqual('function');
  });

  it('should return true for gateway group', () => {
    const meta: any = { group: BlockletGroup.gateway };
    expect(isGatewayBlocklet(meta)).toBe(true);
  });

  it('should return false for dapp group', () => {
    const meta: any = { group: BlockletGroup.dapp };
    expect(isGatewayBlocklet(meta)).toBe(false);
  });

  it('should return false for static group', () => {
    const meta: any = { group: BlockletGroup.static };
    expect(isGatewayBlocklet(meta)).toBe(false);
  });

  it('should return false for pack group', () => {
    const meta: any = { group: BlockletGroup.pack };
    expect(isGatewayBlocklet(meta)).toBe(false);
  });

  it('should return false for undefined meta', () => {
    expect(isGatewayBlocklet(undefined as any)).toBe(false);
  });

  it('should return false for null meta', () => {
    expect(isGatewayBlocklet(null as any)).toBe(false);
  });

  it('should return false for meta without group', () => {
    const meta: any = {};
    expect(isGatewayBlocklet(meta)).toBe(false);
  });
});

describe('isPackBlocklet', () => {
  it('should be defined', () => {
    expect(typeof isPackBlocklet).toEqual('function');
  });

  it('should return true for pack group', () => {
    const meta: any = { group: BlockletGroup.pack };
    expect(isPackBlocklet(meta)).toBe(true);
  });

  it('should return false for gateway group', () => {
    const meta: any = { group: BlockletGroup.gateway };
    expect(isPackBlocklet(meta)).toBe(false);
  });

  it('should return false for dapp group', () => {
    const meta: any = { group: BlockletGroup.dapp };
    expect(isPackBlocklet(meta)).toBe(false);
  });

  it('should return false for static group', () => {
    const meta: any = { group: BlockletGroup.static };
    expect(isPackBlocklet(meta)).toBe(false);
  });

  it('should return false for undefined meta', () => {
    expect(isPackBlocklet(undefined as any)).toBe(false);
  });

  it('should return false for null meta', () => {
    expect(isPackBlocklet(null as any)).toBe(false);
  });

  it('should return false for meta without group', () => {
    const meta: any = {};
    expect(isPackBlocklet(meta)).toBe(false);
  });
});
