import { it, expect, describe } from 'bun:test';
import { dockerArgsToCamelCase, dockerCamelCaseToDash } from '../src/docker-args-to-camel-case';

describe('docker-args-to-camel-case', () => {
  it('should convert dash to camel case', () => {
    expect(dockerArgsToCamelCase('--aa-bb')).toBe('aaBb');
    expect(dockerArgsToCamelCase('--aa-bb-cc')).toBe('aaBbCc');
    expect(dockerArgsToCamelCase('--a')).toBe('a');
  });

  it('should convert camel case to dash', () => {
    expect(dockerCamelCaseToDash('aaBb')).toBe('--aa-bb');
    expect(dockerCamelCaseToDash('publish')).toBe('--publish');
    expect(dockerCamelCaseToDash('aaBbCc')).toBe('--aa-bb-cc');
  });
});
