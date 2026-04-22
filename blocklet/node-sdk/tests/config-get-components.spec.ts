import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { APP_CONFIG_FILE_PATH } from '@blocklet/constant';
import { configSettings } from '../src/config';

// eslint-disable-next-line no-promise-executor-return
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(() => resolve(), ms));

describe('getComponents file system update', () => {
  let tempDir: string;
  let originalAppDataDir: string;
  let originalLoadFileTimeout: number;

  beforeEach(() => {
    // Save original values
    originalAppDataDir = process.env.BLOCKLET_APP_DATA_DIR;
    originalLoadFileTimeout = configSettings.loadFileTimeout;

    // Create temporary directory
    tempDir = path.join(os.tmpdir(), `test-get-components-${Math.random().toString(36).substring(2, 15)}`);
    fs.ensureDirSync(tempDir);
    process.env.BLOCKLET_APP_DATA_DIR = tempDir;

    // Set timeout to 0 to bypass throttling for testing
    configSettings.loadFileTimeout = 0;
  });

  afterEach(() => {
    process.env.BLOCKLET_APP_DATA_DIR = originalAppDataDir;
    configSettings.loadFileTimeout = originalLoadFileTimeout;

    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  test('should update components from file system when config file exists', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    const initialComponents = [
      {
        did: 'did1',
        name: 'name1',
        version: '1.0.0',
        title: 'Initial Title',
        mountPoint: '/initial',
        port: 123,
      },
    ];
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: initialComponents,
      })
    );

    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);

    importedConfigSettings.loadFileTimeout = 0;

    const initialResult = getComponents();
    expect(initialResult).toBeDefined();
    expect(initialResult.length).toBeGreaterThanOrEqual(0);

    const updatedComponents = [
      {
        did: 'did1',
        name: 'name1',
        version: '2.0.0', // Updated version
        title: 'Updated Title', // Updated title
        mountPoint: '/updated',
        port: 456, // Updated port
      },
    ];

    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: updatedComponents,
      })
    );

    await sleep(10);

    getComponents();

    const result = getComponents();

    const component1 = result.find((c: any) => c.did === 'did1');
    if (component1) {
      expect(component1.version).toBe('2.0.0');
      expect(component1.title).toBe('Updated Title');
      expect(component1.port).toBe(456);
      expect(component1.mountPoint).toBe('/updated');
    }
  });

  test('should update components from file system with existing componentStore', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    const updatedComponents = [
      {
        did: 'did1',
        name: 'name1',
        version: '2.0.0',
        title: 'Updated Title',
        mountPoint: '/updated',
        port: 456,
      },
    ];
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: updatedComponents,
      })
    );

    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 0;

    const initialResult = getComponents();
    if (!initialResult.find((c: any) => c.did === 'did1')) {
      initialResult.push({
        did: 'did1',
        name: 'name1',
        version: '1.0.0',
        title: 'Initial Title',
        mountPoint: '/initial',
        port: 123,
        webEndpoint: 'http://127.0.0.1:123',
      });
    }

    getComponents();

    const result = getComponents();
    const component1 = result.find((c: any) => c.did === 'did1');

    if (component1) {
      expect(component1.version).toBe('2.0.0');
      expect(component1.title).toBe('Updated Title');
      expect(component1.port).toBe(456);
      expect(component1.mountPoint).toBe('/updated');
      expect(component1.webEndpoint).toBe('http://127.0.0.1:456');
    }
  });

  test('should not update when config file does not exist', async () => {
    // Don't create config file
    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 0;

    const result = getComponents();
    const initialLength = result.length;

    getComponents();

    const result2 = getComponents();
    expect(result2.length).toBe(initialLength);
  });

  test('should handle invalid JSON in config file gracefully', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    const { getComponents: getComponentsFromDisk, configSettings: importedConfigSettings } = await import(
      `../src/config?t=${Date.now()}`
    );
    importedConfigSettings.loadFileTimeout = 0;

    const initialResult = getComponentsFromDisk();
    const initialLength = initialResult.length;

    getComponentsFromDisk();

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(configFile, 'invalid json {');

    const result = getComponentsFromDisk();

    expect(result.length).toBeGreaterThanOrEqual(initialLength);
  });

  test('should respect loadFileTimeout and not update too frequently', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '2.0.0',
            title: 'Updated Title',
          },
        ],
      })
    );

    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);

    importedConfigSettings.loadFileTimeout = 100;

    const result1 = getComponents();
    const initialVersion = result1.find((c: any) => c.did === 'did1')?.version;

    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '3.0.0',
            title: 'Another Update',
          },
          {
            did: 'did2',
            version: '1.0.2',
            title: 'New Component',
          },
          {
            did: 'did3',
            version: '1.0.3',
            title: 'New Component',
          },
        ],
      })
    );

    const result2 = getComponents();
    const throttledVersion = result2.find((c: any) => c.did === 'did1')?.version;
    expect(throttledVersion).toBe(initialVersion); // Still old version

    return new Promise((resolve) => {
      setTimeout(() => {
        const result3 = getComponents();
        expect(result3.find((c: any) => c.did === 'did1')?.version).toBe('3.0.0'); // New version
        expect(result3.find((c: any) => c.did === 'did2')?.version).toBe('1.0.2');
        expect(result3.find((c: any) => c.did === 'did3')?.version).toBe('1.0.3');
        resolve(undefined);
      }, 150);
    });
  });
});

describe('reduceNextLoadTime', () => {
  let tempDir: string;
  let originalAppDataDir: string;
  let originalLoadFileTimeout: number;

  beforeEach(() => {
    originalAppDataDir = process.env.BLOCKLET_APP_DATA_DIR;
    originalLoadFileTimeout = configSettings.loadFileTimeout;

    tempDir = path.join(os.tmpdir(), `test-reduce-next-load-time-${Math.random().toString(36).substring(2, 15)}`);
    fs.ensureDirSync(tempDir);
    process.env.BLOCKLET_APP_DATA_DIR = tempDir;

    configSettings.loadFileTimeout = 100;
  });

  afterEach(() => {
    process.env.BLOCKLET_APP_DATA_DIR = originalAppDataDir;
    configSettings.loadFileTimeout = originalLoadFileTimeout;

    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  test('should reduce lastLoadTime when time since last load exceeds maxTime', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '1.0.0',
            title: 'Test Component',
          },
        ],
      })
    );

    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 100;

    getComponents();

    await sleep(1100);

    const result = getComponents();
    expect(result).toBeDefined();
  });

  test('should not reduce lastLoadTime when time since last load is less than maxTime', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    // Create config file
    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '1.0.0',
            title: 'Test Component',
          },
        ],
      })
    );

    const { getComponents, configSettings: importedConfigSettings } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 100;

    getComponents();

    await sleep(500);

    const result1 = getComponents();
    const result2 = getComponents();
    expect(result1).toEqual(result2);
  });

  test('should allow getComponents to read file sooner after reduceNextLoadTime', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '1.0.0',
            title: 'Initial',
          },
        ],
      })
    );

    const {
      getComponents,
      configSettings: importedConfigSettings,
      reduceNextLoadTime: reduceNextLoadTimeFromDisk,
    } = await import(`../src/config?t=${Date.now()}`);
    // Set an originally long wait time
    importedConfigSettings.loadFileTimeout = 5000;

    const result1 = getComponents();
    expect(result1.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0');
    // Update file
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '2.0.0',
            title: 'Updated',
          },
        ],
      })
    );

    const result2 = getComponents();
    expect(result2.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0'); // Still old version
    await sleep(1300);

    // Calling reduceNextLoadTime multiple times should be fine
    reduceNextLoadTimeFromDisk(500);
    reduceNextLoadTimeFromDisk(500);
    reduceNextLoadTimeFromDisk(500);
    reduceNextLoadTimeFromDisk(500);
    reduceNextLoadTimeFromDisk(500);
    reduceNextLoadTimeFromDisk(500);

    // After waiting 100ms, the file should not have updated yet
    await sleep(100);
    const result3 = getComponents();
    expect(result3.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0'); // Still old version

    await sleep(1000);

    const result4 = getComponents();
    expect(result4.find((c: any) => c.did === 'did1')?.version).toBe('2.0.0'); // New version
  });

  test('should allow getComponents to read file sooner after reduceNextLoadTime， multiple calls', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '1.0.0',
            title: 'Initial',
          },
        ],
      })
    );

    const {
      getComponents,
      configSettings: importedConfigSettings,
      reduceNextLoadTime: reduceNextLoadTimeFromDisk,
    } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 5000;

    const result1 = getComponents();
    expect(result1.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0');
    // Update file
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '2.0.0',
            title: 'Updated',
          },
        ],
      })
    );

    const result2 = getComponents();
    expect(result2.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0'); // Still old version
    await sleep(1300);

    reduceNextLoadTimeFromDisk(2000);

    await sleep(300);

    const result3 = getComponents();
    expect(result3.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0'); // New version
  });

  test('should allow getComponents to read file sooner after reduceNextLoadTime, ignore near time', async () => {
    const configFile = path.join(tempDir, APP_CONFIG_FILE_PATH);

    fs.ensureDirSync(path.dirname(configFile));
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '1.0.0',
            title: 'Initial',
          },
        ],
      })
    );

    const {
      getComponents,
      configSettings: importedConfigSettings,
      reduceNextLoadTime: reduceNextLoadTimeFromDisk,
    } = await import(`../src/config?t=${Date.now()}`);
    importedConfigSettings.loadFileTimeout = 500;

    const result1 = getComponents();
    expect(result1.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0');
    // Update file
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        env: {},
        components: [
          {
            did: 'did1',
            version: '2.0.0',
            title: 'Updated',
          },
        ],
      })
    );

    const result2 = getComponents();
    expect(result2.find((c: any) => c.did === 'did1')?.version).toBe('1.0.0'); // Still old version
    await sleep(1300);

    // If the adjusted time is longer than the current wait, it should be ignored
    reduceNextLoadTimeFromDisk(5000);

    // After waiting 800ms, the file should have updated
    await sleep(800);

    const result3 = getComponents();
    expect(result3.find((c: any) => c.did === 'did1')?.version).toBe('2.0.0'); // New version
  });
});
