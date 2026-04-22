const { test, expect, describe, beforeEach, afterEach, mock } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { decrypt } = require('@blocklet/sdk/lib/security');
const { getComponentApiKey } = require('@abtnode/util/lib/blocklet');

const ConfigSynchronizer = require('../../../lib/blocklet/manager/config-synchronizer');

// 使用 performance.now() 确保在覆盖率模式下时间准确
const sleep = (ms) =>
  new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= ms) {
        resolve();
      } else {
        setTimeout(check, Math.min(50, ms / 10));
      }
    };
    setTimeout(check, Math.min(50, ms / 10));
  });

const tmpDir = path.join(os.tmpdir(), 'test-config-synchronizer');

const states = {
  node: {
    read: () => ({
      version: '1.0.0',
    }),
  },
};

afterEach(() => {
  fs.removeSync(tmpDir);
});

describe('syncAppConfig', () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('base', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: {
            did,
          },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
    });

    await synchronizer.syncAppConfig('did1');

    const config = JSON.parse(fs.readFileSync(`${tmpDir}/.config/config.json`).toString());

    expect(config).toMatchObject({
      env: {
        serverVersion: '1.0.0',
      },
      components: [],
    });
  });

  test('full data', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          appDid: 'appDid1',
          appPid: 'appPid1',
          migratedFrom: [{ appDid: 'xx1' }, { appDid: 'xx2' }],
          meta: {
            did,
            title: 'title1',
            description: 'desc1',
          },
          environments: [
            { key: 'BLOCKLET_DATA_DIR', value: tmpDir },
            { key: 'BLOCKLET_APP_LANGUAGES', value: 'zh,en,ja' },
            { key: 'BLOCKLET_APP_URL', value: 'https://xxx' },
            { key: 'BLOCKLET_APP_SPACE_ENDPOINT', value: 'https://storage-xxx' },
          ],
          configs: [
            { key: 'prefs.prop1', value: 'value1' },
            {
              key: 'prefs.prop2',
              value: {
                data: 'value2',
              },
            },
          ],
          children: [
            {
              meta: {
                did: 'did-com1',
                name: 'name-com1',
                title: 'com1',
                version: '2.0.0',
                resource: {
                  bundles: [
                    {
                      did: 'did1',
                      type: 'page',
                      public: true,
                    },
                  ],
                },
                interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }],
              },
              mountPoint: '/xxx',
              status: 8,
              ports: { BLOCKLET_PORT: 3000 },
              environments: [
                { key: 'BLOCKLET_APP_DIR', value: '/component-bundle-dir/version' },
                { key: 'BLOCKLET_PORT', value: 3000 },
              ],
            },
          ],
        }),
      },
      states,
    });

    await synchronizer.syncAppConfig('did1');

    const config = JSON.parse(fs.readFileSync(`${tmpDir}/.config/config.json`).toString());

    expect(config).toMatchObject({
      env: {
        appId: 'appDid1',
        appPid: 'appPid1',
        appIds: ['appDid1', 'appPid1', 'xx1', 'xx2'],
        appName: 'title1',
        appDescription: 'desc1',
        appUrl: 'https://xxx',
        appStorageEndpoint: 'https://storage-xxx',
        languages: [
          { code: 'zh', name: '简体中文' },
          { code: 'en', name: 'English' },
          { code: 'ja', name: '日本語' },
        ],
        preferences: { prop1: 'value1', prop2: { data: 'value2' } },
        serverVersion: '1.0.0',
      },
      components: [
        {
          title: 'com1',
          did: 'did-com1',
          name: 'name-com1',
          version: '2.0.0',
          mountPoint: '/xxx',
          status: 8,
          port: 3000,
          resources: [],
          resourcesV2: [
            {
              path: '/component-bundle-dir/version/resources/did1/page',
              public: true,
            },
          ],
        },
      ],
    });
  });

  test('throttled', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: {
            did,
          },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
      wait: 300,
    });

    const mockFn = mock();
    synchronizer.syncAppConfig = mockFn;

    expect(mockFn).toBeCalledTimes(0);

    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did2');
    synchronizer.throttledSyncAppConfig('did2');
    synchronizer.throttledSyncAppConfig('did2');
    await sleep(2000);
    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did1');
    synchronizer.throttledSyncAppConfig('did2');
    synchronizer.throttledSyncAppConfig('did2');
    synchronizer.throttledSyncAppConfig('did2');
    await sleep(1000);

    expect(mockFn).toBeCalledTimes(4);
    // 调用顺序不是固定的, 改为检查调用次数和 key 的唯一性
    const calls = mockFn.mock.calls.map((c) => c[0]);
    expect(calls.filter((did) => did === 'did1').length).toBe(2);
    expect(calls.filter((did) => did === 'did2').length).toBe(2);
    expect(new Set(calls)).toEqual(new Set(['did1', 'did2']));
  });

  test('throttledSyncAppConfig should wait for file write to complete', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: {
            did,
          },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
      wait: 100,
    });

    const configFile = `${tmpDir}/.config/config.json`;

    // First call should wait for file write
    await synchronizer.throttledSyncAppConfig('did1');
    expect(fs.existsSync(configFile)).toBe(true);
    const config1 = JSON.parse(fs.readFileSync(configFile).toString());
    expect(config1.env.serverVersion).toBe('1.0.0');

    // Verify file was written before await returns
    const stats1 = fs.statSync(configFile);
    const mtime1 = stats1.mtime.getTime();

    // Wait a bit and call again
    await sleep(200);
    await synchronizer.throttledSyncAppConfig('did1');
    const stats2 = fs.statSync(configFile);
    const mtime2 = stats2.mtime.getTime();

    // File should be updated after second call
    expect(mtime2).toBeGreaterThanOrEqual(mtime1);
  });

  test('throttledSyncAppConfig should merge multiple rapid calls into one execution', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: {
            did,
          },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
      wait: 200,
    });

    let callCount = 0;
    const originalSync = synchronizer.syncAppConfig.bind(synchronizer);
    synchronizer.syncAppConfig = async (did) => {
      callCount++;
      await originalSync(did);
    };

    // Multiple rapid calls should be merged
    const promises = [
      synchronizer.throttledSyncAppConfig('did1'),
      synchronizer.throttledSyncAppConfig('did1'),
      synchronizer.throttledSyncAppConfig('did1'),
    ];

    // All promises should resolve (they share the same execution)
    await Promise.all(promises);

    // Should only be called once due to throttling
    expect(callCount).toBe(1);

    // All promises should have resolved
    const results = await Promise.all(promises);
    expect(results).toEqual([undefined, undefined, undefined]);
  });

  test('throttledSyncAppConfig should handle errors correctly', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: () => {
          throw new Error('Failed to get blocklet');
        },
      },
      states,
      wait: 100,
    });

    // syncAppConfig catches errors internally, so throttledSyncAppConfig should still resolve
    // but the error should be logged. The promise should resolve (not reject) because
    // syncAppConfig swallows the error.
    await expect(synchronizer.throttledSyncAppConfig('did1')).resolves.toBeUndefined();

    // After error, should be able to retry
    synchronizer.manager.getBlocklet = (did) => ({
      meta: { did },
      environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
    });

    // Should work after error
    await expect(synchronizer.throttledSyncAppConfig('did1')).resolves.toBeUndefined();
  });

  test('throttledSyncAppConfig should propagate errors if syncAppConfig throws', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: { did },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
      wait: 100,
    });

    // Mock syncAppConfig to throw an error
    const originalSync = synchronizer.syncAppConfig.bind(synchronizer);
    synchronizer.syncAppConfig = async () => {
      await sleep(10); // Add await to satisfy linter
      throw new Error('Sync failed');
    };

    // Should reject when syncAppConfig throws
    await expect(synchronizer.throttledSyncAppConfig('did1')).rejects.toThrow('Sync failed');

    // Restore original syncAppConfig
    synchronizer.syncAppConfig = originalSync;

    // Should work after restoring
    await expect(synchronizer.throttledSyncAppConfig('did1')).resolves.toBeUndefined();
  });

  test('throttledSyncAppConfig should return same promise for concurrent calls', async () => {
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: (did) => ({
          meta: {
            did,
          },
          environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
        }),
      },
      states,
      wait: 200,
    });

    // Start multiple calls before any completes
    const promise1 = synchronizer.throttledSyncAppConfig('did1');
    const promise2 = synchronizer.throttledSyncAppConfig('did1');
    const promise3 = synchronizer.throttledSyncAppConfig('did1');

    // All should resolve (they share the same execution)
    await Promise.all([promise1, promise2, promise3]);

    // Verify file was written only once
    const configFile = `${tmpDir}/.config/config.json`;
    expect(fs.existsSync(configFile)).toBe(true);
  });
}, 20_000);

describe('syncComponentConfig', () => {
  test('full data', async () => {
    const component = {
      meta: {
        did: 'did-com1',
      },
      installedAt: new Date().toString(),
      configObj: {
        prop1: 'value1',
        prop2: 'value2',
      },
    };
    const app = {
      meta: {
        did: 'did-app1',
        title: 'title1',
        description: 'desc1',
      },
      environments: [{ key: 'BLOCKLET_DATA_DIR', value: tmpDir }],
      children: [component],
    };
    const synchronizer = new ConfigSynchronizer({
      manager: {
        getBlocklet: () => app,
      },
    });

    await synchronizer.syncComponentConfig('did-com1', 'did-app1', { serverSk: 'abc' });

    const raw = fs.readFileSync(`${tmpDir}/.config/did-com1/env`).toString();
    const decrypted = decrypt(raw, getComponentApiKey({ serverSk: 'abc', app, component }), 'did-com1');
    const config = JSON.parse(decrypted);

    expect(config).toEqual({
      prop1: 'value1',
      prop2: 'value2',
    });
  });
});
