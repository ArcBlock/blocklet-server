const { test, expect, describe, beforeEach, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const { loadLastInstallOs } = require('../../lib/util/docker/docker-install-dependenices');
const { installExternalDependencies } = require('../../lib/util/install-external-dependencies');

describe('installExternalDependencies (integration)', () => {
  let tempDir;

  // let baseDataDir = process.env.ABT_NODE_DATA_DIR;
  beforeEach(async () => {
    // process.env.ABT_NODE_DATA_DIR = path.join(process.cwd(), 'node_modules');
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'install-deps-test-'));
  });

  afterEach(async () => {
    // process.env.ABT_NODE_DATA_DIR = baseDataDir;
    // await fs.remove(tempDir);
  });

  const createPackageJson = async (dependencies = []) => {
    const pkg = {
      name: 'test-app',
      version: '1.0.0',
      dependencies: {
        'is-even': 'latest',
      },
      blockletExternalDependencies: dependencies,
    };
    await fs.writeJson(path.join(tempDir, 'package.json'), pkg, { spaces: 2 });
  };

  test('should throw if appDir is missing', async () => {
    await expect(installExternalDependencies()).rejects.toThrow('appDir is required');
  });

  test('should throw if appDir does not exist', async () => {
    const nonExistPath = path.join(os.tmpdir(), 'non-exist');
    await expect(installExternalDependencies({ appDir: nonExistPath })).rejects.toThrow(
      /not a correct appDir directory/
    );
  });

  test('should skip if no package.json', async () => {
    await fs.ensureDir(tempDir);
    await installExternalDependencies({ appDir: tempDir }); // 不应抛错
  });

  test('should skip if no blockletExternalDependencies', async () => {
    await fs.writeJson(path.join(tempDir, 'package.json'), { name: 'x' });
    await installExternalDependencies({ appDir: tempDir });
  });

  test('should skip if dependencies are already installed', async () => {
    await createPackageJson(['is-even']);

    // 模拟已经安装
    await fs.ensureDir(path.join(tempDir, 'node_modules', 'is-even'));

    await installExternalDependencies({ appDir: tempDir });
    // 没有抛出错误即可视为跳过安装
  });

  test('should install missing dependencies using bun', async () => {
    await createPackageJson(['is-odd']); // is-odd depends on is-number

    const existsA = await fs.pathExists(tempDir);
    expect(existsA).toBe(true);
    await installExternalDependencies({ appDir: tempDir });

    const exists = await fs.pathExists(path.join(tempDir, 'node_modules', 'is-odd'));
    expect(exists).toBe(true);

    const osLock = await loadLastInstallOs(tempDir);
    expect(osLock).toBe(os.type());
  });

  test('should remove node_modules if OS changed', async () => {
    await createPackageJson(['is-number']);

    const nodeModulesPath = path.join(tempDir, 'node_modules');

    await fs.ensureDir(path.join(nodeModulesPath, 'fake-dep'));

    // 写入错误的上次安装 OS
    await fs.writeFile(path.join(tempDir, 'node_modules_os_lock'), 'FakeOS');

    await installExternalDependencies({ appDir: tempDir });

    const stillExists = await fs.pathExists(path.join(nodeModulesPath, 'fake-dep'));
    expect(stillExists).toBe(false); // 说明被清理了
  });
});
