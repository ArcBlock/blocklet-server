const { test, beforeEach, expect, mock, afterAll } = require('bun:test');

mock.module('dotenv-flow', () => ({
  listFiles: () => [],
}));

const mockAsk = mock();
mock.module('inquirer', () => ({
  prompt: (...args) => {
    mockAsk(...args);
    return args[0].reduce((o, x) => {
      o[x.name] = `value of ${x.name}`;
      return o;
    }, {});
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const ensureBlockletEnv = require('../../lib/util/blocklet/env');

beforeEach(() => {
  mock.restore();
});

test('env', async () => {
  const mockConfig = mock();
  const node = {
    configBlocklet: mockConfig,
  };
  const b1 = {
    meta: { did: 'a', name: 'aa' },
    children: [],
    configs: [],
  };

  expect(mockConfig.mock.calls.length).toBe(0);
  expect(mockAsk.mock.calls.length).toBe(0);

  await ensureBlockletEnv(node, b1);
  expect(mockAsk.mock.calls.length).toBe(0);
  expect(mockConfig.mock.calls.length).toBe(0);

  const b2 = {
    meta: { did: 'a', name: 'aa', environments: [{ name: 'key1', required: true }] },
    children: [],
    configs: [{ key: 'key1', description: 'key1-desc', value: '', required: true }],
  };
  await ensureBlockletEnv(node, b2);
  expect(mockAsk.mock.calls.length).toBe(1);
  expect(mockAsk.mock.calls[0][0][0].name).toEqual('key1');
  expect(mockConfig.mock.calls.length).toBe(1);
  expect(mockConfig.mock.calls[0][0].configs[0].key).toBe('key1');
  expect(mockConfig.mock.calls[0][0].configs[0].value).toBe('value of key1');

  mockAsk.mockClear();
});
