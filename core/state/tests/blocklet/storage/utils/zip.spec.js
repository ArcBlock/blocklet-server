/* eslint-disable max-classes-per-file */
const { expect, describe, mock, it, afterAll } = require('bun:test');

const extractMock = mock();
const closeMock = mock();
const constructorMock = mock();

mock.module('node-stream-zip', () => {
  class StreamZipMock {
    constructor(options) {
      constructorMock(options);
      this.options = options;
      this.extract = extractMock;
      this.close = closeMock;
    }

    static sync = mock();

    static async = StreamZipMock; // ✅ 支持 new StreamZip.async()
  }

  StreamZipMock.prototype.extract = extractMock;
  StreamZipMock.prototype.close = closeMock;

  return {
    __esModule: true,
    default: StreamZipMock,
    sync: StreamZipMock,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
});

const StreamZip = require('node-stream-zip');
const { zipToDir } = require('../../../../lib/blocklet/storage/utils/zip');

describe(__filename, () => {
  describe('#zipToDir', () => {
    it('should work', async () => {
      const source = 'test-folder.zip';
      const target = 'test-folder';

      await zipToDir(source, target);

      expect(constructorMock).toBeCalledWith({
        file: source,
      });
      expect(StreamZip.async.prototype.extract).toBeCalledWith(null, target);
      expect(StreamZip.async.prototype.close).toBeCalled();
    });
  });
});
