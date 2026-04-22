const { test, expect, describe, beforeEach, afterAll, mock } = require('bun:test');

const isEC2Mock = mock();
isEC2Mock.isInEC2 = mock();

mock.module('../lib/is-ec2', () => ({
  __esModule: true,
  default: isEC2Mock,
}));

const gcpMock = mock();
gcpMock.isInGCP = mock();

mock.module('../lib/gcp', () => ({
  __esModule: true,
  default: gcpMock,
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const gcp = require('../lib/gcp');
const isEC2 = require('../lib/is-ec2');
const cloud = require('../lib/cloud');

describe('cloud', () => {
  beforeEach(() => {
    gcp.isInGCP.mockReset();
    isEC2.mockReset();
  });

  afterAll(() => {
    gcp.isInGCP.mockReset();
    isEC2.mockReset();
  });

  describe('isInCloud', () => {
    test('should return true if in GCP', async () => {
      gcp.isInGCP.mockResolvedValue(true);
      isEC2.mockResolvedValue(false);

      const result = await cloud.isInCloud();
      expect(result).toBe(true);

      expect(gcp.isInGCP).toHaveBeenCalledTimes(1);
      expect(isEC2).toHaveBeenCalledTimes(1);
    });

    test('should return true if in EC2', async () => {
      gcp.isInGCP.mockResolvedValue(false);
      isEC2.mockResolvedValue(true);

      const result = await cloud.isInCloud();
      expect(result).toBe(true);
      expect(gcp.isInGCP).toHaveBeenCalledTimes(1);
      expect(isEC2).toHaveBeenCalledTimes(1);
    });

    test('should return false if not in GCP or EC2', async () => {
      gcp.isInGCP.mockResolvedValue(false);
      isEC2.mockResolvedValue(false);

      const result = await cloud.isInCloud();
      expect(result).toBe(false);
      expect(gcp.isInGCP).toHaveBeenCalledTimes(1);
      expect(isEC2).toHaveBeenCalledTimes(1);
    });
  });
});
