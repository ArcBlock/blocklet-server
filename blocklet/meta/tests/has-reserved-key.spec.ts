import { test, expect } from 'bun:test';
import { hasReservedKey } from '../src/has-reserved-key';

test('should return false on empty', () => {
  expect(hasReservedKey([])).toEqual(false);
});
test('should return false on no', () => {
  expect(hasReservedKey([{ name: 'custom' }] as any)).toEqual(false);
  expect(hasReservedKey([{ key: 'key' }] as any)).toEqual(false);
});
test('should return true on yes', () => {
  expect(hasReservedKey([{ name: 'ABT_NODE_xxx' }] as any)).toEqual(true);
  expect(hasReservedKey([{ key: 'BLOCKLET_xxx' }] as any)).toEqual(true);
});
test('should return false on configurable', () => {
  expect(hasReservedKey([{ key: 'BLOCKLET_APP_CHAIN_TYPE' }] as any)).toEqual(false);
  expect(hasReservedKey([{ name: 'BLOCKLET_APP_CHAIN_TYPE' }] as any)).toEqual(false);
});
