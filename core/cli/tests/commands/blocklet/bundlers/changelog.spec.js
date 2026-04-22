const { describe, expect, beforeEach, it, spyOn, afterAll, mock } = require('bun:test');

mock.module('../../../../lib/util', () => ({
  print: mock().mockImplementation(() => {}),
  printWarning: mock().mockImplementation(() => {}),
  printError: mock().mockImplementation(() => {}),
}));
mock.module('fast-glob', () => ({
  __esModule: true,
  default: {
    sync: mock(),
  },
}));
mock.module('@abtnode/util/lib/detect-workspace', () => ({
  __esModule: true,
  default: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const detectWorkspace = require('@abtnode/util/lib/detect-workspace');
const chalk = require('chalk');
const { sync } = require('fast-glob');
const ChangelogBundler = require('../../../../lib/commands/blocklet/bundle/bundlers/changelog');
const { printError } = require('../../../../lib/util');

const fgSyncMock = sync;
const printErrorMock = printError;
const detectWorkspaceMock = detectWorkspace;

beforeEach(() => {
  mock.clearAllMocks();
});

describe('changelog.spec', () => {
  const changelogFileName = 'CHANGELOG.md';
  const blockletDir = 'test-folder';
  const inMonoRepo = true;
  const monoRepoDir = 'monorepo-folder';

  describe('#_find()', () => {
    it('should be find successfully by changelogFileName', async () => {
      fgSyncMock.mockReturnValue([changelogFileName]);
      const changelogBundler = new ChangelogBundler({
        blockletDir,
      });

      const found = await changelogBundler._find();

      expect(found).toEqual(changelogFileName);
      expect(fgSyncMock).toHaveBeenCalledWith(changelogFileName, {
        cwd: blockletDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
    });

    it('should be find successfully by changelogFileName, but too many files', async () => {
      fgSyncMock.mockReturnValue([changelogFileName, changelogFileName]);
      const changelogBundler = new ChangelogBundler({
        blockletDir,
      });

      printErrorMock.mockReturnValue();
      const processExitSpy = spyOn(process, 'exit').mockReturnValue();

      await changelogBundler._find();

      expect(fgSyncMock).toHaveBeenCalledTimes(1);
      expect(printErrorMock).toHaveBeenLastCalledWith(
        `Only one ${chalk.red(changelogFileName)}(not case sensitive) can exist in ${chalk.cyan(blockletDir)}`
      );
      expect(processExitSpy).toHaveBeenCalledTimes(1);
    });

    it('should be find failed by changelogFileName', async () => {
      fgSyncMock.mockReturnValue([]);
      const changelogBundler = new ChangelogBundler({
        blockletDir,
      });

      const found = await changelogBundler._find();

      expect(fgSyncMock).toHaveBeenCalledTimes(1);
      expect(found).toBeNull();
    });

    it('should be find successfully by monorepo,', async () => {
      fgSyncMock.mockReturnValueOnce([]).mockReturnValueOnce([changelogFileName]);
      const changelogBundler = new ChangelogBundler({
        blockletDir,
        inMonoRepo,
      });
      detectWorkspaceMock.mockReturnValue({
        type: 'yarn',
        dir: monoRepoDir,
      });
      const found = await changelogBundler._find();

      expect(fgSyncMock).toHaveBeenLastCalledWith(changelogFileName, {
        cwd: monoRepoDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
      expect(fgSyncMock).toHaveBeenCalledTimes(2);
      expect(found).toEqual(changelogFileName);
    });

    it('should be find successfully by monorepo, but too many files', async () => {
      fgSyncMock.mockReturnValueOnce([]).mockReturnValueOnce([changelogFileName, changelogFileName]);
      const changelogBundler = new ChangelogBundler({
        blockletDir,
        inMonoRepo,
      });
      detectWorkspaceMock.mockReturnValue({
        type: 'yarn',
        dir: monoRepoDir,
      });
      printErrorMock.mockReturnValue();
      const processExitSpy = spyOn(process, 'exit').mockReturnValue();
      await changelogBundler._find();

      expect(fgSyncMock).toHaveBeenCalledTimes(2);
      expect(printErrorMock).toHaveBeenCalledWith(
        `Only one ${chalk.red(changelogFileName)}(not case sensitive) can exist in ${chalk.cyan(monoRepoDir)}`
      );
      expect(processExitSpy).toBeCalledTimes(1);
    });
  });
});
