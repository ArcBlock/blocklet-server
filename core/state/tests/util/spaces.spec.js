const { mock, describe, test, expect, beforeEach, afterAll, it, spyOn } = require('bun:test');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');
const { default: axios } = require('axios');
const MockAdapter = require('axios-mock-adapter');

const axiosMock = new MockAdapter(axios);

const {
  getBackupFilesUrlFromEndpoint,
  getBackupEndpoint,
  getDIDSpacesUrlFromEndpoint,
  getSpaceNameByEndpoint,
  getBackupJobId,
} = require('../../lib/util/spaces');

beforeEach(() => {
  axiosMock.reset();
});

afterAll(() => {
  axiosMock.restore();
});

describe(__filename, () => {
  const endpoint =
    'https://storage.staging.abtnet.io/app/api/space/z3T6AJLRiug1Hz1tqiLK6mLwa38ZKZDSyc4ks/app/zNKe7gqW8PqjQG15YJhyYWCXfSQG5JcQY9Sw/object/';

  beforeEach(() => {
    mock.clearAllMocks();
    axiosMock.reset();
  });

  describe('#getBackupEndpoint', () => {
    test('should work', () => {
      expect(
        getBackupEndpoint([
          {
            key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_BACKUP_ENDPOINT,
            value: '233',
          },
        ])
      ).toEqual('233');
    });

    test('should be return empty string when endpoint is empty', () => {
      expect(getBackupEndpoint([])).toEqual('');
    });
  });

  describe('#getBackupFilesUrlFromEndpoint', () => {
    test('should work', () => {
      expect(getBackupFilesUrlFromEndpoint(endpoint)).toEqual(
        'https://storage.staging.abtnet.io/app/space/z3T6AJLRiug1Hz1tqiLK6mLwa38ZKZDSyc4ks/apps/zNKe7gqW8PqjQG15YJhyYWCXfSQG5JcQY9Sw/explorer?key=%2Fapps%2FzNKe7gqW8PqjQG15YJhyYWCXfSQG5JcQY9Sw%2F.did-objects%2FzNKe7gqW8PqjQG15YJhyYWCXfSQG5JcQY9Sw%2F'
      );
    });

    test('throw an error when endpoint is empty', () => {
      expect(() => getBackupFilesUrlFromEndpoint(undefined)).toThrowError('Endpoint(undefined) cannot be empty');
    });
  });

  describe('#getDIDSpacesUrlFromEndpoint', () => {
    test('should work', () => {
      expect(getDIDSpacesUrlFromEndpoint(endpoint)).toEqual('https://storage.staging.abtnet.io/app');
    });

    test('throw an error when endpoint is empty', () => {
      expect(() => getDIDSpacesUrlFromEndpoint(undefined)).toThrowError('Endpoint(undefined) is not a valid url');
    });
  });

  describe('getSpaceNameByEndpoint', () => {
    beforeEach(() => {
      // note: 此处 mock 是因为我只是不要让控制台报大量的错误
      spyOn(console, 'error').mockReturnValue();
    });

    it('returns the space name when given a valid endpoint', async () => {
      const expectedSpaceName = 'example-space';
      axiosMock.onHead(endpoint).reply(200, {}, { 'x-space-name': expectedSpaceName });
      const spaceName = await getSpaceNameByEndpoint(endpoint);
      expect(spaceName).toBe(expectedSpaceName);
    });

    it('returns an empty string when given an invalid endpoint', async () => {
      const spaceName = await getSpaceNameByEndpoint(endpoint);
      expect(spaceName).toBe('');
    });

    it('returns an empty string when the request times out', async () => {
      axiosMock.onHead(endpoint).networkError();
      const spaceName = await getSpaceNameByEndpoint(endpoint);
      expect(spaceName).toBe('');
    });

    it('returns an empty string when the request fails', async () => {
      axiosMock.onHead(endpoint).reply(500, {}, { message: 'Request failed' });
      const spaceName = await getSpaceNameByEndpoint(endpoint);
      expect(spaceName).toBe('');
    });
  });

  describe('getBackupJobId', () => {
    test('should be work', () => {
      expect(getBackupJobId('zNKunmYfV8UzZkRzMdVa4E16dw8wgFWi3PqL')).toEqual(
        'zNKunmYfV8UzZkRzMdVa4E16dw8wgFWi3PqL.backupToSpaces'
      );
    });
  });
});
