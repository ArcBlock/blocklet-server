import { describe, expect, it, test, spyOn, mock, beforeEach, afterAll } from 'bun:test';

import { api } from '../../src/util/api';
import {
  getBackupFilesUrlFromEndpoint,
  getDIDSpaceUrlFromEndpoint,
  getDIDSpaceDidFromEndpoint,
  hasPermissionByEndpoint,
  getSpaceBackupEndpoint,
  getSpaceGatewayFromEndpoint,
  getSpaceNameByEndpoint,
  isValidSpaceGatewayUrl,
} from '../../src/util/spaces';

mock.module('../../src/util/api', () => {
  const apiMock = mock();
  apiMock.head = mock();
  apiMock.get = mock();
  return {
    api: apiMock,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('Space utils', () => {
  const endpoint =
    'https://example.com/app/api/space/z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh/apps/zjdxduRGXBtSFbcHg1Y6cHdp8EnEx97PGaGA/object/';

  beforeEach(() => {
    mock.clearAllMocks();
    spyOn(console, 'error').mockReturnValue();
  });

  describe('getBackupFilesUrlFromEndpoint', () => {
    test('should return backup files url', () => {
      expect(getBackupFilesUrlFromEndpoint(endpoint)).toEqual(
        'https://example.com/app/space/z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh/apps/zjdxduRGXBtSFbcHg1Y6cHdp8EnEx97PGaGA/explorer?key=/apps/zjdxduRGXBtSFbcHg1Y6cHdp8EnEx97PGaGA/.did-objects/zjdxduRGXBtSFbcHg1Y6cHdp8EnEx97PGaGA/'
      );
    });
  });

  describe('getDIDSpaceUrlFromEndpoint', () => {
    test('should return did space url', () => {
      expect(getDIDSpaceUrlFromEndpoint(endpoint)).toEqual(
        'https://example.com/app/space/z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh'
      );
    });
  });

  describe('getDIDSpaceDidFromEndpoint', () => {
    test('should return did space did', () => {
      expect(getDIDSpaceDidFromEndpoint(endpoint)).toEqual('z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh');
    });
  });

  describe('hasPermissionByEndpoint', () => {
    test('should return has permission or not', async () => {
      const mockResponse = {
        headers: {
          'x-listable': 'true',
          'x-readable': 'true',
          'x-writeable': 'true',
        },
      };
      spyOn(api, 'head').mockResolvedValue(mockResponse);
      expect(await hasPermissionByEndpoint(endpoint)).toEqual(true);
    });

    test('should be return false when endpoint is not a valid url', async () => {
      expect(await hasPermissionByEndpoint('233')).toEqual(false);
    });

    test('should be return false when call api has error', async () => {
      spyOn(api, 'head').mockImplementation(() => {
        throw new Error('api error');
      });
      expect(await hasPermissionByEndpoint(endpoint)).toEqual(false);
    });
  });

  describe('getSpaceBackupEndpoint', () => {
    test('should return space backup endpoint', () => {
      const environments = [{ key: 'BLOCKLET_APP_BACKUP_ENDPOINT', value: 'https://backup.example.com' }];
      expect(getSpaceBackupEndpoint(environments)).toEqual('https://backup.example.com');
    });
  });

  describe('getSpaceGatewayFromEndpoint', () => {
    test('should return space gateway', () => {
      expect(getSpaceGatewayFromEndpoint(endpoint)).toEqual('https://example.com/app');
    });
  });

  describe('isValidSpaceGatewayUrl', () => {
    const validUrl = 'https://example.com';
    const invalidUrl = 'not a url';

    it('returns true when given a valid spaceGatewayUrl', async () => {
      const didConnectTokenUrl = 'https://example.com/space/api/did/one-click-authorization/token';
      api.get.mockResolvedValue({ status: 200, data: {} });
      const isValid = await isValidSpaceGatewayUrl(validUrl);
      expect(api.get).toHaveBeenCalledWith(didConnectTokenUrl, { timeout: 5000 });
      expect(isValid).toBe(true);
    });

    it('returns false when given an invalid spaceGatewayUrl', async () => {
      const isValid = await isValidSpaceGatewayUrl(invalidUrl);
      expect(api.get).not.toHaveBeenCalled();
      expect(isValid).toBe(false);
    });

    it('returns false when the request times out', async () => {
      api.get.mockRejectedValue({ code: 'ECONNABORTED' });
      const isValid = await isValidSpaceGatewayUrl(validUrl);
      expect(isValid).toBe(false);
    });

    it('returns false when the request fails', async () => {
      api.get.mockRejectedValue({ message: 'Request failed' });
      const isValid = await isValidSpaceGatewayUrl(validUrl);
      expect(isValid).toBe(false);
    });
  });

  describe('getSpaceNameByEndpoint', () => {
    const validUrl =
      'https://example.com/app/api/space/z8iZrihfHTTBCBpDqCzrjFer5jop383b5hdPh/apps/zjdxduRGXBtSFbcHg1Y6cHdp8EnEx97PGaGA/object/';
    const invalidUrl = 'not a url';

    it('returns the space name when given a valid endpoint', async () => {
      const expectedSpaceName = 'example-space';
      api.head.mockResolvedValue({ headers: { 'x-space-name': expectedSpaceName } });
      const spaceName = await getSpaceNameByEndpoint(validUrl);
      expect(api.head).toHaveBeenCalledWith(validUrl, { timeout: 3000 });
      expect(spaceName).toBe(expectedSpaceName);
    });

    it('returns an empty string when given an invalid endpoint', async () => {
      const spaceName = await getSpaceNameByEndpoint(invalidUrl);
      expect(api.head).not.toHaveBeenCalled();
      expect(spaceName).toBe('');
    });

    it('returns an empty string when the request times out', async () => {
      api.head.mockRejectedValue({ code: 'ECONNABORTED' });
      const spaceName = await getSpaceNameByEndpoint(validUrl);
      expect(spaceName).toBe('');
    });

    it('returns an empty string when the request fails', async () => {
      api.head.mockRejectedValue({ message: 'Request failed' });
      const spaceName = await getSpaceNameByEndpoint(validUrl);
      expect(spaceName).toBe('');
    });
  });
});
