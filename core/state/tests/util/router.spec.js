const { mock, describe, test, expect, beforeEach, afterAll } = require('bun:test');

mock.module('../../lib/util/request', () => {
  return {
    get: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const os = require('os');
const { DEFAULT_HTTPS_PORT, DEFAULT_HTTP_PORT } = require('@abtnode/constant');

const { getGatewayPorts, getAvailableGatewayPorts, expandBlacklist } = require('../../lib/util/router');
const request = require('../../lib/util/request');

describe('util.router', () => {
  describe('getGatewayPorts', () => {
    test('should return httpPort and httpsPort from info.routing', () => {
      const info = {
        routing: {
          httpPort: 80,
          httpsPort: 443,
        },
      };
      const result = getGatewayPorts(info);

      expect(result).toEqual({
        httpPort: 80,
        httpsPort: 443,
      });
    });

    test('should return default httpPort and httpsPort if not provided', () => {
      const info = {};
      const result = getGatewayPorts(info);

      expect(result).toEqual({
        httpPort: DEFAULT_HTTP_PORT,
        httpsPort: DEFAULT_HTTPS_PORT,
      });
    });
  });

  describe('getAvailableGatewayPorts', () => {
    test('should return ports from preferred range when available', async () => {
      const result = await getAvailableGatewayPorts();
      const preferredPorts = [8080, 8081, 8082, 8083, 8084, 8085];

      // At least one of the ports should be from the preferred range
      const httpInRange = preferredPorts.includes(result.httpPort);
      const httpsInRange = preferredPorts.includes(result.httpsPort);

      expect(httpInRange || httpsInRange).toBe(true);
    });
  });
});

describe('Router.expandBlacklist', () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should handle empty blacklist', async () => {
    const result = await expandBlacklist([]);
    expect(result).toEqual([]);
  });

  test('should handle blacklist with only IPs and CIDRs', async () => {
    const blacklist = ['1.1.1.1', '2.2.2.2', '192.168.0.0/16', '2001:db8::/32'];
    const result = await expandBlacklist(blacklist);
    expect(result).toEqual(['1.1.1.1', '192.168.0.0/16', '2.2.2.2', '2001:db8::/32']);
  });

  test('should fetch and merge IPs from valid URLs', async () => {
    const blacklist = ['1.1.1.1', 'https://example.com/blacklist', 'https://example.org/blacklist'];

    request.get
      .mockResolvedValueOnce({
        status: 200,
        data: ['2.2.2.2', '3.3.3.3'].join(os.EOL),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: ['4.4.4.4', '192.168.0.0/16'].join(os.EOL),
      });

    const result = await expandBlacklist(blacklist);
    expect(result).toEqual(['1.1.1.1', '192.168.0.0/16', '2.2.2.2', '3.3.3.3', '4.4.4.4']);

    expect(request.get).toHaveBeenCalledTimes(2);
    expect(request.get).toHaveBeenCalledWith('https://example.com/blacklist', { timeout: 2000 });
    expect(request.get).toHaveBeenCalledWith('https://example.org/blacklist', { timeout: 2000 });
  });

  test('should handle failed URL requests', async () => {
    const blacklist = ['1.1.1.1', 'https://example.com/blacklist'];

    request.get.mockRejectedValueOnce(new Error('Request failed'));

    const result = await expandBlacklist(blacklist);
    expect(result).toEqual(['1.1.1.1']);
  });

  test('should handle invalid response data from URLs', async () => {
    const blacklist = ['1.1.1.1', 'https://example.com/blacklist', 'https://example.org/blacklist'];

    request.get
      .mockResolvedValueOnce({
        status: 404,
        data: ['2.2.2.2'].join(os.EOL),
      })
      .mockResolvedValueOnce({
        status: 200,
        data: 'not an array',
      });

    const result = await expandBlacklist(blacklist);
    expect(result).toEqual(['1.1.1.1']);
  });

  test('should filter out invalid IPs from URL responses', async () => {
    const blacklist = ['1.1.1.1', 'https://example.com/blacklist'];

    request.get.mockResolvedValueOnce({
      status: 200,
      data: [' 2.2.2.2', 'invalid-ip', '192.168.0.0/16 ', 'not-an-ip'].join(os.EOL),
    });

    const result = await expandBlacklist(blacklist);
    expect(result).toEqual(['1.1.1.1', '192.168.0.0/16', '2.2.2.2']);
  });
});
