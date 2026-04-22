const { describe, test, expect, mock, spyOn, afterAll } = require('bun:test');

mock.module('../../lib/util/sysinfo', () => ({
  getSysInfo: () =>
    Promise.resolve({
      cpu: { currentLoad: 10, cpus: [{ load: 10 }] },
      mem: { total: 100, available: 50 },
      os: { platform: 'linux' },
      disks: [{ used: 10, total: 100 }],
    }),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const { NodeRuntimeMonitor } = require('../../lib/monitor/node-runtime-monitor');

const mockErrorLog = mock();

const mockLogger = {
  info: () => {},
  error: mockErrorLog,
  debug: () => {},
};

describe('NodeRuntimeMonitor', () => {
  test.serial('node-runtime-monitor', async () => {
    const history = [];
    const state = {
      insert: (x) => history.push(x),
      findPaginated: () => ({ list: history }),
    };

    const monitor = new NodeRuntimeMonitor({ logger: mockLogger, did: 'server-did', state });

    expect((await monitor.getHistory()).length).toBe(0);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(null, [{ monit: { memory: 1024 } }]));
    await monitor.monit();
    expect(monitor.getRealtimeData().cpu).toBeTruthy();
    expect(monitor.getRealtimeData().mem).toBeTruthy();
    expect(monitor.getRealtimeData().os).toBeTruthy();
    expect(monitor.getRealtimeData().disks).toBeTruthy();
    expect(monitor.getRealtimeData().daemon.memoryUsage).toBe(1024);
    expect(monitor.getRealtimeData().service.memoryUsage).toBe(1024);
    expect(monitor.getRealtimeData().service.instanceCount).toBe(1);
    expect((await monitor.getHistory()).length).toBe(1);
    expect((await monitor.getHistory())[0].daemonMem).toBe(1024);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(new Error('test'), []));
    await monitor.monit();
    expect(monitor.getRealtimeData().cpu).toBeTruthy();
    expect(monitor.getRealtimeData().mem).toBeTruthy();
    expect(monitor.getRealtimeData().os).toBeTruthy();
    expect(monitor.getRealtimeData().disks).toBeTruthy();
    expect(monitor.getRealtimeData().daemon).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect((await monitor.getHistory()).length).toBe(2);
    expect((await monitor.getHistory())[1].daemonMem).toBe(0);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(null, []));
    await monitor.monit();
    expect(monitor.getRealtimeData().daemon).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect((await monitor.getHistory()).length).toBe(3);
    expect((await monitor.getHistory())[2].daemonMem).toBe(0);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(null, null));
    await monitor.monit();
    expect(monitor.getRealtimeData().daemon).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect(monitor.getRealtimeData().service).toEqual({});
    expect((await monitor.getHistory()).length).toBe(4);
    expect((await monitor.getHistory())[3].daemonMem).toBe(0);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(null, [{ monit: { memory: 2048 } }]));
    await monitor.monit();
    expect((await monitor.getHistory()).length).toBe(5);
    expect((await monitor.getHistory())[4].daemonMem).toBe(2048);

    mock.clearAllMocks();
    expect(mockErrorLog).not.toHaveBeenCalled();
    monitor.monit();
    await monitor.monit();
    expect(mockErrorLog).not.toHaveBeenCalledWith([expect.stringContaining('in progress')]);

    const calculateUtilization = monitor.calculateUtilization();
    expect(calculateUtilization.cpus).toBeTruthy();
    expect(calculateUtilization.disks).toBeTruthy();
    expect(calculateUtilization.memory).toBeTruthy();

    mock.clearAllMocks();
  });

  test.serial('checkSystemHighLoad', async () => {
    const history = [];
    const state = {
      insert: (x) => history.push(x),
      findPaginated: () => ({ list: history }),
    };
    const monitor = new NodeRuntimeMonitor({ logger: mockLogger, did: 'server-did', state });

    expect((await monitor.getHistory()).length).toBe(0);

    spyOn(pm2, 'describe').mockImplementation((_, cb) => cb(null, [{ monit: { memory: 1024 } }]));
    await monitor.monit();

    const calculateUtilization = monitor.calculateUtilization();
    expect(calculateUtilization.cpus.length).toBeGreaterThan(0);
    expect(calculateUtilization.disks.length).toBeGreaterThan(0);
    expect(calculateUtilization.memory).toBeGreaterThan(0.05);

    const systemHighLoadA = monitor.checkSystemHighLoad({ maxCpus: 4, maxMem: 4, maxDisk: 4 });
    expect(systemHighLoadA.isHighLoad).toBe(false);

    const systemHighLoadB = monitor.checkSystemHighLoad({ maxCpus: 0.01, maxMem: 4, maxDisk: 4 });
    expect(systemHighLoadB.isHighLoad).toBe(false);

    const systemHighLoadC = monitor.checkSystemHighLoad({ maxCpus: 4, maxMem: 0.001, maxDisk: 4 });
    expect(systemHighLoadC.isHighLoad).toBe(false);

    const systemHighLoadD = monitor.checkSystemHighLoad({ maxCpus: 4, maxMem: 4, maxDisk: 0.001 });
    expect(systemHighLoadD.isHighLoad).toBe(true);

    const systemHighLoadE = monitor.checkSystemHighLoad({ maxCpus: 0.001, maxMem: 0.001, maxDisk: 4 });
    expect(systemHighLoadE.isHighLoad).toBe(true);
  });
});
