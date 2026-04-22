const { test, expect, describe, beforeAll } = require('bun:test');
const BaseProvider = require('../lib/base');

describe('base', () => {
  let base = null;
  beforeAll(() => {
    base = new BaseProvider('test-base');
  });

  test('should have name field', () => {
    expect(base.name).toEqual('test-base');
  });

  test('should throw error when call initialize()', () => {
    expect(base.initialize).toThrow(/method is not implemented/);
  });

  test('should throw error when call start()', () => {
    expect(base.start).toThrow(/method is not implemented/);
  });

  test('should throw error when call restart()', () => {
    expect(base.restart).toThrow(/method is not implemented/);
  });

  test('should throw error when call reload()', () => {
    expect(base.reload).toThrow(/method is not implemented/);
  });

  test('should throw error when call update()', () => {
    expect(base.update).toThrow(/method is not implemented/);
  });

  test('should throw error when call stop()', () => {
    expect(base.stop).toThrow(/method is not implemented/);
  });

  test('should throw error when call validateConfig()', () => {
    expect(base.validateConfig).toThrow(/method is not implemented/);
  });

  test('should throw error when call rotateLogs()', () => {
    expect(base.rotateLogs).toThrow(/method is not implemented/);
  });
});
