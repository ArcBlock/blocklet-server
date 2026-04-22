const { describe, expect, test, mock, afterEach, afterAll } = require('bun:test');

const mockAxios = mock();
mockAxios.get = mock();

// mock.module('../lib/axios', () => ({
//   default: mockAxios,
//   __esModule: true,
// }));

require.cache[require.resolve('../lib/axios')] = {
  default: mockAxios,
  exports: mockAxios,
  __esModule: true,
};

afterAll(() => {
  delete require.cache[require.resolve('../lib/axios')];
  mock.restore();
  mock.clearAllMocks();
});

const listNpmPackageVersion = require('../lib/list-npm-package-version');

const axios = require('../lib/axios');

describe('listNpmPackageVersion', () => {
  afterEach(() => {
    mock.clearAllMocks();
  });

  test('should return an array', async () => {
    const resp = {
      data: {
        time: {
          modified: '2020-01-27T00:37:12.739Z',
          created: '2020-11-29T01:11:23.618Z',
          '0.0.1': '2020-11-29T01:11:25.405Z',
          '0.1.0': '2020-12-02T23:16:56.971Z',
        },
        versions: {
          '0.0.1': { name: 'test' },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result = await listNpmPackageVersion('debug');

    expect(Array.isArray(result) && result.length).toBeTruthy();
  });

  test('should versions sorted by version in desc', async () => {
    const resp = {
      data: {
        time: {
          '0.0.1': '2020-11-29T01:11:25.405Z',
          '0.3.0': '2020-12-02T23:16:56.971Z',
          '0.1.0': '2020-12-01T23:16:56.971Z',
        },
        versions: {
          '0.0.1': { name: 'test' },
          '0.3.0': { name: 'test' },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result = await listNpmPackageVersion('debug');

    expect(Array.isArray(result)).toBeTruthy();
    expect(result[0].version).toBe('0.3.0');
  });

  const betaResponse = {
    data: {
      time: {
        '1.16.5': '2020-11-29T01:11:25.405Z',
        '1.16.6-beta-4562aa60': '2020-12-02T23:16:56.971Z',
        '1.16.6-beta-8be2fe37': '2020-12-01T23:16:56.971Z',
      },
      versions: {
        '1.16.5': { name: 'test' },
        '1.16.6-beta-4562aa60': { name: 'test' },
        '1.16.6-beta-8be2fe37': { name: 'test' },
      },
    },
  };

  test('should latest versions sorted by version in desc', async () => {
    axios.get.mockImplementation(() => betaResponse);
    const result = await listNpmPackageVersion('debug', { includePrereleases: false });

    expect(Array.isArray(result)).toBeTruthy();
    expect(result[0].version).toBe('1.16.5');
  });

  test('should beta versions sorted by date in desc', async () => {
    axios.get.mockImplementation(() => betaResponse);
    const result = await listNpmPackageVersion('debug', { includePrereleases: true });

    expect(Array.isArray(result)).toBeTruthy();
    expect(result[0].version).toBe('1.16.6-beta-4562aa60');
  });

  test('should not return deprecated versions', async () => {
    const resp = {
      data: {
        time: {
          '0.0.1': '2020-11-29T01:11:25.405Z',
          '0.1.0': '2020-12-02T23:16:56.971Z',
        },
        versions: {
          '0.0.1': { name: 'test', deprecated: true },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result = await listNpmPackageVersion('debug');

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBe(1);
    expect(result[0].version).toBe('0.1.0');
  });

  test('should argument includePrereleases works', async () => {
    const resp = {
      data: {
        time: {
          modified: '2020-01-27T00:37:12.739Z',
          created: '2020-11-29T01:11:23.618Z',
          '0.0.1-alpha': '2020-11-29T01:11:25.405Z',
          '0.1.0': '2020-12-02T23:16:56.971Z',
        },
        versions: {
          '0.0.1-alpha': { name: 'test' },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result1 = await listNpmPackageVersion('debug', { includePrereleases: true });

    expect(Array.isArray(result1)).toBe(true);
    expect(result1.length).toBe(2);

    const result2 = await listNpmPackageVersion('debug', { includePrereleases: false });
    expect(Array.isArray(result2)).toBe(true);
    expect(result2.length).toBe(1);
  });

  test('should argument limit works', async () => {
    const resp = {
      data: {
        time: {
          modified: '2020-01-27T00:37:12.739Z',
          created: '2020-11-29T01:11:23.618Z',
          '0.0.1': '2020-11-29T01:11:25.405Z',
          '0.1.0': '2020-12-02T23:16:56.971Z',
        },
        versions: {
          '0.0.1': { name: 'test' },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result1 = await listNpmPackageVersion('debug', { limit: 1 });

    expect(Array.isArray(result1)).toBe(true);
    expect(result1.length).toBe(1);

    const result2 = await listNpmPackageVersion('debug');
    expect(Array.isArray(result2)).toBe(true);
    expect(result2.length).toBe(2);
  });

  test('should the version cleaned', async () => {
    const resp = {
      data: {
        time: {
          modified: '2020-01-27T00:37:12.739Z',
          created: '2020-11-29T01:11:23.618Z',
          'v0.0.1-alpha': '2020-11-29T01:11:25.405Z',
          'v0.1.0': '2020-12-02T23:16:56.971Z',
        },
        versions: {
          '0.0.1-alpha': { name: 'test' },
          '0.1.0': { name: 'test' },
        },
      },
    };

    axios.get.mockImplementation(() => resp);
    const result1 = await listNpmPackageVersion('debug', { includePrereleases: true });

    expect(Array.isArray(result1)).toBe(true);
    expect(result1.length).toBe(2);

    const result2 = await listNpmPackageVersion('debug', { includePrereleases: false });
    expect(Array.isArray(result2)).toBe(true);
    expect(result2.length).toBe(1);
  });
});
