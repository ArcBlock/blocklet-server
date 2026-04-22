/* eslint-disable import/order */
/* eslint-disable global-require */
const { test, describe, expect, beforeAll, afterAll, beforeEach, mock, spyOn, it } = require('bun:test');
const { EventEmitter } = require('events');

// Mock @blocklet/images validation
mock.module('@blocklet/images', () => ({
  __esModule: true,
  validateLogo: mock(() => []),
  validateScreenshots: mock(() => []),
}));

// Mock installExternalDependencies to avoid slow npm/bun install during tests
mock.module('@abtnode/core/lib/util/install-external-dependencies', () => ({
  __esModule: true,
  installExternalDependencies: mock(() => Promise.resolve()),
}));

// Mock the archive module directly to avoid real compression
const createMockArchive = () => {
  const archive = new EventEmitter();
  archive.file = mock(() => archive);
  archive.append = mock(() => archive);
  archive.pipe = mock((output) => {
    archive._output = output;
    return archive;
  });
  archive.finalize = mock(() => {
    // Create a minimal valid zip file (PK header + empty central directory)
    const zipHeader = Buffer.from([
      0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);
    if (archive._output) {
      archive._output.write(zipHeader);
      archive._output.end();
    }
    setImmediate(() => archive.emit('end'));
    return archive;
  });
  return archive;
};

mock.module('../../../lib/commands/blocklet/bundle/zip/archive', () => ({
  startZip: mock((destPath) => {
    const { createWriteStream } = require('fs');
    const output = createWriteStream(destPath);
    const archive = createMockArchive();
    archive.pipe(output);
    return { archive, output };
  }),
  addZipFile: mock(() => {}),
  addZipContent: mock(() => {}),
  endZip: mock(async (archive, output) => {
    archive.finalize();
    await new Promise((resolve) => {
      output.on('close', resolve);
    });
  }),
}));

// Mock create-blocklet-release to avoid slow tarball creation
mock.module('@abtnode/util/lib/create-blocklet-release', () => ({
  __esModule: true,
  createRelease: mock((bundleDir) => {
    const fsx = require('fs-extra');
    const pathModule = require('path');
    // Create a minimal fake tarball
    const releaseDir = pathModule.join(bundleDir, 'release');
    fsx.ensureDirSync(releaseDir);
    const tarballPath = pathModule.join(releaseDir, 'blocklet.tgz');
    fsx.writeFileSync(tarballPath, 'fake-tarball-content');
    return Promise.resolve({
      tarball: tarballPath,
      meta: {
        name: 'test-blocklet',
        version: '1.0.0',
        files: [],
        dist: {
          tarball: 'test-blocklet-1.0.0.tgz',
          shasum: 'abc123',
          integrity: 'sha512-test-integrity-hash-value-here',
        },
      },
    });
  }),
}));

// Mock tar utility functions to avoid reading actual tarballs
mock.module('../../../lib/util/blocklet/tar', () => ({
  __esModule: true,
  logTar: mock(() => {}),
  getContents: mock((meta) =>
    Promise.resolve({
      id: `${meta.name}@${meta.version}`,
      name: meta.name,
      version: meta.version,
      size: 1000,
      unpackedSize: 2000,
      shasum: meta.dist?.shasum || 'test-shasum',
      integrity: meta.dist?.integrity || 'sha512-test',
      filename: meta.dist?.tarball || 'test.tgz',
      files: [{ path: 'blocklet.yml', size: 100 }],
      entryCount: 1,
      bundled: [],
    })
  ),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { validateLogo, validateScreenshots } = require('@blocklet/images');

const fs = require('fs-extra');
const path = require('path');
const bundle = require('../../../lib/commands/blocklet/bundle');

// Helper to clean up bundle directory before test
const cleanBundleDir = (dir) => {
  fs.removeSync(path.join(dir, '.blocklet'));
};

describe('Command.blocklet.bundle', () => {
  let originalError;
  beforeAll(() => {
    originalError = console.error;
    console.error = mock();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    validateLogo.mockReturnValue([]);
    validateScreenshots.mockReturnValue([]);
  });

  test('should successfully bundle a gateway blocklet', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-gateway');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({});
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
  }, 30_000);

  test('should not bundle a blocklet with broken prefs', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-broken-prefs');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    await bundle.run({});
    expect(mockExit).toHaveBeenCalledWith(1);
  }, 30_000);

  test('should successfully bundle a static blocklet', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-static');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({});
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
  }, 30_000);

  test('should successfully bundle a static blocklet with hooks', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-static-hooks');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ zip: true });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet/bundle');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    ['pre-start.js', 'post-start.js', 'blocklet.yml', 'blocklet.zip'].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeTruthy();
    });
  }, 30_000);

  test('should successfully bundle a dapp blocklet use zip', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-dapp');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ zip: true });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet/bundle');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    ['blocklet.zip', 'blocklet.js', 'blocklet.yml', 'blocklet.prefs.json'].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeTruthy();
    });
  }, 30_000);

  test('should successfully bundle a dapp blocklet use compact and external', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-dapp-compact');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ compact: true, createRelease: true, external: ['axios'] });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet/bundle');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    [
      'blocklet-compact.js',
      'api/index.js',
      'package.json',
      'api/exist.txt',
      'api/exist.svg',
      'texts/exist.txt',
      'texts/exist.svg',
      'api/sub/exist.svg',
      'api/sub/exist.txt',
      'texts/sub/exist.svg',
    ].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeTruthy();
    });

    ['api/no-exist.png', 'api/sub/no-exist.png', 'texts/no-exist.svg', 'texts/sub/no-exist.png'].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeFalsy();
    });

    const pkg = fs.readJSONSync(path.join(bundleDir, 'package.json'));
    expect(pkg.dependencies).toHaveProperty('axios');
  }, 60_000);

  test('should successfully bundle a dapp blocklet with hooks use zip', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-dapp-hooks');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ zip: true });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet/bundle');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    ['pre-start.js', 'post-start.js', 'blocklet.zip', 'blocklet.js', 'blocklet.yml'].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeTruthy();
    });
  }, 60_000);

  test('should successfully bundle a complex dapp blocklet with hooks use zip', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-dapp-complex');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ zip: true });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet/bundle');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    ['blocklet.zip', 'blocklet.js', 'blocklet.yml', 'server', 'migration'].forEach((x) => {
      expect(fs.existsSync(path.join(bundleDir, x))).toBeTruthy();
    });
  }, 60_000);

  test('should successfully bundle a dapp blocklet and create a release', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-dapp');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({ zip: true, createRelease: true });
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet');
    expect(fs.existsSync(bundleDir)).toBeTruthy();
    expect(fs.existsSync(path.join(bundleDir, 'release'))).toBeTruthy();
  }, 60_000);

  test('should successfully bundle a resource blocklet', async () => {
    const dir = path.join(__dirname, '../assets/blocklet-resource');
    spyOn(process, 'cwd').mockReturnValue(dir);
    const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
    cleanBundleDir(dir);
    await bundle.run({});
    expect(mockExit).toHaveBeenCalledWith(0);
    const bundleDir = path.join(dir, '.blocklet');
    expect(fs.existsSync(bundleDir)).toBeTruthy();

    expect(
      fs.existsSync(path.join(bundleDir, 'bundle', 'resources', 'z2qaDtgwzCcbWp5qkBdNDfhPCrD54958vDZLF', 'a'))
    ).toBeTruthy();
    expect(
      fs.existsSync(path.join(bundleDir, 'bundle', 'resources', 'z2qaKbaHXnh6h4aorKABShAA2Pkh4T3MjDCqd', 'b'))
    ).toBeTruthy();
  }, 30_000);

  describe('markdown media test', () => {
    it('markdown bundle should work!', async () => {
      // Reset mocks to ensure clean state (large file bundle, needs more time)
      validateLogo.mockReturnValue([]);
      validateScreenshots.mockReturnValue([]);

      const dir = path.join(__dirname, '../assets/markdown-media-test');
      spyOn(process, 'cwd').mockReturnValue(dir);
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      cleanBundleDir(dir);
      await bundle.run({ zip: true, createRelease: true });
      expect(mockExit).toHaveBeenCalledWith(0);
      const bundleDir = path.join(dir, '.blocklet/bundle');
      // media folder should exist
      expect(fs.existsSync(path.join(bundleDir, 'media'))).toBeTruthy();
      // blocklet.md should exist
      const blockletMd = fs.readFileSync(path.join(bundleDir, 'blocklet.md'), 'utf8').toString();
      // Local assets
      const localAssets = {
        coverImage: '/assets/media/df/6be2975a0caf25a8dce4b0daf2a44c.png',
        indexHtml: '/assets/media/6a/e87090950c5be4551e071c2325fe0b.html',
        logoImage: '/assets/media/e9/4c995c52cb1fbc8dc18853bbb2cde8.png',
        jokeMp4: '/assets/media/82/8e909668f0936c1d51c7614a904213.mp4',
        demoGif: '/assets/media/1e/7bc5cd84b4fb57e7c81c72ac66bdd0.gif',
      };
      Object.values(localAssets).forEach((asset) => {
        expect(blockletMd).toContain(asset);
        expect(fs.existsSync(path.join(bundleDir, 'media', asset.replace('/assets/media', '')))).toBeTruthy();
      });
      const blankListAssets = {
        website: 'https://excalidraw.com',
        readme: '<https://github.com/skypesky/leetcode-for-javascript/edit/master/README.md>',
        avatarImage: 'https://avatars.githubusercontent.com/u/33124160?v=4',
        mp4: 'https://encooacademy.oss-cn-shanghai.aliyuncs.com/activity/OpenBrowser.mp4',
        anchor: '#图片',
        noHeaderLink1: '//player.bilibili.com/player.html?aid=540082845&bvid=BV1mi4y1b76M&cid=172799113&page=1',
        noHeaderLink2: '://player.bilibili.com/player.html?aid=540082845&bvid=BV1mi4y1b76M&cid=172799113&page=1',
      };
      Object.values(blankListAssets).forEach((asset) => {
        expect(blockletMd).toContain(asset);
      });
    }, 90_000);
  });

  describe('file-case', () => {
    it('should be bundle successfully!', async () => {
      const dir = path.join(__dirname, '../assets/blocklet-file-case');
      spyOn(process, 'cwd').mockReturnValue(dir);
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      cleanBundleDir(dir);
      await bundle.run({
        zip: true,
        createRelease: true,
      });
      expect(mockExit).toHaveBeenCalledWith(0);

      const bundleDir = path.join(dir, '.blocklet/bundle');

      const blockletMd = fs.readFileSync(path.join(bundleDir, 'blocklet.md')).toString();
      expect(blockletMd).toContain('/assets/media/a3/7a361ddac899811003825e7cb0b07b.MD');

      const readmeMd = fs.readFileSync(path.join(bundleDir, 'README.md')).toString();
      expect(readmeMd).toContain('/assets/media/44/91ab0ad629c516eb5ebd66f8c3e255.md');

      expect(fs.existsSync(path.join(bundleDir, 'CHANGELOG.md'))).toBeTruthy();
    }, 60_000);
  });

  describe('blocklet-i18n', () => {
    it('blocklet-i18n should work', async () => {
      const dir = path.join(__dirname, '../assets/blocklet-i18n');
      spyOn(process, 'cwd').mockReturnValue(dir);
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      cleanBundleDir(dir);
      await bundle.run({
        zip: true,
        createRelease: true,
      });
      expect(mockExit).toHaveBeenCalledWith(0);

      const bundleDir = path.join(dir, '.blocklet/bundle');

      const blockletMd = fs.readFileSync(path.join(bundleDir, 'blocklet.md')).toString();
      expect(blockletMd).toContain('hello world');
      expect(blockletMd).toContain('/assets/media/4d/2c3693517cfacde70d673ce014dab9.html');

      const blockletZhMd = fs.readFileSync(path.join(bundleDir, 'blocklet.zh.md')).toString();
      expect(blockletZhMd).toContain('你好世界');
      expect(blockletZhMd).toContain('/assets/media/4d/2c3693517cfacde70d673ce014dab9.html');
    }, 60_000);
  });

  describe('component source store', () => {
    it('should empty component source store in blocklet.yml be bundled', async () => {
      const dir = path.join(__dirname, '../assets/blocklet-component-store');
      spyOn(process, 'cwd').mockReturnValue(dir);
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});

      // default store url does not exist
      cleanBundleDir(dir);
      try {
        await bundle.run({
          createRelease: true,
        });
      } catch {
        // do nothing
      }
      expect(mockExit).toHaveBeenLastCalledWith(1);

      // default store url from params
      await bundle.run({
        createRelease: true,
        storeUrl: 'http://b.com',
      });
      expect(mockExit).toHaveBeenLastCalledWith(0);

      // default store url from process env
      process.env.COMPONENT_STORE_URL = 'https://c.com';
      await bundle.run({
        createRelease: true,
      });
      expect(mockExit).toHaveBeenLastCalledWith(0);

      delete process.env.COMPONENT_STORE_URL;
    }, 60_000);
  });

  describe('blocklet-screenshots', () => {
    it('should be bundle successfully!', async () => {
      const dir = path.join(__dirname, '../assets/blocklet-screenshots');
      spyOn(process, 'cwd').mockReturnValue(dir);
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      cleanBundleDir(dir);
      await bundle.run({
        zip: true,
        createRelease: true,
      });
      expect(mockExit).toHaveBeenCalledWith(0);

      const screenshotsBundleDir = path.join(dir, '.blocklet/bundle', 'screenshots');

      expect(
        fs.pathExistsSync(path.join(screenshotsBundleDir, 'QmQ2JrzUREtkvzQsTU88zXPWnnWyFncxsJK4ofYJ88GTJq.webp'))
      ).toBeTruthy();
      expect(
        fs.pathExistsSync(path.join(screenshotsBundleDir, 'Qmeh2eM8s86x1EWH1SdAv5A23YHekfnaPfsJUThk6TrWbY.jpeg'))
      ).toBeTruthy();
    }, 60_000);
  });

  describe('blocklet-logo-check', () => {
    it('should exit with 1 when validateLogo failed!', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      validateLogo.mockReturnValue(['any error message']);
      try {
        const dir = path.join(__dirname, '../assets/blocklet-logo');
        spyOn(process, 'cwd').mockReturnValue(dir);
        cleanBundleDir(dir);
        await bundle.run({
          zip: true,
          createRelease: true,
        });
      } catch (e) {
        // do nothing
      } finally {
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(validateLogo).toHaveBeenCalledWith('logo.gif', expect.any(Object));
      }
    }, 60_000);
  });

  describe('blocklet-screenshots-check', () => {
    it('should exit with 1 when validateScreenshots failed!', async () => {
      const mockExit = spyOn(process, 'exit').mockImplementation(() => {});
      validateScreenshots.mockReturnValue(['any error message']);
      try {
        const dir = path.join(__dirname, '../assets/blocklet-screenshots-invalid');
        spyOn(process, 'cwd').mockReturnValue(dir);
        cleanBundleDir(dir);
        await bundle.run({
          zip: true,
          createRelease: true,
        });
      } catch (e) {
        // do nothing
      } finally {
        expect(mockExit).toHaveBeenCalledWith(1);
        expect(validateScreenshots).toHaveBeenCalledWith(
          ['first.png', 'second.png', '400x400.png', 'first.png', 'second.png'],
          expect.any(Object)
        );
      }
    }, 60_000);
  });
});

const { getMode } = bundle;
describe('getMode', () => {
  it('should return "compact" when useCompact is true', () => {
    expect(getMode({}, { useCompact: true })).toBe('compact');
  });

  it('should return "simple" when useSimple is true', () => {
    expect(getMode({}, { useSimple: true })).toBe('simple');
  });

  it('should return "zip" for static group or when useZip is true', () => {
    expect(getMode({ group: 'static' })).toBe('zip');
    expect(getMode({}, { useZip: true })).toBe('zip');
  });

  it('should return "simple" for gateway group', () => {
    expect(getMode({ group: 'gateway' })).toBe('simple');
  });

  it('should return "zip" when group is not defined', () => {
    expect(getMode({})).toBe('zip');
  });

  it('should return "zip" when group is "static"', () => {
    expect(getMode({ group: 'static' })).toBe('zip');
  });

  it('should return "simple" as default when no conditions are met', () => {
    expect(getMode({ group: 'other' })).toBe('simple');
  });
});
