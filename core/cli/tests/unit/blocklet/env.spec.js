const { describe, expect, test } = require('bun:test');
const { mergeBlockletConfigEntry } = require('../../../lib/util/blocklet/env');

describe('Env', () => {
  describe('mergeBlockletConfigEntry', () => {
    test('should work as expected: skipUnknown', () => {
      let result = {};
      let blocklet = { meta: { did: 'a', environments: [] } };
      mergeBlockletConfigEntry(blocklet, 'key', 'value', result, 'a', [], true);
      expect(result.a).toBeUndefined();

      result = {};
      blocklet = { meta: { did: 'a', name: 'test', environments: [{ name: 'key' }] } };
      mergeBlockletConfigEntry(blocklet, 'key', 'value', result, 'a', [], true);
      expect(result.a).toEqual({ configs: [{ key: 'key', value: 'value' }], did: ['a'], name: 'test' });

      result = {};
      blocklet = { meta: { did: 'a', name: 'test', environments: [{ name: 'key' }] } };
      mergeBlockletConfigEntry(blocklet, 'key', 'value', result, 'a', [], true);
      mergeBlockletConfigEntry(blocklet, 'key2', 'value2', result, 'a', [], true);
      expect(result.a).toEqual({ configs: [{ key: 'key', value: 'value' }], did: ['a'], name: 'test' });
    });

    test('should work as expected: withUnknown', () => {
      let result = {};
      let blocklet = { meta: { did: 'a', name: 'test', environments: [] } };
      mergeBlockletConfigEntry(blocklet, 'key', 'value', result, 'a', [], false);
      expect(result.a).toEqual({
        configs: [{ key: 'key', value: 'value', custom: true, required: false, shared: true }],
        did: ['a'],
        name: 'test',
      });

      result = {};
      blocklet = { meta: { did: 'a', name: 'test', environments: [{ name: 'key' }] } };
      mergeBlockletConfigEntry(blocklet, 'key', 'value', result, 'a', [], false);
      expect(result.a).toEqual({ configs: [{ key: 'key', value: 'value' }], did: ['a'], name: 'test' });

      mergeBlockletConfigEntry(blocklet, 'key', 'value1', result, 'a', [], false);
      expect(result.a).toEqual({ configs: [{ key: 'key', value: 'value1' }], did: ['a'], name: 'test' });

      mergeBlockletConfigEntry(blocklet, 'key2', 'value2', result, 'a', [], false);
      expect(result.a).toEqual({
        configs: [
          { key: 'key', value: 'value1' },
          {
            custom: true,
            key: 'key2',
            required: false,
            shared: true,
            value: 'value2',
          },
        ],
        did: ['a'],
        name: 'test',
      });

      mergeBlockletConfigEntry(blocklet, 'key2', 'value22', result, 'a', [], false);
      expect(result.a).toEqual({
        configs: [
          { key: 'key', value: 'value1' },
          {
            custom: true,
            key: 'key2',
            required: false,
            shared: true,
            value: 'value22',
          },
        ],
        did: ['a'],
        name: 'test',
      });
    });
  });
});
