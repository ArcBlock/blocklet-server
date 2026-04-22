// const getPm2ProcessInfo = require('./get-pm2-process-info');
const { mock, expect, test, afterAll } = require('bun:test');

mock.module('../lib/get-pm2-process-info', () => {
  return {
    __esModule: true,
    default: mock((id) => {
      if (id === 1) {
        return {
          pm2_env: {
            env: {
              BLOCKLET_PORT: 6666,
            },
          },
        };
      }

      return null;
    }),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { isPortsOccupiedByOtherProcess, refreshPorts } = require('../lib/port');

test('killProcessOccupiedPorts', async () => {
  // pm2 process exist
  const res1 = await isPortsOccupiedByOtherProcess({ pm2ProcessId: 1, ports: { BLOCKLET_PORT: 6666 } });
  expect(res1).toBe(false);
  // ports not exist
  const res2 = await isPortsOccupiedByOtherProcess({ pm2ProcessId: 2 });
  expect(res2).toBe(false);
});

test('refreshPorts', async () => {
  const res = await refreshPorts({ BLOCKLET_PORT: 6666 });
  expect(res).toEqual({ BLOCKLET_PORT: expect.any(Number) });
  expect(res.BLOCKLET_PORT).not.toBe(6666);
  expect(res.BLOCKLET_PORT).toBeLessThan(65536);
  expect(res.BLOCKLET_PORT).toBeGreaterThanOrEqual(10000);

  const res2 = await refreshPorts({ BLOCKLET_PORT: 6666 }, { range: [12345, 12345] });
  expect(res2).toEqual({ BLOCKLET_PORT: expect.any(Number) });
  expect(res2.BLOCKLET_PORT).toBe(12345);

  const blackList = [];
  for (let i = 0; i <= 20000; i++) {
    blackList.push(i);
  }
  const res3 = await refreshPorts({ BLOCKLET_PORT: 6666 }, { blackList });
  expect(res3.BLOCKLET_PORT).toBeGreaterThanOrEqual(20000);
});
