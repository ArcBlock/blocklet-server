const { describe, expect, beforeEach, it, spyOn, afterAll, afterEach, mock } = require('bun:test');

const mockValidateLogo = mock();
mock.module('@blocklet/images', () => ({
  __esModule: true,
  validateLogo: (...args) => mockValidateLogo(...args),
}));

mock.module('../../../../lib/util', () => ({
  print: mock().mockImplementation(() => {}),
  printWarning: mock().mockImplementation(() => {}),
  printError: mock().mockImplementation(() => {}),
  printInfo: mock().mockImplementation(() => {}),
}));

mock.module('fs-extra', () => ({
  copy: mock(),
  __esModule: true,
}));
mock.module('image-size', () => ({
  default: mock(),
  __esModule: true,
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const chalk = require('chalk');
const fsExtra = require('fs-extra');
const LogoBundler = require('../../../../lib/commands/blocklet/bundle/bundlers/logo');
const { printError, printWarning, printInfo } = require('../../../../lib/util');

const printErrorMock = printError;
const printWarningMock = printWarning;
const printInfoMock = printInfo;
const fsExtraMock = fsExtra;

describe('logo.spec', () => {
  const blockletDir = 'test-folder';
  const minSide = 256;

  let processExitSpy = null;

  beforeEach(() => {
    mockValidateLogo.mockReturnValue([]);
    processExitSpy = spyOn(process, 'exit').mockReturnValue(() => {});
  });

  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('#bundle()', () => {
    it('should call validateLogo with correct params', async () => {
      await new LogoBundler({ blockletDir }).bundle();

      expect(mockValidateLogo).toHaveBeenCalledWith('', {
        extractedFilepath: blockletDir,
        width: 256,
        maxSize: 1024,
      });
    });

    it('should print error messages when validateLogo returns error messages and exit with 1', async () => {
      mockValidateLogo.mockReturnValue(['error1', 'error2']);
      await new LogoBundler({ blockletDir, minSide }).bundle();

      expect(printWarningMock).toHaveBeenCalledWith(
        'Blocklet bundle failed! Please check the following errors about logo:'
      );
      expect(printErrorMock).toHaveBeenCalledWith('error1');
      expect(printErrorMock).toHaveBeenCalledWith('error2');
      expect(printInfoMock).toHaveBeenCalledWith(
        `You can run the command "${chalk.cyan('blocklet dev studio')}" to help you generate more standard images.`
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should copy the logo file to the target folder', async () => {
      await new LogoBundler({ blockletDir }).bundle();

      expect(fsExtraMock.copy).toHaveBeenCalledWith(blockletDir, `${blockletDir}/.blocklet/bundle`);
    });
  });
});
