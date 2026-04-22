import { describe, test, expect } from 'bun:test';
import { parseEnv, getBlockletLanguages, getBlockletPreferences } from '../src/util';

describe('env', () => {
  test('should work as expected', () => {
    const raw = {
      BLOCKLET_APP_ID: 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T',
      BLOCKLET_APP_PID: 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T',
      BLOCKLET_APP_IDS: 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T,a,b',
      BLOCKLET_APP_NAME: 'name',
      BLOCKLET_APP_DESCRIPTION: 'desc',
      BLOCKLET_APP_URL: '',
      BLOCKLET_DID: 'did1',
      BLOCKLET_REAL_DID: 'did1',
      BLOCKLET_DATA_DIR: '/path/to/data',
      BLOCKLET_CACHE_DIR: '/path/to/cache',
      BLOCKLET_REAL_NAME: 'a/b',
      BLOCKLET_MODE: 'production',
      'prefs.boolean': 'true',
      'prefs.string1': 'string',
      'prefs.string2': 'string with spaces',
      'prefs.number': '123',
      'prefs.array': '[1,"2"]',
    };

    const parsed = parseEnv(raw);

    expect(parsed).toEqual(
      expect.objectContaining({
        appId: 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T',
        appPid: 'zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T',
        appIds: ['zNKe4EwPHu2Sz1y69NFerD7UEGDc7YHQSx2T', 'a', 'b'],
        appName: 'name',
        appDescription: 'desc',
        appUrl: '',
        isComponent: false,
        dataDir: '/path/to/data',
        cacheDir: '/path/to/cache',
        mode: 'production',
        preferences: {
          boolean: true,
          number: 123,
          array: [1, '2'],
          string1: 'string',
          string2: 'string with spaces',
        },
        // eslint-disable-next-line @typescript-eslint/comma-dangle
      })
    );
  });
});

test('getBlockletLanguages', () => {
  expect(getBlockletLanguages()).toEqual([
    { code: 'en', name: 'English' },
    {
      code: 'zh',
      name: '简体中文',
    },
  ]);
  expect(getBlockletLanguages('')).toEqual([{ code: 'en', name: 'English' }]);
  expect(getBlockletLanguages('en')).toEqual([{ code: 'en', name: 'English' }]);
  expect(getBlockletLanguages('en,zh')).toEqual([
    { code: 'en', name: 'English' },
    {
      code: 'zh',
      name: '简体中文',
    },
  ]);
  expect(getBlockletLanguages('en, zh')).toEqual([
    { code: 'en', name: 'English' },
    {
      code: 'zh',
      name: '简体中文',
    },
  ]);
  expect(getBlockletLanguages('en, zh, do-not-exist')).toEqual([
    { code: 'en', name: 'English' },
    {
      code: 'zh',
      name: '简体中文',
    },
  ]);
});

describe('getBlockletPreferences', () => {
  test('should return blocklet preferences from environment variables', () => {
    const env = {
      'prefs.THEME': 'dark',
      'prefs.LANGUAGE': JSON.stringify({ code: 'en', name: 'English' }),
    };
    const expected = {
      THEME: 'dark',
      LANGUAGE: { code: 'en', name: 'English' },
    };

    const result = getBlockletPreferences(env);
    expect(result).toEqual(expected);
  });

  test('should handle non-JSON preferences', () => {
    const env = {
      'prefs.THEME': 'dark',
      'prefs.LANGUAGE': 'en',
    };
    const expected = {
      THEME: 'dark',
      LANGUAGE: 'en',
    };

    const result = getBlockletPreferences(env);
    expect(result).toEqual(expected);
  });

  test('should handle empty environment variables', () => {
    const env = {};

    const result = getBlockletPreferences(env);
    expect(result).toEqual({});
  });

  test('should handle environment variables without blocklet preferences', () => {
    const env = {
      SOME_OTHER_VARIABLE: 'value',
    };

    const result = getBlockletPreferences(env);
    expect(result).toEqual({});
  });
});
