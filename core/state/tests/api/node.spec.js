const { test, expect, describe, mock } = require('bun:test');
const NodeApi = require('../../lib/api/node');

describe('api.node', () => {
  describe('initialize', () => {
    test('should throw error if state param is empty', () => {
      expect(() => new NodeApi()).toThrow(/argument states can not be undefined/);
      expect(() => new NodeApi(null)).toThrow(/argument states can not be null/);
    });

    test('should init correctly', () => {
      const mockStates = { node: { read: () => {} } };
      const nodeApi = new NodeApi(mockStates, 'test-server-did');
      expect(nodeApi.state).toEqual(mockStates.node);
    });

    test('should cache', async () => {
      const read = mock().mockImplementation(() => ({ did: 1 }));
      const mockStates = {
        node: {
          read,
          getEnvironments: () => [],
        },
      };

      const nodeApi = new NodeApi(mockStates, 'test-server-did');

      const res1 = await nodeApi.getInfo();
      expect(res1.did).toEqual(1);

      await nodeApi.getInfo();
      read.mockImplementation(() => ({ did: 2 }));
      const res4 = await nodeApi.getInfo();
      expect(res4.did).toEqual(2);

      read.mockImplementation(() => ({ did: 3 }));
      const res5 = await nodeApi.getInfo();
      expect(res5.did).toEqual(3);
      nodeApi.deleteCache();
      const res6 = await nodeApi.getInfo();
      expect(res6.did).toEqual(3);
    });
  });
});
