import { test, expect } from 'bun:test';

test('should have api', async () => {
  const { default: ServerVersion } = await import(`../../src/util/server-version?t=${Date.now()}`);
  expect(typeof ServerVersion.lt).toBe('function');
  expect(typeof ServerVersion.gt).toBe('function');
  expect(typeof ServerVersion.lte).toBe('function');
  expect(typeof ServerVersion.gte).toBe('function');
  expect(typeof ServerVersion.version).toBe('string');
});

test('should work as expected', async () => {
  const { default: ServerVersion } = await import(`../../src/util/server-version?t=${Date.now()}`);
  ServerVersion.version = '1.0.0';
  expect(ServerVersion.gt('1.14.5')).toBe(false);
  expect(ServerVersion.lt('1.14.5')).toBe(true);
  expect(ServerVersion.gt('1.0.0')).toBe(false);
  expect(ServerVersion.lt('1.0.0')).toBe(false);
  expect(ServerVersion.lte('1.0.0')).toBe(true);
  expect(ServerVersion.gte('1.0.0')).toBe(true);

  ServerVersion.version = '1.15.0';
  expect(ServerVersion.gt('1.14.5')).toBe(true);
  expect(ServerVersion.lt('1.14.5')).toBe(false);
});
