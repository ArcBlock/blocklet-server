const { describe, it, expect, mock } = require('bun:test');

// mock systeminformation 模块
mock.module('systeminformation', () => ({
  mem: mock(() => Promise.resolve({ total: 100, free: 50, used: 50 })),
  currentLoad: mock(() =>
    Promise.resolve({
      avgLoad: 1,
      currentLoad: 10,
      physicalCores: 4,
      cores: 8,
      currentLoadUser: 5,
      currentLoadSystem: 5,
      currentLoadIdle: 90,
    })
  ),
  fsSize: mock(() =>
    Promise.resolve([
      { fs: '/dev/disk1', mount: '/', size: 200, used: 100 },
      { fs: '/dev/disk2', mount: '/data', size: 400, used: 200 },
    ])
  ),
  osInfo: mock(() =>
    Promise.resolve({
      platform: 'linux',
      distro: 'Ubuntu',
      release: '22.04',
      arch: 'x64',
      hostname: Date.now().toString(),
    })
  ),
}));

const info = require('../../lib/util/sysinfo');

describe('sys-info', () => {
  it('should get sys info as expected', async () => {
    const result = await info.getSysInfo();
    expect(result.cpu.currentLoad).toBe(10);
    expect(result.mem.total).toBe(100);
    expect(result.os.platform).toBe('linux');
    expect(result.disks.length).toBeGreaterThan(0);
    expect(result.disks[0].total).toBe(200);
  });

  it('should reuse cached fsSize and osInfo', async () => {
    const first = await info.getSysInfo();
    const second = await info.getSysInfo();
    // 第二次不应重新调用 systeminformation
    expect(first.os.hostname).toBe(second.os.hostname);
  });
});
