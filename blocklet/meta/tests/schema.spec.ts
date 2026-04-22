import { describe, test, expect } from 'bun:test';
import { environmentNameSchema, authConfigSchema, logoSchema, cacheableSchema, eventsSchema } from '../src/schema';

describe('environmentNameSchema', () => {
  test('should environmentNameSchema work as expected', () => {
    // good case
    expect(environmentNameSchema.validateAsync('key')).resolves.toBeTruthy();
    expect(environmentNameSchema.validateAsync('key1')).resolves.toBeTruthy();
    expect(environmentNameSchema.validateAsync('key1_a')).resolves.toBeTruthy();
    expect(environmentNameSchema.validateAsync('CHAIN_TYPE')).resolves.toBeTruthy();

    // bad case
    expect(environmentNameSchema.validateAsync('BLOCKLET_WALLET_TYPE')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync()).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync(new Array(51).fill('a').join(''))).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('BLOCKLET')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('BLOCKLET')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('BLOCKLET_XXX')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('COMPONENT')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('COMPONENT_XXX')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('ABTNODE')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('ABTNODE_XXX')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('a.b')).rejects.toBeTruthy();
    expect(environmentNameSchema.validateAsync('a-b')).rejects.toBeTruthy();
  });
});

describe('authConfigSchema', () => {
  test('should authConfigSchema work as expected', () => {
    // good case
    const { value: v1 } = authConfigSchema.validate({
      whoCanAccess: 'owner',
      profileFields: ['fullName', 'avatar'],
      ignoreUrls: ['/api/**'],
      allowSwitchProfile: true,
      blockUnauthenticated: false,
      blockUnauthorized: false,
    });

    expect(v1).toEqual({
      whoCanAccess: 'owner',
      profileFields: ['fullName', 'avatar'],
      ignoreUrls: ['/api/**'],
      allowSwitchProfile: true,
      blockUnauthenticated: false,
      blockUnauthorized: false,
    });

    const { value: v2 } = authConfigSchema.validate();
    expect(v2).toEqual(undefined);

    const { value: v3 } = authConfigSchema.validate({});
    expect(v3).toEqual({});

    const { value: v4 } = authConfigSchema.validate({ unknownProp: 'xxxxx' });
    expect(v4).toEqual({});

    // bad case
    expect(authConfigSchema.validateAsync({ whoCanAccess: 'unknown' })).rejects.toBeTruthy();
    expect(authConfigSchema.validateAsync({ profileFields: ['unknown'] })).rejects.toBeTruthy();
    expect(authConfigSchema.validateAsync({ ignoreUrls: [''] })).rejects.toBeTruthy();
    expect(authConfigSchema.validateAsync({ allowSwitchProfile: 'not boolean' })).rejects.toBeTruthy();
    expect(authConfigSchema.validateAsync({ blockUnauthenticated: 'not boolean' })).rejects.toBeTruthy();
    expect(authConfigSchema.validateAsync({ blockUnauthorized: 'not boolean' })).rejects.toBeTruthy();
  });
});

test('logoSchema', () => {
  expect(logoSchema.validateAsync('')).resolves.toBe('');
  expect(logoSchema.validateAsync('https://logo.png')).resolves.toBeTruthy();
  expect(logoSchema.validateAsync('http://logo.png')).resolves.toBeTruthy();
  expect(logoSchema.validateAsync('/path/to/logo')).resolves.toBeTruthy();
  expect(logoSchema.validateAsync('https://myapp.xyz/.well-known/service/blocklet/logo')).rejects.toThrow(
    'logo url should not include /.well-known/service/blocklet/logo'
  );
});

test('cacheableSchema', () => {
  expect(cacheableSchema.validate('').error).toBeTruthy();
  expect(cacheableSchema.validate(' ').error).toBeTruthy();
  expect(cacheableSchema.validate('/').error).toBeTruthy();
  expect(cacheableSchema.validate('//').error).toBeTruthy();
  expect(cacheableSchema.validate('/a').value).toBe('/a');
  expect(cacheableSchema.validate('//a').value).toBe('/a');
  expect(cacheableSchema.validate('a').value).toBe('/a');
  expect(cacheableSchema.validate('/a/b/c').value).toBe('/a/b/c');
  expect(cacheableSchema.validate('//a/b/c').value).toBe('/a/b/c');
  expect(cacheableSchema.validate('a/b/c').value).toBe('/a/b/c');
  expect(cacheableSchema.validate('/aa/bb/cc').value).toBe('/aa/bb/cc');
  expect(cacheableSchema.validate('aa/bb/cc').value).toBe('/aa/bb/cc');
});

test('eventsSchema', () => {
  expect(eventsSchema.validateAsync([])).resolves.toEqual([]);
  expect(eventsSchema.validateAsync([{ type: 'post.published', description: 'Post published' }])).resolves.toEqual([
    { type: 'post.published', description: 'Post published' },
  ]);
  expect(
    eventsSchema.validateAsync([
      { type: 'post.published', description: 'Post published' },
      { type: 'post.comment.published', description: 'Post comment published' },
    ])
  ).resolves.toEqual([
    { type: 'post.published', description: 'Post published' },
    { type: 'post.comment.published', description: 'Post comment published' },
  ]);

  expect(
    eventsSchema.validateAsync([
      { type: 'post.published', description: 'Post published' },
      { type: 'post.published', description: 'Post published' },
    ])
  ).rejects.toThrow(/duplicate/);

  expect(
    eventsSchema.validateAsync([{ type: 'blocklet.post.published', description: 'Post published' }])
  ).rejects.toThrow(/reserved/);

  expect(eventsSchema.validateAsync([{ type: 'published', description: 'Post published' }])).rejects.toThrow(/format/);
});
