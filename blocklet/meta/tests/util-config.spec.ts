import { describe, test, expect } from 'bun:test';
import path from 'node:path';
import { getConfigs, getSecureConfigKeys, removeSecureConfigs } from '../src/util-config';

describe('getConfigs', () => {
  test('should work as expected', () => {
    // exclude secure config
    expect(
      getConfigs(
        {
          meta: { did: 'a' },
          configs: [
            { key: 'propA', value: 'a' },
            { key: 'secureProp', value: '', secure: true },
            { key: 'sharedProp', value: '', shared: true },
            { key: 'privateProp', value: '', shared: false },
          ],
        },
        'a'
      )
    ).toEqual([
      { key: 'propA', value: 'a' },
      { key: 'sharedProp', value: '' },
    ]);

    // use child config first
    expect(
      getConfigs(
        {
          meta: { did: 'P' },
          configs: [
            { key: 'propA', value: 'parentA' },
            { key: 'propB', value: 'b', secure: true },
          ],
          configObj: { propA: 'parentA', propB: 'b' },
          children: [
            {
              meta: { did: 'C' },
              configs: [
                { key: 'propA', value: 'childA' },
                { key: 'childProp', value: 'child prop' },
                { key: 'childSecureProp', value: '', secure: true },
              ],
            },
          ],
        },
        'P/C'
      )
    ).toEqual([
      { key: 'propA', value: 'childA' },
      { key: 'childProp', value: 'child prop' },
    ]);

    // exclude system config
    expect(
      getConfigs(
        {
          meta: { did: 'a' },
          configs: [
            { key: 'propA', value: 'a' },
            { key: 'BLOCKLET_APP_NAME', value: 'a' },
          ],
        },
        'a'
      )
    ).toEqual([{ key: 'propA', value: 'a' }]);

    expect(
      getConfigs(
        {
          meta: { did: 'P' },
          configs: [{ key: 'propA', value: 'parentA' }],
          children: [
            {
              meta: { did: 'C' },
              configs: [
                { key: 'childProp', value: 'child prop' },
                { key: 'BLOCKLET_APP_NAME', value: 'a' },
              ],
            },
          ],
        },
        'P/C'
      )
    ).toEqual([
      { key: 'childProp', value: 'child prop' },
      { key: 'propA', value: 'parentA' },
    ]);

    // shared
    expect(
      getConfigs(
        {
          configs: [{ key: 'propA', value: 'parentA', shared: false }],
          children: [
            {
              meta: { did: 'A' },
              configs: [
                { key: 'childProp', value: 'child prop', shared: false },
                { key: 'BLOCKLET_APP_NAME', value: 'a' },
              ],
            },
          ],
        },
        'A'
      )
    ).toEqual([]);
  });
});

describe('removeSecureConfigs', () => {
  const fn = removeSecureConfigs;
  test('should work as expected', () => {
    expect(fn({ a: 'a' }, [])).toEqual({ a: 'a' });
    expect(fn({ a: 'a' }, ['b'])).toEqual({ a: 'a' });
    expect(fn({ a: 'a' }, ['a'])).toEqual({});
    expect(fn({ a: 'a', b: 'b' }, ['a'])).toEqual({ b: 'b' });
    expect(fn({ a: 'a', b: [{ a: 'a', b: 'b' }] }, ['a', 'b.[].a'])).toEqual({ b: [{ b: 'b' }] });

    expect(fn({ 'prefs.a': 'a' }, [])).toEqual({ 'prefs.a': 'a' });
    expect(fn({ 'prefs.a': 'a' }, ['b'])).toEqual({ 'prefs.a': 'a' });
    expect(fn({ 'prefs.a': 'a' }, ['prefs.a'])).toEqual({});
    expect(fn({ 'prefs.a': 'a', b: 'b' }, ['prefs.a'])).toEqual({ b: 'b' });
    expect(fn({ 'prefs.a': 'a', 'prefs.b': [{ a: 'a', b: 'b' }] }, ['prefs.a', 'prefs.b.[].a'])).toEqual({
      'prefs.b': [{ b: 'b' }],
    });
  });
});

describe('getSecureConfigKeys', () => {
  const fn = getSecureConfigKeys;
  test('should parse file as expected', () => {
    const blocklet = { env: { appDir: path.resolve(__dirname, '../../../core/state/tests/assets') } };
    const result = fn(blocklet);
    expect(result).toEqual([
      'prefs.relays.[].accessSecret',
      'prefs.input',
      'prefs.email',
      'prefs.pass',
      'prefs.gridPass',
    ]);
  });

  test('should parse empty file as expected', () => {
    const blocklet = { env: { appDir: path.resolve('/tmp/not-exist/') } };
    const result = fn(blocklet);
    expect(result).toEqual([]);
  });
});
