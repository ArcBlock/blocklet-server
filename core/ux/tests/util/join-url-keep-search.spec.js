import { describe, expect, it } from 'bun:test';
import joinUrlKeepSearch from '../../src/util/join-url-keep-search';

describe('join-url-keep-search', () => {
  it('should return the correct URL when the original URL is an empty string', () => {
    const originalUrl = 'http://example.com?language=en';
    const path = '.well-known/service/admin';
    const expectedUrl = 'http://example.com/.well-known/service/admin?language=en';

    const result = joinUrlKeepSearch(originalUrl, path);

    expect(result).toEqual(expectedUrl);
  });

  it('should handle null and undefined correctly', () => {
    const originalUrl = 'http://example.com?language=en';

    expect(joinUrlKeepSearch(originalUrl, '')).toEqual(originalUrl);
    expect(joinUrlKeepSearch(originalUrl, null)).toEqual(originalUrl);
    expect(joinUrlKeepSearch(originalUrl, undefined)).toEqual(originalUrl);
    expect(joinUrlKeepSearch('', '.well-known/service/admin')).toEqual('');
    expect(joinUrlKeepSearch(null, '.well-known/service/admin')).toEqual('');
    expect(joinUrlKeepSearch(undefined, '.well-known/service/admin')).toEqual('');
  });
});
