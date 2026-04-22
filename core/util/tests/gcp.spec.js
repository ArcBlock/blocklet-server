const { it, expect, describe, spyOn } = require('bun:test');

const { joinURL } = require('ufo');

const gcp = require('../lib/gcp');

const axios = require('../lib/axios');

describe('gcp', () => {
  describe('getMeta', () => {
    it('should return result.data when result.status is 200', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-instance-id' });

      const result = await gcp.getMeta('instance/id');
      expect(result).toBe('test-instance-id');
      expect(mockGet).toHaveBeenCalled();

      mockGet.mockRestore();
    });

    it('should return empty string when key is not provided', async () => {
      const result = await gcp.getMeta();
      expect(typeof result).toBe('string');
    });

    it('should return empty string when request fails', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 403, data: 'test-instance-id' });
      const result = await gcp.getMeta('invalid-key');

      expect(result).toBe('');
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return empty string when request throws error', async () => {
      const mockGet = spyOn(axios, 'get').mockImplementation(() => {
        throw new Error('test');
      });

      const result = await gcp.getMeta('instance/id');
      expect(result).toBe('');
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe('isInGCP', () => {
    it('should return true if instanceId is not empty', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-instance-id' });

      const result = await gcp.isInGCP();
      expect(result).toBe(true);
      expect(mockGet).toHaveBeenCalled();

      mockGet.mockRestore();
    });

    it('should return false if instanceId is empty', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: '' });

      const result = await gcp.isInGCP();
      expect(result).toBe(false);
      expect(mockGet).toHaveBeenCalled();

      mockGet.mockRestore();
    });
  });

  describe('getInternalIpv4', () => {
    it('should return internalIp', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-internal-ip' });

      const result = await gcp.getInternalIpv4();
      expect(result).toBe('test-internal-ip');
      expect(mockGet).toHaveBeenCalledWith(joinURL(gcp.HOST, 'instance/network-interfaces/0/ip'), {
        timeout: gcp.DEFAULT_TIMEOUT,
        headers: { 'Metadata-Flavor': 'Google' },
      });

      mockGet.mockRestore();
    });
  });

  describe('getExternalIpv4', () => {
    it('should return externalIp', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-external-ip' });

      const result = await gcp.getExternalIpv4();
      expect(result).toBe('test-external-ip');
      expect(mockGet).toHaveBeenCalledWith(
        joinURL(gcp.HOST, 'instance/network-interfaces/0/access-configs/0/external-ip'),
        {
          timeout: gcp.DEFAULT_TIMEOUT,
          headers: { 'Metadata-Flavor': 'Google' },
        }
      );

      mockGet.mockRestore();
    });
  });

  describe('getInternalIpv6', () => {
    it('should return internalIp', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-internal-ip' });

      const result = await gcp.getInternalIpv6();
      expect(result).toBe('test-internal-ip');
      expect(mockGet).toHaveBeenCalledWith(joinURL(gcp.HOST, 'instance/network-interfaces/0/ipv6s'), {
        timeout: gcp.DEFAULT_TIMEOUT,
        headers: { 'Metadata-Flavor': 'Google' },
      });

      mockGet.mockRestore();
    });
  });

  describe('getExternalIpv6', () => {
    it('should return externalIp', async () => {
      const mockGet = spyOn(axios, 'get').mockResolvedValue({ status: 200, data: 'test-external-ip' });

      const result = await gcp.getExternalIpv6();
      expect(result).toBe('test-external-ip');
      expect(mockGet).toHaveBeenCalledWith(
        joinURL(gcp.HOST, 'instance/network-interfaces/0/access-configs/0/external-ipv6'),
        {
          timeout: gcp.DEFAULT_TIMEOUT,
          headers: { 'Metadata-Flavor': 'Google' },
        }
      );

      mockGet.mockRestore();
    });
  });
});
