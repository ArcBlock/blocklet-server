const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs/promises');
const os = require('os');
const { tmpdir } = require('os');

const { saveLastInstallOs, isSameOs } = require('../../lib/util/docker/docker-install-dependenices'); // 替换为你的真实路径

describe('OS Lock Integration Tests (No Mock)', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'os-lock-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('saveLastInstallOs should create lock file with correct OS', async () => {
    await saveLastInstallOs(tempDir);
    const content = await fs.readFile(path.join(tempDir, 'node_modules_os_lock'), 'utf-8');
    expect(content).toBe(os.type());
  });

  test('saveLastInstallOs should write "Linux" when isDocker = true', async () => {
    await saveLastInstallOs(tempDir, true);
    const content = await fs.readFile(path.join(tempDir, 'node_modules_os_lock'), 'utf-8');
    expect(content).toBe('Linux');
  });

  test('isSameOs should return true if same OS written', async () => {
    await saveLastInstallOs(tempDir);
    const result = await isSameOs(tempDir);
    expect(result).toBe(true);
  });

  test('isSameOs should return false if OS mismatch', async () => {
    await fs.writeFile(path.join(tempDir, 'node_modules_os_lock'), 'SomeOtherOS');
    const result = await isSameOs(tempDir);
    expect(result).toBe(false);
  });

  test('isSameOs should match "Linux" when isDocker = true', async () => {
    await saveLastInstallOs(tempDir, true); // 写入 Linux
    const result = await isSameOs(tempDir, true);
    expect(result).toBe(true);
  });

  test('isSameOs should return false when no lock file', async () => {
    const result = await isSameOs(tempDir);
    expect(result).toBe(false);
  });
});
