const { describe, expect, test, afterEach, mock } = require('bun:test');
const isValidPort = require('../lib/is-valid-port');

describe('isValidPort', () => {
  afterEach(() => {
    mock.clearAllMocks();
  });

  test('should return false if the value is not a safe integer', () => {
    expect(isValidPort(3.1)).toBe(false);
    expect(isValidPort('3')).toBe(false);
  });

  test('should return false if value little than 0', () => {
    Number.isSafeInteger = mock(() => true);
    expect(isValidPort(-1)).toBe(false);
    expect(Number.isSafeInteger.mock.calls.length).toBe(1);
  });

  test('should return false if value greater than 65536', () => {
    Number.isSafeInteger = mock(() => true);
    expect(isValidPort(65536)).toBe(false);
    expect(Number.isSafeInteger.mock.calls.length).toBe(1);
  });

  test('should return true if value in range 0 ~ 65535', () => {
    Number.isSafeInteger = mock(() => true);
    expect(isValidPort(0)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(Number.isSafeInteger.mock.calls.length).toBe(2);
  });
});
