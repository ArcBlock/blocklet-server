const { test, expect, mock, afterAll, spyOn } = require('bun:test');

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const os = require('os');
const { getServiceInstanceCount } = require('../../lib/pm2/get-instance-number');

test('getServiceInstanceNumber', () => {
  process.env.ABT_NODE_MAX_CLUSTER_SIZE = undefined;

  spyOn(os, 'cpus').mockReturnValue({ length: 2 });
  spyOn(os, 'totalmem').mockReturnValue(1024 * 1024 * 1024 * 4);
  expect(getServiceInstanceCount()).toBe(2);

  process.env.ABT_NODE_MAX_CLUSTER_SIZE = undefined;
  spyOn(os, 'totalmem').mockReturnValue(1024 * 1024 * 1024 * 3);
  spyOn(os, 'cpus').mockReturnValue({ length: 4 });
  expect(getServiceInstanceCount()).toBe(3);

  process.env.ABT_NODE_MAX_CLUSTER_SIZE = 2;
  spyOn(os, 'totalmem').mockReturnValue(1024 * 1024 * 1024 * 3);
  spyOn(os, 'cpus').mockReturnValue({ length: 4 });
  expect(getServiceInstanceCount()).toBe(2);

  process.env.ABT_NODE_MAX_CLUSTER_SIZE = 4;
  spyOn(os, 'totalmem').mockReturnValue(1024 * 1024 * 1024 * 0.5);
  spyOn(os, 'cpus').mockReturnValue({ length: 4 });
  expect(getServiceInstanceCount()).toBe(1);
});
