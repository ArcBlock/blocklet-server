const { test, expect, describe, mock, afterAll, afterEach } = require('bun:test');
const path = require('path');
const fs = require('fs-extra');

const mockDirToZip = mock(() => Promise.resolve());
const mockCompareAndMove = mock(() => Promise.resolve());

mock.module('../../../../lib/blocklet/storage/utils/zip', () => ({
  dirToZip: mockDirToZip,
}));
mock.module('../../../../lib/blocklet/storage/utils/hash', () => ({
  compareAndMove: mockCompareAndMove,
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { BlockletsExport } = require('../../../../lib/blocklet/storage/export/blocklets-export');

describe('BlockletsExport', () => {
  const testDir = path.join(__dirname, 'tmp-blocklets-export-test');
  const serverDir = path.join(testDir, 'server');
  const backupDir = path.join(testDir, 'backup');

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
    mock.clearAllMocks();
  });

  const createBundleDir = (name, version) => {
    const dir = path.join(serverDir, 'blocklets', name, version);
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'blocklet.yml'), 'name: test');
    return dir;
  };

  test('should export ALL children including those with HTTP tarballs', async () => {
    // Create bundle dirs for parent and children
    createBundleDir('parent-bundle', '1.0.0');
    createBundleDir('child-registry', '2.0.0');
    createBundleDir('child-local', '3.0.0');

    const blocklet = {
      meta: {
        did: 'z1parent',
        bundleName: 'parent-bundle',
        name: 'parent-bundle',
        version: '1.0.0',
        dist: {},
      },
      children: [
        {
          meta: {
            did: 'z1child-registry',
            bundleName: 'child-registry',
            name: 'child-registry',
            version: '2.0.0',
            dist: { tarball: 'https://store.example.com/child-registry-2.0.0.tgz' },
          },
          children: [],
        },
        {
          meta: {
            did: 'z1child-local',
            bundleName: 'child-local',
            name: 'child-local',
            version: '3.0.0',
            dist: {},
          },
          children: [],
        },
      ],
    };

    const instance = new BlockletsExport({ did: 'z1parent' });
    instance.blocklet = blocklet;
    instance.serverDir = serverDir;
    instance.backupDir = backupDir;

    const { dirs } = await instance.export();

    // Should include ALL 3 components (parent + 2 children)
    expect(dirs).toHaveLength(3);
    expect(dirs.map((d) => d.zipPath)).toContain(path.join(backupDir, 'blocklets', 'child-registry', '2.0.0.zip'));
  });

  test('should use getVersionScope for zip naming when integrity exists', async () => {
    // Create bundle dir with version-hash naming (new style, no blocklet.yml)
    const integrity = 'sha512-ABCDEFGHabcdefgh1234567890';
    const safeHash = integrity
      .replace('sha512-', '')
      .slice(0, 8)
      .replace(/[^a-zA-Z0-9]/g, '');
    const versionScope = `1.0.0-${safeHash}`;
    const dir = path.join(serverDir, 'blocklets', 'my-bundle', versionScope);
    fs.ensureDirSync(dir);
    fs.writeFileSync(path.join(dir, 'blocklet.json'), '{}');

    const blocklet = {
      meta: {
        did: 'z1parent',
        bundleName: 'my-bundle',
        name: 'my-bundle',
        version: '1.0.0',
        dist: { integrity },
      },
      children: [],
    };

    const instance = new BlockletsExport({ did: 'z1parent' });
    instance.blocklet = blocklet;
    instance.serverDir = serverDir;
    instance.backupDir = backupDir;

    const { dirs } = await instance.export();

    expect(dirs).toHaveLength(1);
    // Zip path should use versionScope (version-hash), not just version
    expect(dirs[0].zipPath).toBe(path.join(backupDir, 'blocklets', 'my-bundle', `${versionScope}.zip`));
  });

  test('should skip components whose bundle dir does not exist', async () => {
    createBundleDir('parent-bundle', '1.0.0');
    // child-missing bundle dir NOT created

    const blocklet = {
      meta: {
        did: 'z1parent',
        bundleName: 'parent-bundle',
        name: 'parent-bundle',
        version: '1.0.0',
        dist: {},
      },
      children: [
        {
          meta: {
            did: 'z1child-missing',
            bundleName: 'child-missing',
            name: 'child-missing',
            version: '1.0.0',
            dist: { tarball: 'https://store.example.com/child.tgz' },
          },
          children: [],
        },
      ],
    };

    const instance = new BlockletsExport({ did: 'z1parent' });
    instance.blocklet = blocklet;
    instance.serverDir = serverDir;
    instance.backupDir = backupDir;

    const { dirs } = await instance.export();

    // Only parent (child bundle dir doesn't exist)
    expect(dirs).toHaveLength(1);
  });
});
