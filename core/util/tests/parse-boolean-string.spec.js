const { describe, expect, it } = require('bun:test');
const parseBooleanString = require('../lib/parse-boolean-string');

describe('parseBooleanString', () => {
  it('should parse boolean string', () => {
    const obj = {
      a: 'true',
      b: 'false',
      c: 'true',
    };

    const result = parseBooleanString(obj);

    expect(result).toEqual({
      a: true,
      b: false,
      c: true,
    });
  });

  it('should throw error when input is not object', () => {
    expect(() => parseBooleanString('')).toThrowError('parseBooleanString should be an object');
  });

  it('should handle other type values', () => {
    const obj = {
      a: 'true',
      b: 'false',
      c: 123,
      d: null,
      e: undefined,
      f: {},
      j: [],
    };

    const result = parseBooleanString(obj);
    expect(result).not.toEqual(obj);
    expect(result).toEqual({
      a: true,
      b: false,
      c: 123,
      d: null,
      e: undefined,
      f: {},
      j: [],
    });
  });

  it('use keys', () => {
    const obj = {
      a: 'true',
      b: 'false',
      c: 123,
      d: null,
      e: undefined,
      f: {},
      j: [],
    };

    const result = parseBooleanString(obj, ['a', 'c']);
    expect(result).not.toEqual(obj);
    expect(result).toEqual({
      a: true,
      b: 'false',
      c: 123,
      d: null,
      e: undefined,
      f: {},
      j: [],
    });
  });
});
