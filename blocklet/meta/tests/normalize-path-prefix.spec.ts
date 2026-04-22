import { describe, test, expect } from 'bun:test';
import { normalizePathPrefix } from '../src/normalize-path-prefix';

describe('normalizePathPrefix', () => {
  test('should handle edge case', () => {
    expect(normalizePathPrefix('')).toEqual('/');
    expect(normalizePathPrefix('/')).toEqual('/');
  });

  test('should handle normal case', () => {
    expect(normalizePathPrefix('2048')).toEqual('/2048/');
    expect(normalizePathPrefix('/demo///')).toEqual('/demo/');
    expect(normalizePathPrefix('/demo')).toEqual('/demo/');
    expect(normalizePathPrefix('/manager/')).toEqual('/manager/');
  });
});
