const { describe, expect, test, afterEach, mock, afterAll } = require('bun:test');

mock.module('@abtnode/util/lib/can-pkg-rw', () => {
  return {
    __esModule: true,
    default: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { BLOCKLET_STORE_URL, BLOCKLET_LAUNCHER_URL } = require('@abtnode/constant');
const canPackageReadWrite = require('@abtnode/util/lib/can-pkg-rw');
const lib = require('../../lib/util/default-node-config');

describe('#node', () => {
  afterEach(() => {
    mock.clearAllMocks();
  });

  describe('#defaultNodeConfigs', () => {
    test('should getDefaultValue be a function', () => {
      Object.keys(lib.defaultNodeConfigs).forEach((key) => {
        expect(typeof lib.defaultNodeConfigs[key].getDefaultValue).toBe('function');
      });
    });

    test('should blockletRegistry be the default blocklet registry url', async () => {
      const list = await lib.defaultNodeConfigs.blockletRegistryList.getDefaultValue();
      expect(list.length).toBe(3);
      expect(list[0].url).toBe(BLOCKLET_STORE_URL);
    });

    test('should registerUrl be the default node register url', async () => {
      expect(await lib.defaultNodeConfigs.registerUrl.getDefaultValue()).toBe(BLOCKLET_LAUNCHER_URL);
    });
  });

  describe('#getDefaultAutoUpgrade', () => {
    test('should return true if support auto upgrade', async () => {
      canPackageReadWrite.mockReturnValue(true);

      const res = await lib.getDefaultAutoUpgrade();
      expect(canPackageReadWrite).toHaveBeenCalledTimes(1);
      expect(res).toBe(true);
    });

    test('should return false if does not support auto upgrade', async () => {
      canPackageReadWrite.mockReturnValue(false);
      const res = await lib.getDefaultAutoUpgrade();
      expect(canPackageReadWrite).toHaveBeenCalledTimes(1);
      expect(res).toBe(false);
    });

    test('should return false if something went wrong', async () => {
      canPackageReadWrite.mockImplementation(() => {
        throw new Error('test error');
      });

      const res = await lib.getDefaultAutoUpgrade();

      expect(res).toBe(false);
      expect(canPackageReadWrite).toHaveBeenCalledTimes(1);
    });
  });
});
