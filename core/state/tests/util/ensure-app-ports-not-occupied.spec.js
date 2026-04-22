/* eslint-disable no-await-in-loop */
const { test, expect, describe, beforeEach, afterEach, mock, afterAll } = require('bun:test');
const net = require('net');

const mockForEachComponentV2 = mock(async (blocklet, iteratee) => {
  for (const child of blocklet.children || []) {
    await iteratee(child);
  }
});

const realPortPackage = require('@abtnode/util/lib/port');

mock.module('@abtnode/util/lib/port', () => {
  return {
    ...realPortPackage,
    isPortTaken: mock((...args) => realPortPackage.isPortTaken(...args)),
  };
});

mock.module('@blocklet/meta/lib/util', () => ({
  forEachComponentV2: (...args) => mockForEachComponentV2(...args),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const portUtil = require('@abtnode/util/lib/port');
const { ensureAppPortsNotOccupied } = require('../../lib/util/blocklet');

// 创建真实的服务，来验证端口占用
const listenOnPort = (server, port = 0) =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    // support IP V4/V6
    server.listen(port, '0.0.0.0', () => resolve(server.address().port));
  });

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((err) => {
      if (err && err.code !== 'ERR_SERVER_NOT_RUNNING') {
        reject(err);
        return;
      }
      resolve();
    });
  });

describe('ensureAppPortsNotOccupied', () => {
  let states;
  let manager;
  let servers;

  const reserveFreePort = async () => {
    const server = net.createServer();
    const port = await listenOnPort(server);
    await closeServer(server);
    return port;
  };

  const occupyPort = async (port) => {
    const server = net.createServer();
    const occupiedPort = await listenOnPort(server, port ?? 0);
    servers.push(server);
    return occupiedPort;
  };

  beforeEach(() => {
    mockForEachComponentV2.mockReset();
    mockForEachComponentV2.mockImplementation(async (blocklet, iteratee) => {
      for (const child of blocklet.children || []) {
        await iteratee(child);
      }
    });

    servers = [];

    states = {
      blocklet: {
        refreshBlockletPorts: mock().mockResolvedValue({
          refreshed: true,
          componentDids: [],
        }),
      },
    };

    manager = {
      _updateBlockletEnvironment: mock().mockResolvedValue(),
      ensureBlocklet: mock(),
    };

    portUtil.isPortTaken.mockClear();
  });

  afterEach(async () => {
    await Promise.all(servers.map((server) => closeServer(server)));
    portUtil.isPortTaken.mockClear();
  });

  test('returns original blocklet when no ports are occupied', async () => {
    const child1Port = await reserveFreePort();
    const child2Port = await reserveFreePort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        {
          meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
          ports: { http: child1Port },
          greenPorts: { http: child1Port },
        },
        {
          meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' },
          ports: { http: child2Port },
          greenPorts: { http: child2Port },
        },
      ],
    };

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).not.toHaveBeenCalled();
    expect(manager._updateBlockletEnvironment).not.toHaveBeenCalled();
    expect(manager.ensureBlocklet).not.toHaveBeenCalled();
    expect(portUtil.isPortTaken).toHaveBeenCalledTimes(2);
    expect(result).toBe(blocklet);
  });

  test('refreshes ports when a conflict is detected if not green ports', async () => {
    const freePort = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        { meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' }, ports: { http: freePort } },
        { meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' }, ports: { http: conflictPort } },
      ],
    };
    const refreshed = { meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' }, refreshed: true };

    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg', 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    });
    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg', 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      false
    );
    expect(manager._updateBlockletEnvironment).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(manager.ensureBlocklet).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(portUtil.isPortTaken).toHaveBeenCalledTimes(2);
    expect(result).toBe(refreshed);
  });

  test('refreshes ports when a conflict is detected', async () => {
    const freePort = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        {
          meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' },
          ports: { http: freePort },
          greenPorts: { http: freePort },
        },
        {
          meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' },
          ports: { http: conflictPort },
          greenPorts: { http: conflictPort },
        },
      ],
    };
    const refreshed = { meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' }, refreshed: true };

    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    });
    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      false
    );
    expect(manager._updateBlockletEnvironment).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(manager.ensureBlocklet).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(portUtil.isPortTaken).toHaveBeenCalledTimes(2);
    expect(result).toBe(refreshed);
  });

  test('uses green ports when checking conflicts in green mode', async () => {
    const defaultPort = await reserveFreePort();
    const greenPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        {
          meta: { did: 'child-green' },
          ports: { http: defaultPort },
          greenPorts: { http: greenPort },
        },
      ],
    };
    const refreshed = { meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' }, mode: 'green' };

    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['child-green'],
    });
    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({
      blocklet,
      componentDids: [],
      states,
      manager,
      isGreen: true,
    });

    expect(portUtil.isPortTaken).toHaveBeenCalledTimes(1);
    expect(portUtil.isPortTaken).toHaveBeenCalledWith(greenPort);
    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['child-green'],
      true
    );
    expect(result).toBe(refreshed);
  });

  test('respects provided component whitelist', async () => {
    const ignoredPort = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        { meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' }, ports: { http: ignoredPort } },
        { meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' }, ports: { http: conflictPort } },
      ],
    };
    const refreshed = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      refreshed: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    };

    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    });
    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({
      blocklet,
      componentDids: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      states,
      manager,
    });

    expect(portUtil.isPortTaken).toHaveBeenCalledTimes(1);
    expect(portUtil.isPortTaken).toHaveBeenCalledWith(conflictPort);
    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      false
    );
    expect(result).toBe(refreshed);
  });

  test('does not update environment when refreshBlockletPorts returns refreshed: false', async () => {
    const freePort = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        { meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' }, ports: { http: freePort } },
        { meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' }, ports: { http: conflictPort } },
      ],
    };

    // Mock：模拟 refreshBlockletPorts 返回 refreshed: false（端口检测时被占用，但实际刷新时发现未被占用）
    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: false,
      componentDids: [],
    });

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg', 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      false
    );
    // 当未真正刷新时，不应该更新环境变量
    expect(manager._updateBlockletEnvironment).not.toHaveBeenCalled();
    expect(manager.ensureBlocklet).not.toHaveBeenCalled();
    // 应该返回原始 blocklet
    expect(result).toBe(blocklet);
  });

  test('updates environment only when refreshBlockletPorts returns refreshed: true', async () => {
    const freePort = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        { meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' }, ports: { http: freePort } },
        { meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' }, ports: { http: conflictPort } },
      ],
    };
    const refreshed = { meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' }, refreshed: true };

    // Mock：模拟 refreshBlockletPorts 返回 refreshed: true，包含实际被刷新的组件 DIDs
    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    });

    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      ['zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg', 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
      false
    );
    // 当真正刷新时，应该更新环境变量
    expect(manager._updateBlockletEnvironment).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(manager.ensureBlocklet).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(result).toBe(refreshed);
  });

  test('handles partial refresh correctly', async () => {
    const freePort1 = await reserveFreePort();
    const freePort2 = await reserveFreePort();
    const conflictPort = await occupyPort();

    const blocklet = {
      meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' },
      children: [
        { meta: { did: 'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg' }, ports: { http: freePort1 } },
        { meta: { did: 'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB' }, ports: { http: conflictPort } },
        { meta: { did: 'z9iZzk6qAYD8Yeie1spiKBGGptafnynsLFhCC' }, ports: { http: freePort2 } },
      ],
    };
    const refreshed = { meta: { did: 'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV' }, refreshed: true };

    // Mock：模拟只有部分组件被刷新的情况
    states.blocklet.refreshBlockletPorts.mockResolvedValue({
      refreshed: true,
      componentDids: ['z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB'],
    });

    manager.ensureBlocklet.mockResolvedValue(refreshed);

    const result = await ensureAppPortsNotOccupied({ blocklet, componentDids: [], states, manager });

    expect(states.blocklet.refreshBlockletPorts).toHaveBeenCalledWith(
      'z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV',
      [
        'zNKbHjWJJJnsWwKnSpCxgo3twc6oeuWSoNLg',
        'z8iZzk6qAYD8Yeie1spiKBGGptafnynsLFhBB',
        'z9iZzk6qAYD8Yeie1spiKBGGptafnynsLFhCC',
      ],
      false
    );
    // 即使只有部分组件被刷新，也应该更新环境变量
    expect(manager._updateBlockletEnvironment).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(manager.ensureBlocklet).toHaveBeenCalledWith('z1jW2D9nim4S14M5ko6Fgiqgf4LCbRLUZZV');
    expect(result).toBe(refreshed);
  });
});
