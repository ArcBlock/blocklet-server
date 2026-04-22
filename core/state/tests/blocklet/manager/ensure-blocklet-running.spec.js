/* eslint-disable require-await */
/* eslint-disable no-loop-func */
const { describe, test, expect } = require('bun:test');
const { BlockletStatus } = require('@blocklet/constant');
const { EnsureBlockletRunning } = require('../../../lib/blocklet/manager/ensure-blocklet-running');

const mockFns = (ensure) => {
  const blocklets = [
    {
      appPid: 'team1',
      meta: { did: 'team1', name: 'Team1' },
      status: BlockletStatus.running,
      children: [
        {
          meta: { did: 'healthy', name: 'Healthy', main: true },
          status: BlockletStatus.running,
          port: '1101',
          mockHealthy: true,
        },
        {
          meta: { did: 'fake1', name: 'Fake1', main: true },
          status: BlockletStatus.running,
          port: '1102',
          mockHealthy: false,
        },
        {
          meta: { did: 'shortWait', name: 'ShortWait', main: true },
          status: BlockletStatus.waiting,
          port: '1103',
          mockHealthy: false,
          operator: 'daemon',
        },
        {
          meta: { did: 'timeoutWait', name: 'TimeoutWait', main: true },
          status: BlockletStatus.waiting,
          port: '1104',
          mockHealthy: false,
          operator: 'daemon',
        },
      ],
    },
    {
      appPid: 'team2',
      meta: { did: 'team2', name: 'Team2' },
      status: BlockletStatus.running,
      children: [
        {
          meta: { did: 'validUserOp', name: 'UserOp', main: true },
          status: BlockletStatus.stopping,
          port: '1201',
          mockHealthy: false,
          operator: 'z8abc123validDID', // valid DID → should skip
        },
        {
          meta: { did: 'restartFail', name: 'RestartFail', main: true },
          status: BlockletStatus.running,
          port: '1202',
          mockHealthy: false,
          mockStartToError: true,
        },
      ],
    },
    {
      appPid: 'team3',
      meta: { did: 'team3', name: 'Team3' },
      status: BlockletStatus.running,
      children: [
        {
          meta: { did: 'inProgress1', name: 'inProgress1', main: true },
          status: BlockletStatus.waiting,
          port: '1301',
          mockHealthy: true,
          operator: 'z8abc123validDID', // valid DID → should skip
        },
        {
          meta: { did: 'inProgress2', name: 'inProgress2', main: true },
          status: BlockletStatus.starting,
          port: '1302',
          mockHealthy: true,
        },
      ],
    },
    {
      appPid: 'team4',
      meta: { did: 'team4', name: 'Team4' },
      status: BlockletStatus.running,
      children: [
        {
          meta: { did: 'running2', name: 'running2', main: true },
          status: BlockletStatus.running,
          port: '1401',
          mockHealthy: true,
          operator: 'z8abc123validDID', // valid DID → should skip
        },
        {
          meta: { did: 'running2', name: 'running2', main: true },
          status: BlockletStatus.running,
          port: '1402',
          mockHealthy: true,
        },
      ],
    },
  ];

  ensure.states = {
    blocklet: {
      getBlocklets: async () => blocklets,
      setBlockletStatus: (rootDid, status, { componentDids }) => {
        for (const root of blocklets) {
          if (root.meta.did === rootDid) {
            for (const child of root.children) {
              if (componentDids.includes(child.meta.did)) {
                child.status = status;
                child.inProgressStart = Date.now();
              }
            }
          }
        }
      },
    },
  };

  const isBlockletPortHealthy = async (comp) => {
    const found = blocklets.flatMap((b) => b.children).find((x) => x.meta.did === comp.meta.did);
    if (!found.mockHealthy) throw new Error('mock unhealthy');
    return true;
  };

  ensure.mockStartedDid = new Set();
  ensure.start = async ({ did, componentDids }) => {
    ensure.mockStartedDid.add(did);
    const root = blocklets.find((b) => b.meta.did === did);
    for (const child of root.children) {
      if (componentDids.includes(child.meta.did)) {
        if (child.mockStartToError) {
          child.status = BlockletStatus.error;
          throw new Error('mock start fail');
        }
        child.mockHealthy = true;
        child.status = BlockletStatus.running;
      }
    }
  };

  ensure.stop = (did, componentDids) => {
    const root = blocklets.find((b) => b.meta.did === did);
    for (const child of root.children) {
      if (componentDids.includes(child.meta.did)) {
        child.status = BlockletStatus.stopping;
      }
    }
  };

  const checkSystemHighLoad = () => ({ isHighLoad: false });

  ensure.stop = () => {};
  ensure.createAuditLog = () => {};
  ensure.notification = () => {};
  ensure.checkInterval = 100;
  ensure.minCheckInterval = 100;
  ensure.preCheckInterval = 100;
  ensure.everyBlockletCheckInterval = 10;
  ensure.everyBlockletDoingInterval = 10;
  ensure.canRunEnsureBlockletRunning = true;
  ensure.isBlockletPortHealthy = isBlockletPortHealthy;
  ensure.checkSystemHighLoad = checkSystemHighLoad;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('ensure blocklets initializing', () => {
  test('should add to run queue once', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.checkInterval = 100;
    ensure.minCheckInterval = 100;
    ensure.preCheckInterval = 100;
    ensure.canRunEnsureBlockletRunning = true;
    let n = 0;
    ensure.startRestartQueueProcessor = () => {
      n++;
    };
    ensure.getRunningBlocklets = async () => [];
    ensure.getFakeRunningBlocklets = async () => [];
    ensure.initialize({
      checkSystemHighLoad: () => ({ isHighLoad: false }),
    });
    await sleep(500);
    expect(n).toBeGreaterThan(0);
    ensure.stopped = true;
  });

  test('should initial no add to restart queue', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.checkInterval = 100;
    ensure.minCheckInterval = 100;
    ensure.preCheckInterval = 100;

    let n = 0;
    ensure.startRestartQueueProcessor = () => {
      n++;
    };
    ensure.getRunningBlocklets = async () => [];
    ensure.getFakeRunningBlocklets = async () => [];
    ensure.initialize({
      checkSystemHighLoad: () => ({ isHighLoad: false }),
    });
    await sleep(500);
    expect(n).toBe(0);
    ensure.stopped = true;
  });

  test('high load should not add to restart queue', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.canRunEnsureBlockletRunning = true;
    ensure.checkInterval = 100;
    ensure.minCheckInterval = 100;
    ensure.preCheckInterval = 100;

    let n = 0;
    ensure.startRestartQueueProcessor = () => {
      n++;
    };
    ensure.getRunningBlocklets = async () => [];
    ensure.getFakeRunningBlocklets = async () => [];
    ensure.whenCycleCheck = true;
    ensure.initialize({
      checkSystemHighLoad: () => ({ isHighLoad: true }),
    });
    await sleep(500);
    expect(n).toBe(0);
    ensure.stopped = true;
  });

  test('should add to restart queue when system is not high load', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.canRunEnsureBlockletRunning = true;
    ensure.checkInterval = 100;
    ensure.minCheckInterval = 100;
    ensure.preCheckInterval = 100;

    let n = 0;
    ensure.startRestartQueueProcessor = () => {
      n++;
    };
    ensure.getRunningBlocklets = async () => [];
    ensure.getFakeRunningBlocklets = async () => [];
    ensure.whenCycleCheck = true;
    ensure.initialize({
      checkSystemHighLoad: () => ({ isHighLoad: false }),
    });
    await sleep(500);
    expect(n).toBeGreaterThan(0);
    ensure.stopped = true;
  });

  test('should not add to restart queue when system is high load', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.canRunEnsureBlockletRunning = true;
    ensure.checkInterval = 100;
    ensure.minCheckInterval = 100;
    ensure.preCheckInterval = 100;

    let n = 0;
    ensure.startRestartQueueProcessor = () => {
      n++;
    };
    ensure.getRunningBlocklets = async () => [];
    ensure.getFakeRunningBlocklets = async () => [];
    ensure.whenCycleCheck = false;
    ensure.initialize({
      checkSystemHighLoad: () => ({ isHighLoad: true }),
    });
    await sleep(500);
    expect(n).toBeGreaterThan(0);
    ensure.stopped = true;
  });
});

describe('ensure blocklets running', () => {
  test('should get fake running blocklets', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.preCheckInterval = 100;
    ensure.initialize({});
    // 取消 queue 的处理，验证错误
    ensure.startRestartQueueProcessor = () => {};
    mockFns(ensure);
    await sleep(500);
    expect(Object.keys(ensure.runningBlocklets).length).toEqual(4);
    await sleep(500);
    expect(ensure.restartQueue.length).toEqual(3);
    ensure.stopped = true;
  });

  test('should restart blocklets', async () => {
    const ensure = new EnsureBlockletRunning();
    ensure.preCheckInterval = 100;
    ensure.startingTimeout = 100;
    ensure.waitingTimeout = 100;
    ensure.initialize({});
    mockFns(ensure);
    // 取消启动的处理，验证 padding
    // ensure.restartBlockletFromQueue = async () => {};
    await sleep(1000);
    expect(Object.keys(ensure.runningBlocklets).length).toEqual(4);
    const blocklets = await ensure.states.blocklet.getBlocklets();
    let runningCount = 0;
    let errorCount = 0;
    for (const blocklet of blocklets) {
      for (const child of blocklet.children) {
        if (child.mockStartToError) {
          expect(child.status).toEqual(BlockletStatus.error);
          errorCount++;
        } else {
          runningCount++;
          expect(child.status).toEqual(BlockletStatus.running);
        }
      }
    }
    expect(runningCount).toEqual(9);
    expect(errorCount).toEqual(1);
    expect(ensure.mockStartedDid.has('team1')).toEqual(true);
    expect(ensure.mockStartedDid.has('team2')).toEqual(true);
    expect(ensure.mockStartedDid.has('team3')).toEqual(true);
    expect(ensure.mockStartedDid.has('team4')).toEqual(false);
    ensure.mockStartedDid.clear();

    // mock 3 个 blocklet 假 running
    blocklets[0].children[1].mockHealthy = false;
    blocklets[1].children[1].status = BlockletStatus.starting;
    blocklets[1].children[1].mockHealthy = false;
    blocklets[2].children[0].mockHealthy = false;
    await sleep(1000);
    runningCount = 0;
    errorCount = 0;
    for (const blocklet of blocklets) {
      for (const child of blocklet.children) {
        if (child.mockStartToError) {
          expect(child.status).toEqual(BlockletStatus.error);
          errorCount++;
        } else {
          runningCount++;
          expect(child.status).toEqual(BlockletStatus.running);
        }
      }
    }
    expect(runningCount).toEqual(9);
    expect(errorCount).toEqual(1);
    // 只重启了 team1, team3
    expect(ensure.mockStartedDid.has('team1')).toEqual(true);
    expect(ensure.mockStartedDid.has('team2')).toEqual(true);
    expect(ensure.mockStartedDid.has('team3')).toEqual(true);
    expect(ensure.mockStartedDid.has('team4')).toEqual(false);
    ensure.mockStartedDid.clear();

    // mock 一个 blocklet 假 running， 并且无法启动
    blocklets[0].children[1].mockHealthy = false;
    blocklets[0].children[1].mockStartToError = true;
    await sleep(1000);
    runningCount = 0;
    errorCount = 0;
    for (const blocklet of blocklets) {
      for (const child of blocklet.children) {
        if (child.mockStartToError) {
          expect(child.status).toEqual(BlockletStatus.error);
          errorCount++;
        } else {
          runningCount++;
          expect(child.status).toEqual(BlockletStatus.running);
        }
      }
    }
    expect(runningCount).toEqual(8);
    expect(errorCount).toEqual(2);
    // 只重启了 team1
    expect(ensure.mockStartedDid.has('team1')).toEqual(true);
    expect(ensure.mockStartedDid.has('team2')).toEqual(false);
    expect(ensure.mockStartedDid.has('team3')).toEqual(false);
    expect(ensure.mockStartedDid.has('team3')).toEqual(false);
    ensure.stopped = true;
  });
});
