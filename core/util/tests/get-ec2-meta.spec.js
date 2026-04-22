const { test, expect, describe, beforeAll, afterAll } = require('bun:test');
const { default: axios } = require('axios');
const MockAdapter = require('axios-mock-adapter');

const getEc2Meta = require('../lib/get-ec2-meta');

const mock = new MockAdapter(axios);

describe('getEc2Meta', () => {
  beforeAll(() => {
    mock.onPut('http://169.254.169.254/latest/api/token').reply(200, 'token');
    mock.onGet('http://169.254.169.254/latest/user-data').reply(200, { key: 'value' });
    mock.onGet('http://169.254.169.254/latest/meta-data/local-ipv6').reply(200, 'ipv6');
    mock.onGet('http://169.254.169.254/latest/meta-data/public-ipv6').reply(500, 'ipv6');
  });

  afterAll(() => {
    mock.reset();
    mock.restore();
  });

  test('should get user-data as expected', async () => {
    const result = await getEc2Meta('user-data', 1000);
    expect(result).toEqual({ key: 'value' });
  });

  test('should get meta-data as expected', async () => {
    const result = await getEc2Meta('local-ipv6', 1000);
    expect(result).toEqual('ipv6');
  });

  test('should return empty when error', async () => {
    const result = await getEc2Meta('public-ipv6', 1000);
    expect(result).toEqual('');
  });
});
