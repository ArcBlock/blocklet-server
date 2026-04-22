const { test, expect, mock, spyOn } = require('bun:test');
const pm2 = require('@abtnode/util/lib/pm2/async-pm2');
const { BlockletStatus, BlockletGroup } = require('@blocklet/constant');
const { Op } = require('sequelize');
const { BlockletRuntimeMonitor } = require('../../lib/monitor/blocklet-runtime-monitor');

const mockErrorLog = mock();
const mockLogger = {
  info: () => {},
  error: mockErrorLog,
  debug: () => {},
};

test('blocklet-runtime-monitor', async () => {
  const blocklets = [
    {
      meta: { did: 'a', name: 'a', main: 'xxx' },
      status: BlockletStatus.running,
      children: [
        {
          meta: { did: '1', name: '1', main: 'xxx' },
          status: BlockletStatus.running,
        },
      ],
    },
    {
      meta: { did: 'b', name: 'b', main: 'xxx' },
      status: BlockletStatus.stopped,
      children: [],
    },
    {
      meta: { did: 'c', name: 'c', group: BlockletGroup.gateway },
      status: BlockletStatus.stopped,
      children: [
        {
          meta: { did: '1', name: '1', main: 'xxx' },
          mountPoint: '/',
          status: BlockletStatus.running,
        },
        {
          meta: { did: '2', name: '2', main: 'xxx' },
          mountPoint: '/2',
          status: BlockletStatus.stopped,
        },
      ],
    },
    {
      meta: { did: 'd', name: 'd', group: BlockletGroup.gateway },
      status: BlockletStatus.stopped,
      children: [
        {
          meta: { did: '1', name: '1', main: 'xxx' },
          mountPoint: '/relative-path',
          status: BlockletStatus.running,
        },
      ],
    },
  ];

  const historyMap = {};
  const states = {
    blocklet: {
      getBlocklets: () => {
        return blocklets;
      },
      getBlocklet: (did) => {
        return blocklets.find((x) => x.meta.did === did);
      },
    },
    runtimeInsight: {
      insert: (x) => {
        historyMap[x.did] = historyMap[x.did] || [];
        historyMap[x.did].push(x);
        return Promise.resolve(x);
      },
      model: {
        findAll: ({ where: { did } }) => {
          const defaultValue = [];
          if (!did) {
            return defaultValue;
          }
          if (typeof did === 'string') {
            return historyMap[did] || defaultValue;
          }

          if (did[Op.like]) {
            const prefix = did[Op.like].replace('%', '');
            const result = Object.entries(historyMap)
              .filter(([key]) => key.startsWith(prefix))
              .flatMap(([, value]) => value)
              .map((x) => {
                return {
                  toJSON: () => x,
                };
              });
            return result;
          }

          return defaultValue;
        },
      },
    },
  };

  const onRuntimeEvent = mock();
  expect(onRuntimeEvent).not.toHaveBeenCalled();

  const monitor = new BlockletRuntimeMonitor({ logger: mockLogger, states });
  monitor.on('node.blockletsRuntimeInfo', onRuntimeEvent);

  expect(monitor.getHistory()).resolves.toEqual([]);
  expect(monitor.getHistory('unknown did')).resolves.toEqual([]);
  expect(monitor.getHistory('a')).resolves.toEqual([]);

  spyOn(pm2, 'describe').mockImplementation((_, cb) =>
    cb(null, [{ pid: 1, pm2_env: { status: 'online' }, monit: { cpu: 1, memory: 100 } }])
  );

  await monitor.monitAll();
  expect(onRuntimeEvent).toHaveBeenCalledWith([
    expect.objectContaining({
      did: 'a',
      componentId: 'a',
      runtimeInfo: expect.any(Object),
    }),
    expect.objectContaining({
      did: 'a',
      componentId: 'a/1',
      runtimeInfo: expect.any(Object),
    }),
  ]);

  expect(monitor.getRuntimeInfo('b')).toBeFalsy();
  expect(monitor.getRuntimeInfo('b', 'b/1')).toBeFalsy();

  expect(monitor.getRuntimeInfo('a').memoryUsage).toBe(200);
  expect(monitor.getRuntimeInfo('a').cpuUsage).toBe(2);
  expect(monitor.getRuntimeInfo('a')).toHaveProperty('pid');
  expect(monitor.getRuntimeInfo('a')).toHaveProperty('uptime');
  expect(monitor.getRuntimeInfo('a')).toHaveProperty('status');

  expect(monitor.getRuntimeInfo('a', 'a').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('a', 'a').cpuUsage).toBe(1);
  expect(monitor.getRuntimeInfo('a', 'a')).toHaveProperty('pid');
  expect(monitor.getRuntimeInfo('a', 'a')).toHaveProperty('uptime');
  expect(monitor.getRuntimeInfo('a', 'a')).toHaveProperty('status');

  expect(monitor.getRuntimeInfo('a', 'a/1').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('a', 'a/1').cpuUsage).toBe(1);
  expect(monitor.getRuntimeInfo('a', 'a/1')).toHaveProperty('pid');
  expect(monitor.getRuntimeInfo('a', 'a/1')).toHaveProperty('uptime');
  expect(monitor.getRuntimeInfo('a', 'a/1')).toHaveProperty('status');

  expect(monitor.getRuntimeInfo('a', 'a/2')).toBeFalsy();

  const aHistory = await monitor.getHistory('a');
  expect(aHistory.length).toBe(2);
  expect(aHistory[0]).toHaveProperty('date');
  expect(aHistory.map((x) => x.cpu)).toContain(2);
  expect(aHistory.map((x) => x.mem)).toContain(200);

  spyOn(pm2, 'describe').mockImplementation((_, cb) =>
    cb(null, [{ pid: 1, pm2_env: { status: 'online' }, monit: { cpu: 2, memory: 200 } }])
  );
  await monitor.monitAll();

  expect(monitor.getRuntimeInfo('a').memoryUsage).toBe(400);
  expect(monitor.getRuntimeInfo('a').cpuUsage).toBe(4);
  expect(monitor.getRuntimeInfo('a', 'a').memoryUsage).toBe(200);
  expect(monitor.getRuntimeInfo('a', 'a').cpuUsage).toBe(2);
  expect(monitor.getRuntimeInfo('a', 'a/1').memoryUsage).toBe(200);
  expect(monitor.getRuntimeInfo('a', 'a/1').cpuUsage).toBe(2);

  expect((await monitor.getHistory('a')).length).toBe(2);
  expect((await monitor.getHistory('a'))[0]).toHaveProperty('date');
  expect((await monitor.getHistory('a')).map((x) => x.cpu)).toContain(2);
  expect((await monitor.getHistory('a')).map((x) => x.mem)).toContain(200);

  blocklets[0].status = BlockletStatus.stopped;
  blocklets[1].status = BlockletStatus.running;
  blocklets[2].status = BlockletStatus.running;
  blocklets[3].status = BlockletStatus.running;

  spyOn(pm2, 'describe').mockImplementation((_, cb) =>
    cb(null, [{ pid: 1, pm2_env: { status: 'online' }, monit: { cpu: 1, memory: 100 } }])
  );
  await monitor.monitAll();

  expect(monitor.getRuntimeInfo('a')).toEqual({});

  expect(monitor.getRuntimeInfo('b').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('b').cpuUsage).toBe(1);

  expect(monitor.getRuntimeInfo('c').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('c').cpuUsage).toBe(1);
  expect(monitor.getRuntimeInfo('c', 'c')).toBeFalsy();
  expect(monitor.getRuntimeInfo('c', 'c/1').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('c', 'c/1').cpuUsage).toBe(1);

  expect(monitor.getRuntimeInfo('d').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('d').cpuUsage).toBe(1);
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('pid');
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('uptime');
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('status');
  expect(monitor.getRuntimeInfo('d', 'd')).toBeFalsy();
  expect(monitor.getRuntimeInfo('d', 'd/1').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('d', 'd/1').cpuUsage).toBe(1);

  monitor.delete('d');
  expect(monitor.getRuntimeInfo('d')).toBeFalsy();

  await monitor.monit('d');
  expect(monitor.getRuntimeInfo('d').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('d').cpuUsage).toBe(1);
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('pid');
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('uptime');
  expect(monitor.getRuntimeInfo('d')).toHaveProperty('status');
  expect(monitor.getRuntimeInfo('d', 'd')).toBeFalsy();
  expect(monitor.getRuntimeInfo('d', 'd/1').memoryUsage).toBe(100);
  expect(monitor.getRuntimeInfo('d', 'd/1').cpuUsage).toBe(1);

  mock.clearAllMocks();
  expect(mockErrorLog).not.toHaveBeenCalled();
  monitor.monitAll();
  await monitor.monitAll();
  expect(mockErrorLog).not.toHaveBeenCalledWith([expect.stringContaining('in progress')]);

  mock.clearAllMocks();
});
