const { mock, describe, test, expect, afterAll } = require('bun:test');

mock.module('../lib/axios', () => ({
  get: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const isEC2 = require('../lib/is-ec2');
const axios = require('../lib/axios');

describe('isEC2', () => {
  test('should return true if the instance-identity url is exists', async () => {
    axios.get.mockResolvedValue({ status: 200, data: 'instance-identity' });

    const result = await isEC2();
    expect(result).toBe(true);
    expect(axios.get).toHaveBeenCalled();
  });

  test('should return false if the check fails', async () => {
    axios.get.mockImplementation(() => {
      throw new Error('test');
    });

    const result = await isEC2();
    expect(result).toBe(false);
    expect(axios.get).toHaveBeenCalled();
  });
});
