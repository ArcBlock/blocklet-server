/* eslint-disable require-await */
const { describe, expect, beforeEach, it, spyOn, afterAll, afterEach, mock } = require('bun:test');
const chalk = require('chalk');
const realFsExtra = require('fs-extra');
const realFs = require('fs');

// ------------------------------------------------------
// mock definitions (must come before requiring ScreenshotBundler)
// ------------------------------------------------------
const mockValidateScreenshots = mock(() => []);
mock.module('@blocklet/images', () => ({
  __esModule: true,
  validateScreenshots: mockValidateScreenshots,
}));

mock.module('@arcblock/ipfs-only-hash', () => ({
  __esModule: true,
  onlyHash: mock(async () => 'hash'),
}));

require.cache[require.resolve('fs')] = {
  exports: {
    __esModule: true,
    ...realFs,
    createReadStream: mock(() => ({
      pipe: () => {},
      on: () => {},
    })),
  },
};

mock.module('fs-extra', () => ({
  __esModule: true,
  ...realFsExtra,
  pathExists: mock(async () => true),
  pathExistsSync: mock(() => true),
  statSync: mock(() => ({ isFile: () => true })),
  createReadStream: mock(() => ({
    pipe: () => {},
    on: () => {},
  })),
  copy: mock(async () => {}),
  ensureDir: mock(async () => {}),
  emptyDir: mock(async () => {}),
}));

const printError = mock(() => {});
const printWarning = mock(() => {});
const printInfo = mock(() => {});
mock.module('../../../../lib/util', () => ({
  __esModule: true,
  print: mock(() => {}),
  printError,
  printWarning,
  printInfo,
}));

mock.module('image-size', () => ({
  __esModule: true,
  default: mock(() => {}),
}));

afterAll(() => {
  mock.restore();
  delete require.cache[require.resolve('fs')];
});

const fsExtra = require('fs-extra');
const ScreenshotBundler = require('../../../../lib/commands/blocklet/bundle/bundlers/screenshots');

describe('screenshot.spec', () => {
  const blockletDir = 'test-folder';
  const bundleDir = 'bundle-folder';
  let processExitSpy = null;

  beforeEach(() => {
    mockValidateScreenshots.mockReturnValue([]);
    spyOn(fsExtra, 'pathExists').mockResolvedValue(true);
    spyOn(fsExtra, 'createReadStream').mockResolvedValue(true);
    processExitSpy = spyOn(process, 'exit').mockReturnValue(() => {});
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('#bundle()', () => {
    it('should call validateScreenshots with correct params', async () => {
      await new ScreenshotBundler({
        blockletDir,
        bundleDir,
        meta: { screenshots: ['temp-screenshot.png'] },
      }).bundle();

      expect(mockValidateScreenshots).toHaveBeenCalledWith(['temp-screenshot.png'], {
        extractedFilepath: 'test-folder',
        minWidth: 600,
      });
    });

    it('should print error messages when validateScreenshots returns error messages and exit with 1', async () => {
      mockValidateScreenshots.mockReturnValue(['error1', 'error2']);
      await new ScreenshotBundler({
        blockletDir,
        bundleDir,
        meta: { screenshots: ['temp-screenshot.png'] },
      }).bundle();

      expect(printWarning).toHaveBeenCalledWith(
        'Blocklet bundle failed! Please check the following errors about screenshots:'
      );
      expect(printError).toHaveBeenCalledWith('error1');
      expect(printError).toHaveBeenCalledWith('error2');
      expect(printInfo).toHaveBeenCalledWith(
        `You can run the command "${chalk.cyan('blocklet dev studio')}" to help you generate more standard screenshots.`
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should generate the hash of the screenshots and keep the extension', async () => {
      const meta = { screenshots: ['temp-screenshot.png'] };
      await new ScreenshotBundler({
        blockletDir,
        bundleDir,
        meta,
      }).bundle();

      expect(meta).toEqual({ screenshots: ['hash.png'] });
    });
  });
});
