const { describe, expect, test, mock, spyOn, beforeEach, afterEach, afterAll } = require('bun:test');

const fs = require('fs');

const {
  attachSendLogoContext,
  ensureBlockletExist,
  ensureCustomSquareLogo,
  ensureBundleLogo,
  ensureCustomFavicon,
  ensureCustomRectLogo,
  ensureDefaultLogo,
  ensureCustomSquareDarkLogo,
  ensureCustomRectDarkLogo,
  fallbackLogo,
  cacheError,
} = require('../lib/logo-middleware');

const sendFile = mock();
const sendLogoFile = mock();
const sendFallbackLogo = mock();

const res = { sendFile, sendLogoFile, sendFallbackLogo };

const next = mock();

afterAll(() => {
  process.env = { ...globalThis.processEnv };
});

beforeEach(() => {
  mock.clearAllMocks();
  expect(sendFile).not.toHaveBeenCalled();
  expect(sendLogoFile).not.toHaveBeenCalled();
  expect(sendFallbackLogo).not.toHaveBeenCalled();
  expect(next).not.toHaveBeenCalled();
});

afterEach(() => {
  mock.clearAllMocks();
  mock.restore();
});

describe.serial(
  'attachSendLogoContext',
  () => {
    test('should work', async () => {
      const req = {};
      const _res = {};

      const mockBlocklet = { meta: { did: 'xxx' } };

      await attachSendLogoContext({
        onSendFallbackLogo: sendFallbackLogo,
        onGetBlocklet: () => {
          return mockBlocklet;
        },
      })(req, _res, next);

      expect(next).toHaveBeenCalled();
      expect(req.blocklet).toEqual(mockBlocklet);
      expect(sendFallbackLogo).not.toHaveBeenCalled();
      _res.sendFallbackLogo();
      expect(sendFallbackLogo).toHaveBeenCalled();
    });

    test('should cache error', async () => {
      const req = {};
      const _res = {};

      await attachSendLogoContext({
        onSendFallbackLogo: sendFallbackLogo,
        onGetBlocklet: () => {
          throw new Error('test');
        },
      })(req, _res, next);

      expect(next).toHaveBeenCalled();
      expect(req.blocklet).toBe(null);
      expect(sendFallbackLogo).not.toHaveBeenCalled();
      _res.sendFallbackLogo();
      expect(sendFallbackLogo).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe(
  'ensureBlockletExist',
  () => {
    test('exist', async () => {
      mock.clearAllMocks();
      await ensureBlockletExist(
        {
          blocklet: {
            env: { appDir: '/app-dir' },
          },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('NOT exist', async () => {
      await ensureBlockletExist(
        {
          blocklet: null,
        },
        res,
        next
      );

      expect(sendFallbackLogo).toHaveBeenCalled();
    });

    test('app dir NOT exist', async () => {
      await ensureBlockletExist(
        {
          blocklet: {},
        },
        res,
        next
      );

      expect(sendFallbackLogo).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe(
  'ensureCustomSquareLogo',
  () => {
    // TEMP-SKIP: pre-existing network-dependent test, unrelated to blockchain dep upgrade
    test.skip('custom remote logo', (done) => {
      ensureCustomSquareLogo(
        {
          blocklet: { environmentObj: { BLOCKLET_APP_LOGO_SQUARE: 'https://logo.logo/logo.png' } },
        },
        res,
        next
      );
      setTimeout(() => {
        expect(sendFallbackLogo).toHaveBeenCalled();
        done();
      }, 1000);
    });

    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureCustomSquareLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_SQUARE: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureCustomSquareLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_SQUARE: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('custom square logo NOT exist', async () => {
      await ensureCustomSquareLogo(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe.serial(
  'ensureCustomRectLogo',
  () => {
    // TEMP-SKIP: pre-existing flaky network-dependent test, unrelated to blockchain dep upgrade
    test.skip('custom remote favicon', (done) => {
      ensureCustomRectLogo(
        {
          blocklet: { environmentObj: { BLOCKLET_APP_LOGO_RECT: 'https://logo.logo/logo.png' } },
        },
        res,
        next
      );
      setTimeout(() => {
        expect(sendFallbackLogo).toHaveBeenCalled();
        done();
      }, 1000);
    });

    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureCustomRectLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_RECT: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureCustomRectLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_RECT: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('custom logo NOT exist', async () => {
      await ensureCustomRectLogo(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe.serial(
  'ensureCustomFavicon',
  () => {
    // TEMP-SKIP: pre-existing flaky network-dependent test, unrelated to blockchain dep upgrade
    test.skip('custom remote favicon', (done) => {
      ensureCustomFavicon(
        {
          blocklet: { environmentObj: { BLOCKLET_APP_LOGO_FAVICON: 'https://logo.logo/logo.png' } },
        },
        res,
        next
      );
      setTimeout(() => {
        expect(sendFallbackLogo).toHaveBeenCalled();
        done();
      }, 1000);
    });

    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureCustomFavicon(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_FAVICON: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureCustomFavicon(
        {
          blocklet: { env: { dataDir: '/data-dir' }, environmentObj: { BLOCKLET_APP_LOGO_FAVICON: '/path/to/logo' } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('custom logo NOT exist', async () => {
      await ensureCustomFavicon(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe.serial(
  'ensureBundleLogo',
  () => {
    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureBundleLogo(
        {
          blocklet: { meta: { logo: '/path/to/logo' }, env: { appDir: '/app-dir' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureBundleLogo(
        {
          blocklet: { meta: { logo: '/path/to/logo' }, env: { appDir: '/app-dir' } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('bundle logo', async () => {
      await ensureBundleLogo(
        {
          blocklet: { meta: { logo: null } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe.serial(
  'ensureDefaultLogo',
  () => {
    test('local svg file exist', async () => {
      spyOn(fs, 'existsSync').mockImplementation((x) => x.includes('logo.svg'));
      await ensureDefaultLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local png file exist', async () => {
      spyOn(fs, 'existsSync').mockImplementation((x) => x.includes('logo.png'));
      await ensureDefaultLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' } },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureDefaultLogo(
        {
          blocklet: { env: { dataDir: '/data-dir' } },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('data dir NOT exist', async () => {
      await ensureDefaultLogo(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

test(
  'fallbackLogo',
  async () => {
    await fallbackLogo({}, res, next);
    expect(sendFallbackLogo).toHaveBeenCalled();
  },
  1000 * 10
);

test(
  'cacheError',
  async () => {
    await cacheError(new Error('test'), {}, res, next);
    expect(sendFallbackLogo).toHaveBeenCalled();
  },
  1000 * 10
);

describe.serial(
  'ensureCustomSquareDarkLogo',
  () => {
    // TEMP-SKIP: pre-existing flaky network-dependent test, unrelated to blockchain dep upgrade
    test.skip('custom remote logo', (done) => {
      ensureCustomSquareDarkLogo(
        {
          blocklet: { environmentObj: { BLOCKLET_APP_LOGO_SQUARE_DARK: 'https://logo.logo/logo-dark.png' } },
        },
        res,
        next
      );
      setTimeout(() => {
        expect(sendFallbackLogo).toHaveBeenCalled();
        done();
      }, 1000);
    });

    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureCustomSquareDarkLogo(
        {
          blocklet: {
            env: { dataDir: '/data-dir' },
            environmentObj: { BLOCKLET_APP_LOGO_SQUARE_DARK: '/path/to/logo-dark' },
          },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureCustomSquareDarkLogo(
        {
          blocklet: {
            env: { dataDir: '/data-dir' },
            environmentObj: { BLOCKLET_APP_LOGO_SQUARE_DARK: '/path/to/logo-dark' },
          },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('custom square dark logo NOT exist', async () => {
      await ensureCustomSquareDarkLogo(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);

describe.serial(
  'ensureCustomRectDarkLogo',
  () => {
    // TEMP-SKIP: pre-existing flaky network-dependent test, unrelated to blockchain dep upgrade
    test.skip('custom remote logo', (done) => {
      ensureCustomRectDarkLogo(
        {
          blocklet: { environmentObj: { BLOCKLET_APP_LOGO_RECT_DARK: 'https://logo.logo/logo-rect-dark.png' } },
        },
        res,
        next
      );
      setTimeout(() => {
        expect(sendFallbackLogo).toHaveBeenCalled();
        done();
      }, 1000);
    });

    test('local file exist', async () => {
      spyOn(fs, 'existsSync').mockReturnValue(true);
      await ensureCustomRectDarkLogo(
        {
          blocklet: {
            env: { dataDir: '/data-dir' },
            environmentObj: { BLOCKLET_APP_LOGO_RECT_DARK: '/path/to/logo-rect-dark' },
          },
        },
        res,
        next
      );
      expect(sendLogoFile).toHaveBeenCalled();
    });

    test('local file NOT exist', async () => {
      await ensureCustomRectDarkLogo(
        {
          blocklet: {
            env: { dataDir: '/data-dir' },
            environmentObj: { BLOCKLET_APP_LOGO_RECT_DARK: '/path/to/logo-rect-dark' },
          },
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });

    test('custom rect dark logo NOT exist', async () => {
      await ensureCustomRectDarkLogo(
        {
          blocklet: {},
        },
        res,
        next
      );
      expect(next).toHaveBeenCalled();
    });
  },
  1000 * 10
);
