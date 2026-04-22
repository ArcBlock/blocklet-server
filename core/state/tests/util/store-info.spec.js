const { mock, test, expect, beforeEach, afterAll } = require('bun:test');

mock.module('../../lib/util/request', () => {
  return {
    get: mock(),
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

beforeEach(() => {
  mock.clearAllMocks();
});

const request = require('../../lib/util/request');
const util = require('../../lib/util/store');

test('getStoreInfo', async () => {
  const did = 'z1Vm4cf589nzrpXfESAK9oye8EpBSFmK1oP';
  const url = `https://store.blocklet.dev/api/blocklets/${did}/blocklet.json`;

  request.get.mockImplementation(() => ({ data: { id: 'x', name: 'x', description: 'x', maintainer: 'x' } }));
  const res1 = await util.getStoreInfo(url);
  expect(res1.inStore).toBe(true);
  expect(res1.registryUrl).toBe('https://store.blocklet.dev');
  expect(res1.blockletDid).toBe(did);

  request.get.mockImplementation(() => ({ data: null }));
  const res2 = await util.getStoreInfo(url);
  expect(res2.inStore).toBe(false);

  request.get.mockImplementation(() => ({ data: {} }));
  const res3 = await util.getStoreInfo(url);
  expect(res3.inStore).toBe(false);

  request.get.mockImplementation(() => ({ data: { name: 'x', description: 'x', maintainer: 'x' } }));
  const res4 = await util.getStoreInfo(url);
  expect(res4.inStore).toBe(false);

  const res5 = await util.getStoreInfo('https://a.com/asdf');
  expect(res5.inStore).toBe(false);
});
