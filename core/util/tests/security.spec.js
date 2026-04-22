const { describe, expect, test, mock, beforeEach, spyOn, afterEach, afterAll } = require('bun:test');

mock.module('resolve/sync', () => {
  const fn = mock();
  fn.sync = mock();
  return {
    __esModule: true,
    default: fn,
  };
});
mock.module('which', () => {
  return {
    sync: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

// eslint-disable-next-line import/order
const which = require('which');
const crypto = require('crypto');
const os = require('os');
const resolve = require('resolve/sync');
const { dirname, join } = require('path');
const security = require('../lib/security');

describe('Security', () => {
  test('should encrypt and decrypt as expected: plain text', async () => {
    const cipher = security.encrypt('abcd', '1234567890', 'abcdefgh');
    const decrypted = await security.decrypt(cipher, '1234567890', 'abcdefgh');
    expect(decrypted).toBe('abcd');
  });

  test('should encrypt and decrypt as expected: buffer', async () => {
    const dek = crypto.randomBytes(32);
    const cipher = security.encrypt('abcd', '1234567890', dek);
    const decrypted = await security.decrypt(cipher, '1234567890', dek);
    expect(decrypted).toBe('abcd');
  });

  test('should formatEnv as expected', () => {
    const { formatEnv } = security;

    expect(formatEnv(null)).toBe(null);
    expect(formatEnv(undefined)).toBe(undefined);
    expect(formatEnv(true)).toBe(true);
    expect(formatEnv(false)).toBe(false);
    expect(formatEnv(0)).toBe(0);
    expect(formatEnv(1)).toBe(1);
    expect(formatEnv('a')).toBe('a');
    expect(formatEnv('a\nb')).toBe('a b');
    expect(formatEnv(['a'])).toBe('["a"]');
    expect(formatEnv({})).toBe('{}');
    expect(formatEnv([{ originFileObj: {}, url: 1 }])).toBe(1);
    expect(
      formatEnv([
        { originFileObj: {}, url: 1 },
        { originFileObj: {}, url: 2 },
      ])
    ).toEqual('[1,2]');

    expect(
      formatEnv(
        [
          { originFileObj: {}, url: 1 },
          { originFileObj: {}, url: 2 },
        ],
        false
      )
    ).toEqual([1, 2]);
    expect(formatEnv({}, false)).toEqual({});
  });

  describe('encodeEncryptionKey and decodeEncryptionKey', () => {
    const { encodeEncryptionKey, decodeEncryptionKey } = security;

    test('should encode and decode encryption key correctly', () => {
      const originalKey = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      const encoded = encodeEncryptionKey(originalKey);
      const decoded = decodeEncryptionKey(encoded);

      expect(decoded).toEqual(originalKey);
    });

    test('should handle empty key', () => {
      const originalKey = new Uint8Array([]);
      const encoded = encodeEncryptionKey(originalKey);
      const decoded = decodeEncryptionKey(encoded);

      expect(decoded).toEqual(originalKey);
    });

    test('should handle large key', () => {
      const originalKey = new Uint8Array(Array.from({ length: 256 }, (_, i) => i % 256));
      const encoded = encodeEncryptionKey(originalKey);
      const decoded = decodeEncryptionKey(encoded);

      expect(decoded).toEqual(originalKey);
    });

    test('should handle base64-url encoding correctly', () => {
      const originalKey = new Uint8Array([255, 255, 255, 255]);
      const encoded = encodeEncryptionKey(originalKey);

      // Should not contain +, /, or = characters
      expect(encoded).not.toContain('+');
      expect(encoded).not.toContain('/');
      expect(encoded).not.toContain('=');
    });
  });

  describe('canUseFileSystemIsolateApi', () => {
    const { canUseFileSystemIsolateApi } = security;
    const originalVersion = process.version;
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.version = originalVersion;
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('should return true for Node.js v21.6.0 in production', () => {
      process.version = 'v21.6.0';
      process.env.NODE_ENV = 'production';
      expect(canUseFileSystemIsolateApi()).toBe(true);
    });

    test('should return true for Node.js v22.0.0 in production', () => {
      process.version = 'v22.0.0';
      process.env.NODE_ENV = 'production';
      expect(canUseFileSystemIsolateApi()).toBe(true);
    });

    test('should return true for Node.js v20.0.0 in test environment', () => {
      process.version = 'v20.0.0';
      process.env.NODE_ENV = 'test';
      expect(canUseFileSystemIsolateApi()).toBe(true);
    });
  });

  describe('requiresSymlinkSafePermissions', () => {
    const { requiresSymlinkSafePermissions } = security;
    const originalVersion = process.version;

    afterEach(() => {
      process.version = originalVersion;
    });

    test('should return false for Node.js v22.21.0', () => {
      process.version = 'v22.21.0';
      expect(requiresSymlinkSafePermissions()).toBe(false);
    });

    test('should return true for Node.js v22.22.0', () => {
      process.version = 'v22.22.0';
      expect(requiresSymlinkSafePermissions()).toBe(true);
    });

    test('should return true for Node.js v22.23.0', () => {
      process.version = 'v22.23.0';
      expect(requiresSymlinkSafePermissions()).toBe(true);
    });

    test('should return true for Node.js v23.0.0', () => {
      process.version = 'v23.0.0';
      expect(requiresSymlinkSafePermissions()).toBe(true);
    });

    test('should return false for Node.js v21.0.0', () => {
      process.version = 'v21.0.0';
      expect(requiresSymlinkSafePermissions()).toBe(false);
    });
  });

  describe('getSecurityNodeOptions', () => {
    beforeEach(() => {
      spyOn(console, 'error').mockReturnValue();
    });

    const formatNodeOptions = () => {
      return Boolean(process.env.NODE_OPTIONS) && process.env.NODE_OPTIONS !== 'undefined'
        ? process.env.NODE_OPTIONS
        : '';
    };

    test('should throw an error if blocklet is not defined', () => {
      expect(security.getSecurityNodeOptions(undefined)).rejects.toThrow('blocklet is not defined');
    });

    test('should throw an error if NODE_OPTIONS includes --experimental-permission', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--experimental-permission';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --permission', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--permission';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --allow-fs-read', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--allow-fs-read';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --allow-fs-write', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--allow-fs-write';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --allow-addons', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--allow-addons';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --allow-child-process', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--allow-child-process';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should throw an error if NODE_OPTIONS includes --allow-worker', () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--allow-worker';
      expect(security.getSecurityNodeOptions({ environmentObj: {} })).rejects.toThrow(
        'process.env.NODE_OPTIONS should not include --experimental-permission or --permission or --allow-fs-read or --allow-fs-write or --allow-addons or --allow-child-process or --allow-worker'
      );
      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should return options without file system isolation enabled', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
        },
      };

      const result = await security.getSecurityNodeOptions(blocklet, false);

      expect(result).toBe(`${formatNodeOptions()}`.trim());
    });

    test('should return options with file system isolation enabled for development mode', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
          BLOCKLET_APP_DATA_DIR: '/app-data',
        },
        mode: 'development',
      };

      const homeDir = os.homedir();

      const result = await security.getSecurityNodeOptions(blocklet, true);

      expect(result).toBe(
        `${formatNodeOptions()} --permission --allow-fs-write=/data/* --allow-fs-write=/app/* --allow-fs-write=/log/* --allow-fs-write=/cache/* --allow-fs-write=/app-data/.projects/* --allow-fs-write=${os.tmpdir()}/* --allow-addons --allow-child-process --allow-worker --allow-fs-read=* --allow-fs-write=${join(
          homeDir,
          '.npm',
          '_logs'
        )}/*`.trim(' ')
      );
    });

    test('should return options with file system isolation enabled for production mode', async () => {
      // Pin to a version before 22.22.0 to test without symlink-safe permissions
      const originalVersion = process.version;
      process.version = 'v22.18.0';

      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/blocklet/.abtnode/data/zNKj/zNKj',
          BLOCKLET_APP_DIR: '/blocklet/.abtnode/blocklets/zNKj/1.0.0',
          BLOCKLET_LOG_DIR: '/blocklet/.abtnode/logs/zNKj',
          BLOCKLET_CACHE_DIR: '/blocklet/.abtnode/cache/zNKj',
          BLOCKLET_APP_DATA_DIR: '/blocklet/.abtnode/data/zNKj',
        },
        mode: 'production',
      };

      const homeDir = os.homedir();
      process.execPath = join(homeDir, '.nvm/versions/node/v22.3.0/bin/blocklet');
      const resolveSpy = resolve.mockReturnValue('/arcblock/blocklet-server/node_modules/@arcblock/pm2/index.js');
      const whichMeiliSearchSpy = which.sync.mockReturnValueOnce('/usr/local/bin/meilisearch');
      const blockletCliPath = join(homeDir, 'Library/pnpm/blocklet');
      const whichBlockletCliSpy = which.sync.mockReturnValueOnce(blockletCliPath);

      process.env.XDG_DATA_HOME = join(homeDir, '.pnpm');
      process.env.PNPM_HOME = join(homeDir, 'Library/pnpm');

      const result = await security.getSecurityNodeOptions(blocklet, true);

      const expectedOptions = [
        formatNodeOptions(),
        '--permission',
        '--allow-fs-write=/blocklet/.abtnode/data/zNKj/zNKj/*',
        '--allow-fs-write=/blocklet/.abtnode/blocklets/zNKj/1.0.0/*',
        '--allow-fs-write=/blocklet/.abtnode/logs/zNKj/*',
        '--allow-fs-write=/blocklet/.abtnode/cache/zNKj/*',
        '--allow-fs-write=/blocklet/.abtnode/data/zNKj/.projects/*',
        `--allow-fs-write=${os.tmpdir()}/*`,
        '--allow-addons',
        '--allow-child-process',
        '--allow-fs-read=/blocklet/.abtnode/logs/zNKj/*',
        '--allow-fs-read=/blocklet/.abtnode/cache/zNKj/*',
        '--allow-fs-read=/blocklet/.abtnode/data/zNKj/*',
        '--allow-fs-read=/blocklet/.abtnode/blocklets/*',
        '--allow-fs-read=/arcblock/blocklet-server/*',
        `--allow-fs-read=${blockletCliPath}/*`,
        '--allow-fs-read=/usr/local/bin/meilisearch/*',
        '--allow-fs-read=/data/bin/meilisearch/*',
        `--allow-fs-read=${dirname(dirname(process.execPath))}/*`,
        `--allow-fs-read=${process.cwd()}/*`,
        `--allow-fs-read=${os.tmpdir()}/*`,
        `--allow-fs-read=${homeDir}/.cursor-server/*`,
        '--allow-fs-read=/Applications/Cursor.app/*',
        `--allow-fs-read=${join(process.env.XDG_DATA_HOME, 'pnpm/global')}/*`,
        `--allow-fs-read=${join(process.env.PNPM_HOME, '/global')}/*`,
      ]
        .join(' ')
        .trim();

      expect(result).toBe(expectedOptions);

      expect(resolveSpy).toHaveBeenCalledWith('@arcblock/pm2', expect.anything());
      expect(whichMeiliSearchSpy).toHaveBeenCalledWith('meilisearch');
      expect(whichBlockletCliSpy).toHaveBeenCalledWith('blocklet');

      process.version = originalVersion;
    });

    test('should handle VSCode debug mode in development', async () => {
      const oldNodeOptions = process.env.NODE_OPTIONS;
      process.env.NODE_OPTIONS = '--inspect-brk=0.0.0.0:9229 ms-vscode.js-debug/src/bootloader.js';

      const blocklet = {
        environmentObj: {
          BLOCKLET_MODE: 'development',
        },
        mode: 'development',
      };

      const result = await security.getSecurityNodeOptions(blocklet, true);
      expect(result).toBe(process.env.NODE_OPTIONS);

      process.env.NODE_OPTIONS = oldNodeOptions;
    });

    test('should handle missing pm2 path', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
        },
        mode: 'production',
      };

      resolve.mockImplementation(() => {
        throw new Error('Module not found');
      });

      const result = await security.getSecurityNodeOptions(blocklet, true);
      expect(result).toContain('--permission');
      expect(result).toContain('--allow-addons');
      expect(result).toContain('--allow-child-process');
    });

    test('should handle missing meilisearch executable', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
        },
        mode: 'production',
      };

      which.sync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await security.getSecurityNodeOptions(blocklet, true);
      expect(result).toContain('--permission');
      expect(result).toContain('--allow-addons');
      expect(result).toContain('--allow-child-process');
    });

    test('should skip permission management for PAGES_KIT_DID (trusted blocklet)', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
          BLOCKLET_APP_DATA_DIR: '/app-data',
          BLOCKLET_COMPONENT_DID: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', // PAGES_KIT_DID
        },
        mode: 'production',
      };

      const result = await security.getSecurityNodeOptions(blocklet, true);

      // Trusted blocklets skip permission management, but may retain other NODE_OPTIONS (e.g., --max_old_space_size)
      expect(result).not.toContain('--permission');
      expect(result).not.toContain('--allow-fs-read');
      expect(result).not.toContain('--allow-fs-write');
      expect(result).not.toContain('--allow-addons');
      expect(result).not.toContain('--allow-child-process');
    });

    test('should skip permission management for ARCBLOCK_METRICS_DID (trusted blocklet)', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/data',
          BLOCKLET_APP_DIR: '/app',
          BLOCKLET_LOG_DIR: '/log',
          BLOCKLET_CACHE_DIR: '/cache',
          BLOCKLET_APP_DATA_DIR: '/app-data',
          BLOCKLET_COMPONENT_DID: 'z8iZjMn7Hcyh93rKf8PqcSM94XnS8nRqSrPoP', // ARCBLOCK_METRICS_DID
        },
        mode: 'production',
      };

      const result = await security.getSecurityNodeOptions(blocklet, true);

      // Trusted blocklets skip permission management, but may retain other NODE_OPTIONS (e.g., --max_old_space_size)
      expect(result).not.toContain('--permission');
      expect(result).not.toContain('--allow-fs-read');
      expect(result).not.toContain('--allow-fs-write');
      expect(result).not.toContain('--allow-addons');
      expect(result).not.toContain('--allow-child-process');
    });

    test('should NOT skip permission management for child blocklet even when parent app (BLOCKLET_DID) is trusted', async () => {
      // Child blocklet (e.g., image-bin) with non-trusted BLOCKLET_COMPONENT_DID
      // Even though BLOCKLET_DID points to trusted pages-kit, child should NOT inherit trust
      const childBlocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/blocklet/.abtnode/data/zNKj/zNKj',
          BLOCKLET_APP_DIR: '/blocklet/.abtnode/blocklets/zNKj/1.0.0',
          BLOCKLET_LOG_DIR: '/blocklet/.abtnode/logs/zNKj',
          BLOCKLET_CACHE_DIR: '/blocklet/.abtnode/cache/zNKj',
          BLOCKLET_APP_DATA_DIR: '/blocklet/.abtnode/data/zNKj',
          BLOCKLET_COMPONENT_DID: 'z8iZchildBlockletDID', // Not in trusted list
          BLOCKLET_DID: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', // pages-kit DID (parent app)
        },
        mode: 'production',
      };

      resolve.mockReturnValue(null);
      which.sync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await security.getSecurityNodeOptions(childBlocklet, true);

      // Child blocklets do NOT inherit trust from parent, permission management should be enabled
      expect(result).toContain('--permission');
    });

    test('should NOT skip permission management for untrusted blocklet', async () => {
      const blocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/blocklet/.abtnode/data/zNKj/zNKj',
          BLOCKLET_APP_DIR: '/blocklet/.abtnode/blocklets/zNKj/1.0.0',
          BLOCKLET_LOG_DIR: '/blocklet/.abtnode/logs/zNKj',
          BLOCKLET_CACHE_DIR: '/blocklet/.abtnode/cache/zNKj',
          BLOCKLET_APP_DATA_DIR: '/blocklet/.abtnode/data/zNKj',
          BLOCKLET_COMPONENT_DID: 'z8iZuntrustedBlockletDID', // Not in trusted list
        },
        mode: 'production',
      };

      resolve.mockReturnValue(null);
      which.sync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await security.getSecurityNodeOptions(blocklet, true);

      // Untrusted blocklets should have permission management enabled
      expect(result).toContain('--permission');
      expect(result).toContain('--allow-fs-write=/blocklet/.abtnode/blocklets/zNKj/1.0.0/*');
    });

    test('should NOT skip permission management for child blocklet when BLOCKLET_DID (parent app) is NOT trusted', async () => {
      // Child blocklet with non-trusted BLOCKLET_COMPONENT_DID and non-trusted BLOCKLET_DID
      const childBlocklet = {
        environmentObj: {
          BLOCKLET_DATA_DIR: '/blocklet/.abtnode/data/zNKj/zNKj',
          BLOCKLET_APP_DIR: '/blocklet/.abtnode/blocklets/zNKj/1.0.0',
          BLOCKLET_LOG_DIR: '/blocklet/.abtnode/logs/zNKj',
          BLOCKLET_CACHE_DIR: '/blocklet/.abtnode/cache/zNKj',
          BLOCKLET_APP_DATA_DIR: '/blocklet/.abtnode/data/zNKj',
          BLOCKLET_COMPONENT_DID: 'z8iZchildBlockletDID', // Not in trusted list
          BLOCKLET_DID: 'z8iZuntrustedParentDID', // Not in trusted list
        },
        mode: 'production',
      };

      resolve.mockReturnValue(null);
      which.sync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = await security.getSecurityNodeOptions(childBlocklet, true);

      // Neither child nor parent is trusted, permission management should be enabled
      expect(result).toContain('--permission');
    });
  });

  // generate by github copilot
  describe('patchResponseHeader', () => {
    const { patchResponseHeader } = security;

    let nodeMock;
    let blockletMock;

    beforeEach(() => {
      nodeMock = {
        getBlockletDomainAliases: mock(),
        getNodeInfo: mock(),
      };
      blockletMock = {
        settings: {},
      };
    });

    test('should return original config if contentSecurityPolicy.directives is not defined', async () => {
      const rawConfig = {};
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result).toEqual(rawConfig);
    });

    test('should modify contentSecurityPolicy.directives correctly in development mode', async () => {
      process.env.NODE_ENV = 'development';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'default-src': [],
            'script-src': [],
            'connect-src': [],
          },
        },
      };
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.contentSecurityPolicy.directives['default-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['script-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['script-src']).toContain("'unsafe-inline'");
      expect(result.contentSecurityPolicy.directives['script-src']).toContain("'unsafe-eval'");
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain('ws://localhost:3040');
    });

    test('should add domain aliases to connect-src directive', async () => {
      process.env.NODE_ENV = 'production';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'connect-src': [],
          },
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([{ value: 'example.com' }]);
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain('https://example.com/.well-known/ping');
    });

    test('should add specific URLs to script-src and frame-src directives', async () => {
      process.env.NODE_ENV = 'production';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'script-src': [],
            'frame-src': [],
          },
        },
      };
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.contentSecurityPolicy.directives['script-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['script-src']).toContain('https://js.stripe.com');
      expect(result.contentSecurityPolicy.directives['frame-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['frame-src']).toContain('https://js.stripe.com');
    });

    test('should handle existing directives correctly', async () => {
      process.env.NODE_ENV = 'production';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'default-src': ["'self'", 'https://example.com'],
            'script-src': ["'self'", 'https://cdn.example.com'],
            'connect-src': ["'self'", 'https://api.example.com'],
            'frame-src': ["'self'", 'https://embed.example.com'],
            'frame-ancestors': ["'self'", 'https://parent.example.com'],
          },
        },
      };
      blockletMock.settings = {
        userSpaceHosts: ['trusted.example.com'],
      };
      const result = await patchResponseHeader(rawConfig, {
        node: nodeMock,
        blocklet: blockletMock,
        trustedDomains: ['external.example.com'],
      });

      expect(result.contentSecurityPolicy.directives['default-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['default-src']).toContain('https://example.com');
      expect(result.contentSecurityPolicy.directives['script-src']).toContain('https://cdn.example.com');
      expect(result.contentSecurityPolicy.directives['script-src']).toContain('https://js.stripe.com');
      expect(result.contentSecurityPolicy.directives['frame-ancestors']).toContain('https://trusted.example.com');
      expect(result.contentSecurityPolicy.directives['frame-ancestors']).toContain('https://external.example.com');
    });

    test('should handle empty domain aliases', async () => {
      process.env.NODE_ENV = 'production';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'connect-src': [],
          },
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([]);
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain("'self'");
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain('https://api.simplesvg.com');
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain('https://api.iconify.design');
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain('https://api.unisvg.com');
    });

    test('should handle null domain aliases', async () => {
      process.env.NODE_ENV = 'production';
      const rawConfig = {
        contentSecurityPolicy: {
          directives: {
            'connect-src': [],
          },
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue(null);
      const result = await patchResponseHeader(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.contentSecurityPolicy.directives['connect-src']).toContain("'self'");
    });
  });

  // generate by github copilot
  describe('patchCors', () => {
    const { patchCors } = security;

    let nodeMock;
    let blockletMock;

    beforeEach(() => {
      nodeMock = {
        getBlockletDomainAliases: mock(),
        getNodeInfo: mock(),
      };
      blockletMock = {
        settings: {},
      };
    });

    test('should return original config if origin.smart is not defined', async () => {
      const rawConfig = {};
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result).toEqual(rawConfig);
    });

    test('should add domain aliases to origin.value array', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([{ value: 'alias.com' }]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toContain('https://example.com');
      expect(result.origin.value).toContain('https://alias.com');
    });

    test('should add federated site aliases to origin.value array', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      blockletMock.settings.federated = {
        sites: [
          { appUrl: 'https://site1.com', aliasDomain: ['alias1.com'], isMaster: true, status: 'approved' },
          { appUrl: 'https://site2.com', aliasDomain: ['alias2.com'], isMaster: false, status: 'approved' },
        ],
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([{ value: 'alias.com' }]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toContain('https://example.com');
      expect(result.origin.value).toContain('https://alias.com');
      expect(result.origin.value).toContain('https://site1.com');
      expect(result.origin.value).toContain('https://alias1.com');
    });

    test('should handle empty federated sites', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      blockletMock.settings.federated = {
        sites: [],
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toEqual(['https://example.com']);
    });

    test('should handle null federated sites', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      blockletMock.settings.federated = {
        sites: null,
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toEqual(['https://example.com']);
    });

    test('should handle empty domain aliases', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toEqual(['https://example.com']);
    });

    test('should handle null domain aliases', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue(null);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toEqual(['https://example.com']);
    });

    test('should handle sites without aliasDomain', async () => {
      const rawConfig = {
        origin: {
          smart: true,
          value: ['https://example.com'],
        },
      };
      blockletMock.settings.federated = {
        sites: [{ appUrl: 'https://site1.com', isMaster: true, status: 'approved' }],
      };
      nodeMock.getBlockletDomainAliases.mockResolvedValue([]);
      const result = await patchCors(rawConfig, { node: nodeMock, blocklet: blockletMock });
      expect(result.origin.value).toContain('https://site1.com');
    });
  });

  // generate by github copilot
  describe('cleanConfigOverride', () => {
    const { cleanConfigOverride } = security;

    test('should return an empty object when given an empty object', () => {
      const config = {};
      const result = cleanConfigOverride(config);
      expect(result).toEqual({});
    });

    test('should return the same object when no value properties are present', () => {
      const config = { key1: 'value1', key2: 'value2' };
      const result = cleanConfigOverride(config);
      expect(result).toEqual(config);
    });

    test('should correctly replace value properties with their values', () => {
      const config = {
        key1: { value: 'value1' },
        key2: { value: 'value2' },
        key3: 'value3',
      };
      const expected = {
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      };
      const result = cleanConfigOverride(config);
      expect(result).toEqual(expected);
    });

    test('should not modify properties that do not have a value property', () => {
      const config = {
        key1: { value: 'value1' },
        key2: { other: 'value2' },
        key3: 'value3',
      };
      const expected = {
        key1: 'value1',
        key2: { other: 'value2' },
        key3: 'value3',
      };
      const result = cleanConfigOverride(config);
      expect(result).toEqual(expected);
    });
  });

  // generate by github copilot
  describe('keepConfigOverride', () => {
    const { keepConfigOverride } = security;

    test('should return an empty object when given an empty object', () => {
      const config = {};
      const result = keepConfigOverride(config);
      expect(result).toEqual({});
    });

    test('should return an object with all properties set to false when no override properties are present', () => {
      const config = { key1: 'value1', key2: 'value2' };
      const expected = { key1: false, key2: false };
      const result = keepConfigOverride(config);
      expect(result).toEqual(expected);
    });

    test('should correctly replace override properties with their values', () => {
      const config = {
        key1: { override: true },
        key2: { override: false },
        key3: 'value3',
      };
      const expected = {
        key1: true,
        key2: false,
        key3: false,
      };
      const result = keepConfigOverride(config);
      expect(result).toEqual(expected);
    });

    test('should not modify properties that do not have an override property', () => {
      const config = {
        key1: { override: true },
        key2: { other: 'value2' },
        key3: 'value3',
      };
      const expected = {
        key1: true,
        key2: false,
        key3: false,
      };
      const result = keepConfigOverride(config);
      expect(result).toEqual(expected);
    });
  });
});
