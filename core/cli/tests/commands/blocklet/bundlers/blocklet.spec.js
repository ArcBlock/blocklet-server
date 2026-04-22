const { describe, expect, beforeEach, it, spyOn, afterAll, mock } = require('bun:test');

mock.module('../../../../lib/util', () => ({
  print: mock().mockImplementation(() => {}),
  printError: mock().mockImplementation(() => {}),
  printWarning: mock().mockImplementation(() => {}),
}));
mock.module('fast-glob', () => ({
  sync: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const chalk = require('chalk');
const { sync } = require('fast-glob');
const BlockletMdBundler = require('../../../../lib/commands/blocklet/bundle/bundlers/blocklet');
const { printError, printWarning } = require('../../../../lib/util');

const fgSyncMock = sync;
const printErrorMock = printError;
const printWarningMock = printWarning;

describe('BlockletMdBundler', () => {
  const blockletDir = 'test-folder';
  const blockletMdFileName = 'blocklet.md';
  const backupMdFileNames = ['blocklet.en.md', 'README.md'];
  const duplicateMdFileName = ['blocklet.en.md'];
  const required = true;

  let processExitSpy;

  const clearAll = () => {
    mock.clearAllMocks();
    processExitSpy = spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(code);
    });
  };

  describe('#bundle()', () => {
    beforeEach(clearAll);

    it('should be find successfully by blockletMdFileName', async () => {
      fgSyncMock.mockReturnValue(['blocklet.md']);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
      });

      const found = await blockletMdBundler._find();

      expect(found).toEqual(['blocklet.md']);
      expect(fgSyncMock).toHaveBeenCalledWith(blockletMdFileName, {
        cwd: blockletDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
    });

    it('should be find successfully by blockletMdFileName && duplicated', async () => {
      fgSyncMock.mockReturnValueOnce([blockletMdFileName]).mockReturnValueOnce([duplicateMdFileName]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        duplicateMdFileName,
        required,
      });

      const found = await blockletMdBundler._find();

      expect(fgSyncMock).toHaveBeenLastCalledWith(duplicateMdFileName, {
        cwd: blockletDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
      expect(printWarningMock).toHaveBeenCalledWith(
        `File ${chalk.cyan(blockletMdFileName)} is currently in use, file ${chalk.yellow(
          duplicateMdFileName
        )} is ignored`
      );

      expect(found).toEqual([blockletMdFileName]);
    });

    it('should be find successfully by backupMdFileNames', async () => {
      fgSyncMock.mockReturnValueOnce([]).mockReturnValueOnce([backupMdFileNames]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        backupMdFileNames,
      });

      const found = await blockletMdBundler._find();

      expect(found).toEqual([backupMdFileNames]);
      expect(fgSyncMock).toHaveBeenCalledTimes(2);
      expect(fgSyncMock).toHaveBeenLastCalledWith(backupMdFileNames[0], {
        cwd: blockletDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
    });

    it('should be find successfully by backupMdFileName, but files number > 1', async () => {
      fgSyncMock.mockReturnValueOnce([blockletMdFileName, blockletMdFileName]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
      });

      printErrorMock.mockReturnValue();

      await expect(blockletMdBundler._find()).rejects.toThrow(new Error(1));

      expect(fgSyncMock).toHaveBeenCalledTimes(1);
      expect(printErrorMock).toBeCalledWith(
        `Only one ${chalk.red(blockletMdFileName)}(not case sensitive) can exist in ${chalk.cyan(blockletDir)}`
      );
      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should be find successfully by backupMdFileName, but files number > 1', async () => {
      fgSyncMock.mockReturnValueOnce([]).mockReturnValueOnce([backupMdFileNames[0], backupMdFileNames[0]]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        backupMdFileNames,
      });

      printErrorMock.mockReturnValue();

      await expect(blockletMdBundler._find()).rejects.toThrow(new Error(1));

      expect(fgSyncMock).toHaveBeenCalledTimes(2);
      expect(printErrorMock).toBeCalledWith(
        `Only one ${chalk.red(backupMdFileNames[0])}(not case sensitive) can exist in ${chalk.cyan(blockletDir)}`
      );
      expect(processExitSpy).toHaveBeenCalled();
    });

    it('should be find failed by blockletMdFileName', async () => {
      fgSyncMock.mockReturnValue([]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
      });

      const found = await blockletMdBundler._find();

      expect(found).toEqual([]);
      expect(fgSyncMock).toHaveBeenCalledWith(blockletMdFileName, {
        cwd: blockletDir,
        deep: 1,
        caseSensitiveMatch: false,
        onlyFiles: true,
        absolute: true,
      });
    });

    it('should be find failed by blockletMdFileName && not backupMdFileNames && required', async () => {
      fgSyncMock.mockReturnValue([]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        required,
      });

      await expect(blockletMdBundler._find()).rejects.toThrow(new Error(1));

      expect(printErrorMock).toBeCalledWith(
        `File ${chalk.red(blockletMdFileName)} must exist in ${chalk.cyan(blockletDir)}`
      );
    });

    it('should be find failed by backupMdFileNames', async () => {
      fgSyncMock.mockReturnValueOnce([]).mockReturnValue([]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        backupMdFileNames,
      });

      const found = await blockletMdBundler._find();

      expect(found).toEqual([]);
      expect(fgSyncMock).toHaveBeenCalledTimes(backupMdFileNames.length + 1);
    });

    it('should be find failed by backupMdFileName && required', async () => {
      fgSyncMock.mockReturnValue([]);
      const blockletMdBundler = new BlockletMdBundler({
        blockletDir,
        blockletMdFileName,
        backupMdFileNames,
        required,
      });

      printErrorMock.mockReturnValue();

      await expect(blockletMdBundler._find()).rejects.toThrow(new Error(1));

      expect(fgSyncMock).toHaveBeenCalledTimes(backupMdFileNames.length + 1);
      expect(printErrorMock).toBeCalledWith(
        `Either ${chalk.red(blockletMdFileName)} or ${backupMdFileNames
          .map((backupMdFileName) => chalk.red(backupMdFileName))
          .join(',')} should exist in ${chalk.cyan(blockletDir)}`
      );
      expect(processExitSpy).toHaveBeenCalled();
    });
  });
});
