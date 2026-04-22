const { describe, expect, test, beforeEach, mock, spyOn, afterAll, beforeAll } = require('bun:test');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { types } = require('@ocap/mcrypto');

mock.module('@abtnode/util/lib/cloud', () => ({
  isInCloud: mock(() => Promise.resolve(false)),
}));
mock.module('@abtnode/util/lib/get-ip', () => ({
  __esModule: true,
  default: mock(() => Promise.resolve()),
}));

afterAll(() => {
  mock.restore();
});

const getIP = require('@abtnode/util/lib/get-ip');
const cloud = require('@abtnode/util/lib/cloud');
const { DEFAULT_DESCRIPTION, NODE_MODES } = require('@abtnode/constant');

const lib = require('../../lib/util');

const { version: VERSION } = require('../../package.json');
const { isValidMode } = require('../../lib/util');

const { getGitHash, getDevUrl, formatGQLError, getWallet, isValidYamlFileName, getCLIVersion, readInitInfoFromEc2 } =
  lib;

describe('unit', () => {
  beforeEach(() => {
    cloud.isInCloud.mockReset();
    // getIP.mockReset();
  });

  afterAll(() => {
    cloud.isInCloud.mockReset();
    // getIP.mockReset();
  });

  describe('getGitHash', () => {
    test('should return hash', () => {
      expect(getGitHash(process.cwd())).toBeTruthy();
    });
  });

  describe('getDevUrl', () => {
    test('should be a function', () => {
      expect(typeof getDevUrl).toBe('function');
    });

    test('should return gitpod url', async () => {
      const res = await getDevUrl({
        isGitpod: () => true,
        gitpodWorkspaceURL: 'http://gitpodWorkspaceURL.com',
        abtnodeHttpPort: '8080',
      });

      expect(res).toBe('http://8080-gitpodWorkspaceURL.com');
    });

    test('should return local url in Docker', async () => {
      const res = await getDevUrl({
        isGitpod: () => false,
        isDocker: () => true,
      });

      expect(res).toBe('http://127.0.0.1');
    });

    test('should return inject url', async () => {
      const res = await getDevUrl({
        isGitpod: () => false,
        isDocker: () => false,
        getUrl: () => 'http://abtnodeurl.com',
      });

      expect(res).toBe('http://abtnodeurl.com');
    });

    test('should return ""', async () => {
      const res = await getDevUrl({
        isGitpod: () => false,
        isDocker: () => false,
        getUrl: () => null,
      });

      expect(res).toBe('');
    });
  });

  describe('formatGQLError', () => {
    test('should return join errors message if error.errors is an array', () => {
      expect(formatGQLError({ errors: [{ message: 'error1' }, { message: 'error2' }] })).toEqual(
        ['error1', 'error2'].join(', ')
      );
    });

    test('should return error.message if error.errors is not an array', () => {
      expect(formatGQLError({ message: 'error_message' })).toEqual('error_message');
    });
  });

  describe('getWallet', () => {
    test('should return expected wallet object', () => {
      const sk =
        '0xe6ffabf03cb6acffb49c7d5e22b74b9fee4ad9055433128394bcee99c56c5d84f112b4565e564fc94ca4bfc43977cf5ecd56338323b02c0322c6bbb37cd8bdc0';

      const wallet = getWallet(sk);
      expect(wallet.type.role).toEqual(types.RoleType.ROLE_APPLICATION);
      expect(wallet.type.pk).toEqual(types.KeyType.ED25519);
      expect(wallet.type.hash).toEqual(types.HashType.SHA3);
    });
  });

  describe('isValidYamlFileName', () => {
    test('should .yml and .yaml file are all valid', () => {
      expect(isValidYamlFileName('a.yml')).toEqual(true);
      expect(isValidYamlFileName('a.yaml')).toEqual(true);
    });

    test('should be case-insensitive', () => {
      expect(isValidYamlFileName('a.YML')).toEqual(true);
      expect(isValidYamlFileName('a.YAML')).toEqual(true);
    });

    test('should be invalid except .yml or .yaml file', () => {
      expect(isValidYamlFileName('yml')).toEqual(false);
      expect(isValidYamlFileName('yaml')).toEqual(false);
      expect(isValidYamlFileName('a.c')).toEqual(false);
      expect(isValidYamlFileName('a.d')).toEqual(false);
    });
  });

  describe('getCLIVersion', () => {
    test('should return expected version', () => {
      expect(getCLIVersion()).toEqual(VERSION);
    });
  });

  describe('readInitInfoFromEc2', () => {
    const testFile = path.join(os.tmpdir(), 'abtnode-test-user-data');
    beforeAll(() => {
      fs.writeFileSync(testFile, JSON.stringify({ test: 'abtnode' }, null, 2));
    });

    test('should read correctly', () => {
      spyOn(path, 'join').mockImplementation(() => testFile);
      const res = readInitInfoFromEc2();
      expect(res.test).toEqual('abtnode');
    });
  });

  describe('#getDefaultName', () => {
    test('should contains the current user name', () => {
      expect(lib.getDefaultName()).toMatch(new RegExp(`${os.userInfo().username}`));
    });
  });

  describe('#getDefaultDescription', () => {
    test('should return ip description if normal', async () => {
      lib.getIpDescription = mock().mockImplementation(() => ({ description: 'test-description' }));
      const { description } = await lib.getIpDescription();

      expect(lib.getIpDescription.mock.calls.length).toBe(1);
      expect(await lib.getDefaultDescription()).toEqual(description);
    });

    test('should return default description if something went wrong', async () => {
      lib.getIpDescription = mock().mockImplementation(() => {
        throw new Error('test error');
      });

      const result = await lib.getDefaultDescription();

      expect(result).toEqual(DEFAULT_DESCRIPTION);
      expect(lib.getIpDescription.mock.calls.length).toBe(1);
    });
  });

  describe('isValidMode', () => {
    test('should return true if mode is valid', () => {
      Object.values(NODE_MODES).forEach((mode) => {
        expect(isValidMode(mode)).toBe(true);
      });
    });

    test('should return false if mode is invalid', () => {
      expect(isValidMode('arcblock-abc-t')).toBe(false);
    });
  });

  describe('getAccessibleIps', () => {
    const nodeInfo = {
      routing: {
        adminPath: '/admin',
        port: 80,
      },
    };

    test('should not check if public ip is available in cloud', async () => {
      const mockIps = {
        internal: '127.0.0.1',
        external: '13.0.0.1',
      };
      const mockIsInCloud = spyOn(cloud, 'isInCloud').mockResolvedValue(true);

      getIP.mockResolvedValue(mockIps);
      const mockIsDaemonIpAccessible = spyOn(lib, 'isDaemonIpAccessible').mockResolvedValue(true);
      const result = await lib.getAccessibleIps(nodeInfo);

      expect(result).toEqual(mockIps);
      expect(mockIsInCloud).toHaveBeenCalledTimes(1);
      expect(mockIsDaemonIpAccessible).not.toHaveBeenCalled();

      mockIsDaemonIpAccessible.mockRestore();
    }, 20_000);

    test('should return public ip if it is available', async () => {
      const mockIps = {
        internal: '127.0.0.1',
        external: '13.0.0.1',
      };
      const mockIsInCloud = spyOn(cloud, 'isInCloud').mockResolvedValue(false);
      spyOn(getIP, 'default').mockResolvedValue(mockIps);
      const mockIsDaemonIpAccessible = spyOn(lib, 'isDaemonIpAccessible').mockResolvedValue(true);
      const result = await lib.getAccessibleIps(nodeInfo);

      expect(result).toEqual(mockIps);
      expect(mockIsInCloud).toHaveBeenCalledTimes(1);
      expect(mockIsDaemonIpAccessible).toHaveBeenCalled();

      mockIsDaemonIpAccessible.mockRestore();
    }, 20_000);

    test('should return public ip if it is available', async () => {
      const mockIps = {
        internal: '127.0.0.1',
        external: '13.0.0.1',
      };
      const mockIsInCloud = spyOn(cloud, 'isInCloud').mockResolvedValue(false);
      spyOn(getIP, 'call').mockResolvedValue(mockIps);
      const mockIsDaemonIpAccessible = spyOn(lib, 'isDaemonIpAccessible').mockResolvedValue(false);
      const result = await lib.getAccessibleIps(nodeInfo);

      expect(result).toEqual({ internal: mockIps.internal });
      expect(mockIsInCloud).toHaveBeenCalledTimes(1);
      expect(mockIsDaemonIpAccessible).toHaveBeenCalled();

      mockIsDaemonIpAccessible.mockRestore();
    }, 20_000);
  });
});
