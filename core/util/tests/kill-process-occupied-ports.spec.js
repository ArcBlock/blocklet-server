const { mock, expect, test, afterAll } = require('bun:test');

mock.module('../lib/get-pm2-process-info', () => {
  return {
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
    __esModule: true,
  };
});

const mockKill = mock();
mock.module('fkill', () => {
  return {
    default: mockKill,
    __esModule: true,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { killProcessOccupiedPorts } = require('../lib/port');

test('killProcessOccupiedPorts', async () => {
  // pm2 process exist
  await killProcessOccupiedPorts({ pm2ProcessId: 1, ports: { BLOCKLET_PORT: 6666 } });
  expect(mockKill).not.toHaveBeenCalled();
  // ports not exist
  await killProcessOccupiedPorts({ pm2ProcessId: 2 });
  expect(mockKill).not.toHaveBeenCalled();
  // port is false
  await killProcessOccupiedPorts({ pm2ProcessId: 2, ports: { BLOCKLET_PORT: 0 } });
  expect(mockKill).not.toHaveBeenCalled();
  // mockKill is called
  await killProcessOccupiedPorts({ pm2ProcessId: 2, ports: { BLOCKLET_PORT: 6666 } });
  expect(mockKill).toHaveBeenCalledWith(':6666', { force: true, silent: true });

  await expect(killProcessOccupiedPorts({ ports: { BLOCKLET_PORT: 6666 } })).rejects.toThrow(
    'pm2ProcessId is required'
  );

  mockKill.mockRejectedValue('error');
  const mockPrintError = mock();
  await killProcessOccupiedPorts({ pm2ProcessId: 2, ports: { BLOCKLET_PORT: 6666 }, printError: mockPrintError });
  expect(mockPrintError).toHaveBeenCalled();
});
