const { expect, describe, mock, afterAll, it } = require('bun:test');

const realFs = require('fs-extra');

mock.module('node-stream-zip', () => {
  return {
    StreamZip: mock(),
  };
});

mock.module('fs-extra', () => {
  return {
    ...realFs,
    existsSync: mock(),
    move: mock(),
    removeSync: mock(),
  };
});

const warnMock = mock();

const loggerMock = mock(() => {
  return {
    warn: warnMock,
  };
});

require.cache[require.resolve('@abtnode/logger')] = {
  exports: loggerMock,
};

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
  delete require.cache[require.resolve('@abtnode/logger')];
});

const { Readable } = require('stream');
const { existsSync, move } = require('fs-extra');

function stringToStream(str) {
  const stream = new Readable();
  stream.push(str);
  stream.push(null);

  return stream;
}

const { compareHash, compareAndMove } = require('../../../../lib/blocklet/storage/utils/hash');

describe(__filename, () => {
  describe('#compareHash', () => {
    it('should be return true when content is same', async () => {
      const stream1 = stringToStream('233');
      const stream2 = stringToStream('233');

      expect(await compareHash(stream1, stream2)).toBeTruthy();
    });

    it('should be return true when content is not same', async () => {
      const stream1 = stringToStream('233');
      const stream2 = stringToStream('error');

      expect(await compareHash(stream1, stream2)).toBeFalsy();
    });
  });

  describe('#compareAndMove', () => {
    const source = 'oldFilePath.zip.bak';
    const target = 'oldFilePath.zip';

    it('should be move newFilePath to oldFilePath when source is not found', async () => {
      existsSync.mockReturnValueOnce(true);
      existsSync.mockReturnValueOnce(false);

      await compareAndMove(source, target);

      expect(existsSync).toHaveBeenCalledWith(target);
      expect(move).toHaveBeenCalledWith(source, target, { overwrite: true });
    });

    it('should throw an error when newFilePath is not found', async () => {
      existsSync.mockReturnValueOnce(false);
      existsSync.mockReturnValueOnce(true);

      // eslint-disable-next-line global-require
      const logger = require('@abtnode/logger')('@abtnode/core:storage.utils.hash');

      await compareAndMove(source, target);

      expect(logger.warn).toHaveBeenCalledWith(`Source(${source}) not found`);
      expect(existsSync).toHaveBeenCalledWith(source);
    });
  });
});
