const { describe, test, expect, beforeEach, mock } = require('bun:test');
const { BlockletStatus, BlockletEvents } = require('@blocklet/constant');
const { INSTALL_ACTIONS } = require('@abtnode/constant');

// Mock updateBlockletFallbackLogo
const utilBlocklet = require('../../../../lib/util/blocklet');

mock.module('../../../../lib/util/blocklet', () => {
  return {
    ...utilBlocklet,
    updateBlockletFallbackLogo: mock(() => Promise.resolve()),
  };
});

// Mock blueGreenStartBlocklet before importing blueGreenUpgradeBlocklet
const blueGreenStartBlockletModule = require('../../../../lib/blocklet/manager/helper/blue-green-start-blocklet');

let blueGreenStartBlockletMock = null;

mock.module('../../../../lib/blocklet/manager/helper/blue-green-start-blocklet', () => {
  return {
    ...blueGreenStartBlockletModule,
    blueGreenStartBlocklet: (...args) => {
      if (blueGreenStartBlockletMock) {
        return blueGreenStartBlockletMock(...args);
      }
      return blueGreenStartBlockletModule.blueGreenStartBlocklet(...args);
    },
  };
});

const { blueGreenUpgradeBlocklet } = require('../../../../lib/blocklet/manager/helper/blue-green-upgrade-blocklet');

describe('blueGreenUpgradeBlocklet', () => {
  let manager;
  let states;
  let context;
  let newBlocklet;
  let oldBlocklet;
  let componentDids;

  beforeEach(() => {
    // Reset mock before each test
    blueGreenStartBlockletMock = null;
    // Mock manager
    manager = {
      _setConfigsFromMeta: mock(() => Promise.resolve()),
      ensureBlocklet: mock(() => Promise.resolve()),
      getBlocklet: mock(() => Promise.resolve()),
      _updateBlockletEnvironment: mock(() => Promise.resolve()),
      _runUserHook: mock(() => Promise.resolve()),
      _runMigration: mock(() => Promise.resolve()),
      _updateDependents: mock(() => Promise.resolve()),
      refreshListCache: mock(() => {}),
      configSynchronizer: {
        throttledSyncAppConfig: mock(() => {}),
      },
      emit: mock(() => {}),
      _createNotification: mock(() => {}),
      _cleanUploadFile: mock(() => {}),
      _ensureDeletedChildrenInSettings: mock(() => Promise.resolve()),
    };

    // Mock states
    states = {
      blocklet: {
        upgradeBlocklet: mock(() => Promise.resolve()),
        setBlockletStatus: mock(() => Promise.resolve()),
      },
    };

    context = {
      user: {
        did: 'user-did-123',
      },
    };

    // Create mock blocklets
    oldBlocklet = {
      meta: {
        did: 'app-did-123',
        name: 'Test App',
        version: '1.0.0',
      },
      status: BlockletStatus.running,
      configObj: {},
      children: [
        {
          meta: { did: 'component-1', name: 'Component 1' },
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.stopped,
          ports: { web: 3000 },
          greenPorts: {},
        },
        {
          meta: { did: 'component-2', name: 'Component 2' },
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.stopped,
          ports: { web: 3001 },
          greenPorts: {},
        },
        {
          meta: { did: 'component-3', name: 'Component 3' },
          status: BlockletStatus.stopped,
          greenStatus: BlockletStatus.stopped,
          ports: {},
          greenPorts: {},
        },
      ],
    };

    newBlocklet = {
      meta: {
        did: 'app-did-123',
        name: 'Test App',
        version: '2.0.0',
      },
      source: { type: 'npm', name: 'test-app' },
      deployedFrom: 'npm',
      configObj: {},
      children: [
        {
          meta: { did: 'component-1', name: 'Component 1', version: '2.0.0' },
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.running,
          ports: { web: 3000 },
          greenPorts: { web: 3002 },
        },
        {
          meta: { did: 'component-2', name: 'Component 2', version: '2.0.0' },
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.running,
          ports: { web: 3001 },
          greenPorts: { web: 3003 },
        },
        {
          meta: { did: 'component-3', name: 'Component 3', version: '2.0.0' },
          status: BlockletStatus.stopped,
          greenStatus: BlockletStatus.stopped,
          ports: {},
          greenPorts: {},
        },
      ],
      settings: {
        initialized: true,
      },
    };

    componentDids = ['component-1', 'component-2', 'component-3'];

    // Reset mocks
    mock.restore();
  });

  test('should successfully upgrade blocklet when all components start successfully', async () => {
    const upgradedBlocklet = {
      ...newBlocklet,
      children: newBlocklet.children.map((child) => ({
        ...child,
        status: BlockletStatus.running,
        greenStatus: BlockletStatus.running,
      })),
    };

    manager.ensureBlocklet.mockResolvedValue(upgradedBlocklet);
    manager.getBlocklet.mockResolvedValue(upgradedBlocklet);

    // Mock blueGreenStartBlocklet to succeed
    blueGreenStartBlockletMock = mock(() => Promise.resolve(undefined));

    const result = await blueGreenUpgradeBlocklet(
      {
        newBlocklet,
        oldBlocklet,
        componentDids,
        action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
        shouldCleanUploadFile: false,
        url: null,
      },
      context,
      manager,
      states
    );

    expect(result).toBeDefined();
    expect(states.blocklet.upgradeBlocklet).toHaveBeenCalled();
    expect(manager.emit).toHaveBeenCalledWith(BlockletEvents.upgraded, expect.objectContaining({ blocklet: result }));
  });

  test('should rollback only error blocklets when some components fail to start', async () => {
    const errorBlockletDids = [{ did: 'component-1', error: new Error('Start failed'), isGreen: true }];
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: [
        {
          ...newBlocklet.children[0],
          status: BlockletStatus.error,
          greenStatus: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[1],
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.running,
        },
        {
          ...newBlocklet.children[2],
          status: BlockletStatus.stopped,
          greenStatus: BlockletStatus.stopped,
        },
      ],
    };

    manager.ensureBlocklet
      .mockResolvedValueOnce(newBlocklet) // First call in try block
      .mockResolvedValueOnce(nextBlocklet); // Second call in catch block
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    // Mock blueGreenStartBlocklet to call onError callback and throw error
    blueGreenStartBlockletMock = mock((params) => {
      if (params.onError) {
        params.onError(errorBlockletDids);
      }
      throw new Error('Some components failed to start');
    });

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow();

    // Verify rollback was called with mixed state
    expect(states.blocklet.upgradeBlocklet).toHaveBeenCalledTimes(2); // Once in try, once in catch
    const rollbackCall = states.blocklet.upgradeBlocklet.mock.calls[1][0];
    const rollbackBlocklet = rollbackCall;

    // component-1 should be rolled back (error blocklet)
    const rolledBackComponent1 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-1');
    expect(rolledBackComponent1.status).toBe(oldBlocklet.children[0].status);
    expect(rolledBackComponent1.greenStatus).toBe(oldBlocklet.children[0].greenStatus);
    expect(rolledBackComponent1.ports).toEqual(oldBlocklet.children[0].ports);
    expect(rolledBackComponent1.greenPorts).toEqual(oldBlocklet.children[0].greenPorts);

    // component-2 should keep new version (not error blocklet)
    const keptComponent2 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-2');
    expect(keptComponent2).toEqual(nextBlocklet.children[1]);

    // component-3 should keep new version (not error blocklet)
    const keptComponent3 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-3');
    expect(keptComponent3).toEqual(nextBlocklet.children[2]);
  });

  test('should handle errorBlockletDids as string array', async () => {
    const errorBlockletDids = ['component-1', 'component-2'];
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: [
        {
          ...newBlocklet.children[0],
          status: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[1],
          status: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[2],
          status: BlockletStatus.stopped,
        },
      ],
    };

    manager.ensureBlocklet.mockResolvedValueOnce(newBlocklet).mockResolvedValueOnce(nextBlocklet);
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    blueGreenStartBlockletMock = mock((params) => {
      if (params.onError) {
        params.onError(errorBlockletDids);
      }
      throw new Error('Start failed');
    });

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow();

    const rollbackCall = states.blocklet.upgradeBlocklet.mock.calls[1][0];
    const rollbackBlocklet = rollbackCall;

    // Both component-1 and component-2 should be rolled back
    const rolledBackComponent1 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-1');
    expect(rolledBackComponent1.status).toBe(oldBlocklet.children[0].status);

    const rolledBackComponent2 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-2');
    expect(rolledBackComponent2.status).toBe(oldBlocklet.children[1].status);

    // component-3 should keep new version
    const keptComponent3 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-3');
    expect(keptComponent3).toEqual(nextBlocklet.children[2]);
  });

  test('should handle errorBlockletDids as object array', async () => {
    const errorBlockletDids = [
      { did: 'component-1', error: new Error('Error 1'), isGreen: true },
      { did: 'component-2', error: new Error('Error 2'), isGreen: false },
    ];
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: [
        {
          ...newBlocklet.children[0],
          status: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[1],
          status: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[2],
          status: BlockletStatus.stopped,
        },
      ],
    };

    manager.ensureBlocklet.mockResolvedValueOnce(newBlocklet).mockResolvedValueOnce(nextBlocklet);
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    blueGreenStartBlockletMock = mock((params) => {
      if (params.onError) {
        params.onError(errorBlockletDids);
      }
      throw new Error('Start failed');
    });

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow();

    const rollbackCall = states.blocklet.upgradeBlocklet.mock.calls[1][0];
    const rollbackBlocklet = rollbackCall;

    // Both should be rolled back
    const rolledBackComponent1 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-1');
    expect(rolledBackComponent1.status).toBe(oldBlocklet.children[0].status);

    const rolledBackComponent2 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-2');
    expect(rolledBackComponent2.status).toBe(oldBlocklet.children[1].status);
  });

  test('should rollback all blocklets when errorBlockletDids is empty but error occurs', async () => {
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: newBlocklet.children.map((child) => ({
        ...child,
        status: BlockletStatus.running,
      })),
    };

    manager.ensureBlocklet.mockResolvedValueOnce(newBlocklet).mockResolvedValueOnce(nextBlocklet);
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    // Simulate error during migration
    manager._runMigration.mockRejectedValue(new Error('Migration failed'));

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow('Migration failed');

    // When errorBlockletDids is empty, all should be rolled back
    const rollbackCall = states.blocklet.upgradeBlocklet.mock.calls[1][0];
    const rollbackBlocklet = rollbackCall;

    // All components should keep new version (since errorBlockletDids is empty)
    rollbackBlocklet.children.forEach((child, index) => {
      expect(child).toEqual(nextBlocklet.children[index]);
    });
  });

  test('should emit failure notification when upgrade fails', async () => {
    const errorBlockletDids = [{ did: 'component-1', error: new Error('Start failed'), isGreen: true }];
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: [
        {
          ...newBlocklet.children[0],
          status: BlockletStatus.error,
        },
        ...newBlocklet.children.slice(1),
      ],
    };

    manager.ensureBlocklet.mockResolvedValueOnce(newBlocklet).mockResolvedValueOnce(nextBlocklet);
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    blueGreenStartBlockletMock = mock((params) => {
      if (params.onError) {
        params.onError(errorBlockletDids);
      }
      throw new Error('Start failed');
    });

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow();

    expect(manager.emit).toHaveBeenCalledWith(
      BlockletEvents.componentUpgradeFailed,
      expect.objectContaining({
        blocklet: expect.objectContaining({
          componentDids,
          error: expect.objectContaining({ message: 'Start failed' }),
        }),
      })
    );

    expect(manager._createNotification).toHaveBeenCalledWith(
      'app-did-123',
      expect.objectContaining({
        title: '3 components failed to upgrade for Test App',
        severity: 'error',
      })
    );
  });

  test('should handle INSTALL_COMPONENT action', async () => {
    const upgradedBlocklet = {
      ...newBlocklet,
      children: newBlocklet.children.map((child) => ({
        ...child,
        status: BlockletStatus.installed,
      })),
    };

    manager.ensureBlocklet.mockResolvedValue(upgradedBlocklet);
    manager.getBlocklet.mockResolvedValue(upgradedBlocklet);

    blueGreenStartBlockletMock = mock(() => Promise.resolve(undefined));

    const result = await blueGreenUpgradeBlocklet(
      {
        newBlocklet,
        oldBlocklet,
        componentDids,
        action: INSTALL_ACTIONS.INSTALL_COMPONENT,
        shouldCleanUploadFile: false,
        url: null,
      },
      context,
      manager,
      states
    );

    expect(result).toBeDefined();
    expect(manager.emit).toHaveBeenCalledWith(
      BlockletEvents.componentInstalled,
      expect.objectContaining({ componentDids })
    );
  });

  test('should clean upload file when shouldCleanUploadFile is true', async () => {
    const upgradedBlocklet = {
      ...newBlocklet,
      children: newBlocklet.children.map((child) => ({
        ...child,
        status: BlockletStatus.running,
      })),
    };

    manager.ensureBlocklet.mockResolvedValue(upgradedBlocklet);
    manager.getBlocklet.mockResolvedValue(upgradedBlocklet);

    blueGreenStartBlockletMock = mock(() => Promise.resolve(undefined));

    const url = 'file:///tmp/uploaded-blocklet.zip';

    await blueGreenUpgradeBlocklet(
      {
        newBlocklet,
        oldBlocklet,
        componentDids,
        action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
        shouldCleanUploadFile: true,
        url,
      },
      context,
      manager,
      states
    );

    expect(manager._cleanUploadFile).toHaveBeenCalledWith(url);
  });

  test('should upgrade lower version blocklet and rollback error blocklet', async () => {
    // 场景：更新一批 blocklet，其中：
    // - component-1: 版本更低（应该升级到新版本）
    // - component-2: 有 error（应该回滚到旧版本）
    // - component-3: 正常（应该升级到新版本）
    const errorBlockletDids = [{ did: 'component-2', error: new Error('Start failed'), isGreen: true }];

    // nextBlocklet 中：
    // - component-1: 版本从 1.0.0 升级到 2.0.0（新版本）
    // - component-2: 有 error（需要回滚）
    // - component-3: 正常升级到新版本
    const nextBlocklet = {
      ...newBlocklet,
      configObj: {},
      children: [
        {
          ...newBlocklet.children[0],
          meta: { ...newBlocklet.children[0].meta, version: '2.0.0' }, // 版本升级
          status: BlockletStatus.running,
          greenStatus: BlockletStatus.running,
        },
        {
          ...newBlocklet.children[1],
          status: BlockletStatus.error,
          greenStatus: BlockletStatus.error,
        },
        {
          ...newBlocklet.children[2],
          status: BlockletStatus.stopped,
          greenStatus: BlockletStatus.stopped,
        },
      ],
    };

    // 确保 oldBlocklet 中 component-1 的版本是 1.0.0（更低）
    const oldBlockletWithLowerVersion = {
      ...oldBlocklet,
      children: [
        {
          ...oldBlocklet.children[0],
          meta: { ...oldBlocklet.children[0].meta, version: '1.0.0' }, // 旧版本
        },
        oldBlocklet.children[1],
        oldBlocklet.children[2],
      ],
    };

    manager.ensureBlocklet.mockResolvedValueOnce(newBlocklet).mockResolvedValueOnce(nextBlocklet);
    manager.getBlocklet.mockResolvedValue(newBlocklet);

    // Mock blueGreenStartBlocklet to call onError callback and throw error
    blueGreenStartBlockletMock = mock((params) => {
      if (params.onError) {
        params.onError(errorBlockletDids);
      }
      throw new Error('Some components failed to start');
    });

    await expect(
      blueGreenUpgradeBlocklet(
        {
          newBlocklet,
          oldBlocklet: oldBlockletWithLowerVersion,
          componentDids,
          action: INSTALL_ACTIONS.UPGRADE_COMPONENT,
          shouldCleanUploadFile: false,
          url: null,
        },
        context,
        manager,
        states
      )
    ).rejects.toThrow();

    // Verify rollback was called with mixed state
    expect(states.blocklet.upgradeBlocklet).toHaveBeenCalledTimes(2); // Once in try, once in catch
    const rollbackCall = states.blocklet.upgradeBlocklet.mock.calls[1][0];
    const rollbackBlocklet = rollbackCall;

    // component-1: 版本更低的 blocklet 应该升级到新版本（不是 error blocklet）
    const upgradedComponent1 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-1');
    expect(upgradedComponent1).toEqual(nextBlocklet.children[0]);
    expect(upgradedComponent1.meta.version).toBe('2.0.0'); // 新版本

    // component-2: 有 error 的 blocklet 应该回滚到旧版本
    const rolledBackComponent2 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-2');
    expect(rolledBackComponent2.status).toBe(oldBlockletWithLowerVersion.children[1].status);
    expect(rolledBackComponent2.greenStatus).toBe(oldBlockletWithLowerVersion.children[1].greenStatus);
    expect(rolledBackComponent2.ports).toEqual(oldBlockletWithLowerVersion.children[1].ports);
    expect(rolledBackComponent2.greenPorts).toEqual(oldBlockletWithLowerVersion.children[1].greenPorts);

    // component-3: 正常的 blocklet 应该保持新版本（不是 error blocklet）
    const keptComponent3 = rollbackBlocklet.children.find((c) => c.meta.did === 'component-3');
    expect(keptComponent3).toEqual(nextBlocklet.children[2]);
  });
});
