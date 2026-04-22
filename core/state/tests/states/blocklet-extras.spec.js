const { describe, test, expect, beforeAll, beforeEach, afterAll, spyOn } = require('bun:test');
const { BLOCKLET_CONFIGURABLE_KEY } = require('@blocklet/constant');

const ExtrasState = require('../../lib/states/blocklet-extras');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('BlockletExtrasState', () => {
  let store = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    store = new ExtrasState(models.BlockletExtra, {});
  });

  beforeEach(() => {
    spyOn(console, 'info').mockReturnValue();
  });

  describe('Configs', () => {
    const configsV1 = [
      {
        key: 'key',
        value: 'value1V1',
        required: true,
        description: '',
        secure: false,
        validation: '',
        custom: false,
      },
    ];

    const configsV2 = [
      {
        key: 'key',
        value: 'value1V2',
        required: true,
        description: '',
        secure: false,
        validation: '',
        custom: false,
      },
    ];

    const configs2 = [
      {
        key: 'key2',
        value: 'value2',
        required: true,
        description: '',
        secure: false,
        validation: '',
        custom: false,
      },
    ];

    beforeEach(async () => {
      await store.delete('did1');
      await store.delete('did2');
    });

    test('add configs when did is not exit', async () => {
      const item = await store.setConfigs('did1', configsV1);
      expect(item).toEqual(configsV1);
    });

    test('update configs when did is exit', async () => {
      await store.setConfigs('did1', configsV1);
      const item = await store.setConfigs('did1', configsV2);
      expect(item).toEqual(configsV2);
    });

    test('update configs when reinstall', async () => {
      const environmentConfigs = [
        {
          name: 'key',
          description: 'value11111111',
          default: 'value11111111',
          required: true,
          secure: true,
          validation: '',
          custom: false,
        },
        {
          name: 'key2',
          description: 'key2',
          default: 'value2',
          required: true,
          secure: false,
          validation: '',
          custom: false,
        },
      ];

      await store.setConfigs('did1', configsV1);
      const item = await store.setConfigs('did1', environmentConfigs);
      expect(item.length).toBe(2);
      expect(item[0].key).toBe(configsV1[0].key);
      expect(item[0].name).toBeUndefined();
      expect(item[0].value).toBe(configsV1[0].value);
      expect(item[0].description).toBe(environmentConfigs[0].description);
      expect(item[1].key).toBe('key2');
      expect(item[1].value).toBe('value2');

      // mock: remove environment in blocklet.yml
      const environmentConfigs2 = [
        {
          name: 'key',
          description: 'xxx',
          default: 'xxx',
          required: true,
          secure: true,
          validation: '',
          custom: false,
        },
      ];
      const item2 = await store.setConfigs('did1', environmentConfigs2);
      expect(item2.length).toBe(1); // key2 is removed
      expect(item2[0].key).toBe(configsV1[0].key);
      expect(item2[0].value).toBe(configsV1[0].value);
    });

    test('get configs', async () => {
      await store.setConfigs('did1', configsV1);
      await expect(store.getConfigs('did1')).resolves.toEqual(configsV1);
      await expect(store.getConfigs('did2')).resolves.toBeFalsy();
    });

    test('del configs by did', async () => {
      await store.setConfigs('did1', configsV1);

      await expect(store.delConfigs('did1')).resolves.toEqual(configsV1);
      await expect(store.getConfigs('did1')).resolves.toBeFalsy();
    });

    test('should child configs CRUD works as expected', async () => {
      const r1 = await store.setConfigs(['did1', 'did2'], configsV1);
      expect(r1).toEqual(configsV1);

      const r2 = await store.getConfigs(['did1', 'did2']);
      expect(r2).toEqual(configsV1);

      const r3 = await store.delConfigs(['did1', 'did2']);
      expect(r3).toEqual(configsV1);

      const r4 = await store.getConfigs(['did1', 'did2']);
      expect(r4).toBe(null);
    });

    test('should list all configs as expected', async () => {
      const list = await store.listConfigs();
      expect(list.length).toBe(0);

      await store.setConfigs('did1', configsV2);
      await store.setConfigs('did2', configsV2);
      const list2 = await store.listConfigs();
      expect(list2.length).toBe(2);
      expect(list2[0]).toEqual({ did: 'did1', configs: configsV2 });
      expect(list2[1]).toEqual({ did: 'did2', configs: configsV2 });

      await store.delConfigs('did1');
      const list3 = await store.listConfigs();
      expect(list3.length).toBe(1);
      expect(list3[0]).toEqual({ did: 'did2', configs: configsV2 });
    });

    test('should respect default value in secure env', async () => {
      const baseProps = {
        description: '',
        required: true,
        validation: '',
        custom: false,
      };
      const item = await store.setConfigs('did1', [
        {
          name: 'secureKey',
          default: 'defaultValue',
          secure: true,
          ...baseProps,
        },
      ]);
      expect(item).toEqual([
        {
          key: 'secureKey',
          value: 'defaultValue',
          secure: true,
          ...baseProps,
        },
      ]);
    });

    test('should nested component configs CRUD works as expected', async () => {
      const r1 = await store.setConfigs(['did1', 'did2'], configsV1);
      expect(r1).toEqual(configsV1);

      const r2 = await store.getConfigs(['did1', 'did2']);
      expect(r2).toEqual(configsV1);

      const r3 = await store.setConfigs(['did1', 'did2', 'did3'], configs2);
      expect(r3).toEqual(configs2);

      const r4 = await store.getConfigs(['did1', 'did2']);
      expect(r4).toEqual(configsV1);

      const r5 = await store.getConfigs(['did1', 'did2', 'did3']);
      expect(r5).toEqual(configs2);

      const r6 = await store.delConfigs(['did1', 'did2', 'did3']);
      expect(r6).toEqual(configs2);

      const r7 = await store.getConfigs(['did1', 'did2', 'did3']);
      expect(r7).toBe(null);

      const r8 = await store.getConfigs(['did1', 'did2']);
      expect(r8).toEqual(configsV1);
    });

    test('"shared" prop in config', async () => {
      // add by key
      expect(store.getConfigs('did1')).resolves.toBeFalsy();
      await store.setConfigs('did1', [
        {
          key: 'k1',
          value: 'v1',
          shared: undefined,
        },
      ]);
      const r1 = await store.getConfigs('did1');
      expect(r1[0].shared).toBe(undefined);

      await store.delConfigs('did1');
      expect(store.getConfigs('did1')).resolves.toBeFalsy();

      await store.setConfigs('did1', [
        {
          key: 'k1',
          value: 'v1',
          shared: false,
        },
      ]);
      const r2 = await store.getConfigs('did1');
      expect(r2[0].shared).toBe(false);

      await store.delConfigs('did1');
      expect(store.getConfigs('did1')).resolves.toBeFalsy();

      await store.setConfigs('did1', [
        {
          key: 'k1',
          value: 'v1',
        },
      ]);
      const r3 = await store.getConfigs('did1');
      expect(r3[0].shared).toBe(undefined);

      // update by name
      await store.setConfigs('did1', [
        {
          name: 'k1',
          default: 'v2',
          shared: true,
        },
      ]);
      const r4 = await store.getConfigs('did1');
      expect(r4[0].shared).toBe(true);
      expect(r4[0].value).toBe('v1');

      // add by name
      await store.setConfigs('did2', [
        {
          name: 'k2',
          default: 'v2',
          shared: true,
        },
      ]);
      const r5 = await store.getConfigs('did2');
      expect(r5[0].shared).toBe(true);

      await store.delConfigs('did1');
      await store.delConfigs('did2');
    });

    test('should keep app config when blocklet upgraded', async () => {
      const environments = [
        {
          name: 'key1',
          description: 'key1 desc',
          default: 'value1',
          required: false,
          secure: false,
        },
      ];

      // mock install blocklet
      await store.setConfigs('did1', environments);

      const res1 = await store.getConfigs('did1');
      expect(res1.length).toBe(1);
      expect(res1[0].key).toBe('key1');
      expect(res1[0].value).toBe('value1');

      // add custom config (custom should be true)
      await store.setConfigs('did1', [
        {
          key: 'custom-key',
          value: 'custom-value',
          custom: true,
        },
      ]);

      // update meta config (custom should NOT be true)
      await store.setConfigs('did1', [
        {
          key: 'key1',
          value: 'custom-value1',
        },
      ]);

      // update app config (custom should NOT be true)
      await store.setConfigs('did1', [
        {
          key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_APP_NAME,
          value: 'custom blocklet name',
        },
      ]);

      const res2 = await store.getConfigs('did1');
      expect(res2.length).toBe(3);
      expect(res2.some((x) => x.key === 'key1')).toBe(true);
      expect(res2.find((x) => x.key === 'key1').value).toBe('custom-value1');
      expect(res2.some((x) => x.key === 'custom-key')).toBe(true);
      expect(res2.some((x) => x.key === 'BLOCKLET_APP_NAME')).toBe(true);
      expect(res2.find((x) => x.key === 'BLOCKLET_APP_NAME').value).toBe('custom blocklet name');

      // mock upgrade blocklet
      await store.setConfigs('did1', environments);

      const res3 = await store.getConfigs('did1');
      expect(res3.length).toBe(3);
      expect(res3.some((x) => x.key === 'key1')).toBe(true);
      expect(res3.find((x) => x.key === 'key1').value).toBe('custom-value1');
      expect(res3.some((x) => x.key === 'custom-key')).toBe(true);
      expect(res3.some((x) => x.key === 'BLOCKLET_APP_NAME')).toBe(true);
      expect(res3.find((x) => x.key === 'BLOCKLET_APP_NAME').value).toBe('custom blocklet name');
    });

    test('should app config defined in blocklet.yml work as expected', async () => {
      // mock install blocklet ( developer defined BLOCKLET_WALLET_TYPE in blocklet.yml)
      await store.setConfigs('did1', [
        {
          name: 'BLOCKLET_WALLET_TYPE',
          description: 'wallet type',
          default: 'eth',
          required: false,
          secure: false,
        },
      ]);

      const res1 = await store.getConfigs('did1');
      expect(res1.length).toBe(1);
      expect(res1[0].key).toBe('BLOCKLET_WALLET_TYPE');
      expect(res1[0].value).toBe('eth');

      // update app config (custom should NOT be true)
      await store.setConfigs('did1', [
        {
          key: BLOCKLET_CONFIGURABLE_KEY.BLOCKLET_WALLET_TYPE,
          value: 'default',
        },
      ]);

      const res2 = await store.getConfigs('did1');
      expect(res2.length).toBe(1);
      expect(res2[0].key).toBe('BLOCKLET_WALLET_TYPE');
      expect(res2[0].value).toBe('default');

      // mock upgrade blocklet
      // 仅测试, 实际场景不会这么做
      await store.setConfigs('did1', [
        {
          name: 'BLOCKLET_WALLET_TYPE',
          description: 'wallet type',
          default: 'eth',
          required: false,
          secure: false,
        },
      ]);

      const res3 = await store.getConfigs('did1');
      expect(res3.length).toBe(1);
      expect(res3[0].key).toBe('BLOCKLET_WALLET_TYPE');
      expect(res3[0].value).toBe('default');

      // mock upgrade blocklet (developer removed BLOCKLET_WALLET_TYPE in blocklet.yml)
      // 仅测试, 实际场景不会这么做
      await store.setConfigs('did1', []);

      // BLOCKLET_CONFIGURABLE_KEY will not removed
      const res4 = await store.getConfigs('did1');
      expect(res4.length).toBe(1);
      expect(res4[0].key).toBe('BLOCKLET_WALLET_TYPE');
      expect(res4[0].value).toBe('default');

      await store.reset();
    });
  });

  describe('Settings', () => {
    const settings1 = { a: 1 };
    const insert1 = { b: 2 };
    const settings2 = { a: 1, b: 2 };
    const update2 = { a: 2 };
    const settings3 = { a: 2, b: 2 };
    const remove3 = { a: undefined, b: undefined };
    const settings4 = {};

    test('create setting', async () => {
      await expect(store.getSettings('did1')).resolves.toBeFalsy();
      await expect(store.setSettings('did1', settings1)).resolves.toEqual(settings1);
      await expect(store.getSettings('did1')).resolves.toEqual(settings1);
    });

    test('get prop in setting', async () => {
      await expect(store.getSettings('did1', 'a')).resolves.toBe(1);
      await expect(store.getSettings('did1', 'children')).resolves.toBe(undefined);
      await expect(store.getSettings('did1', 'children', [])).resolves.toEqual([]);
    });

    test('insert item to setting', async () => {
      await expect(store.getSettings('did1')).resolves.toEqual(settings1);
      await expect(store.setSettings('did1', insert1)).resolves.toEqual(settings2);
      await expect(store.getSettings('did1')).resolves.toEqual(settings2);
    });

    test('update item to setting', async () => {
      await expect(store.getSettings('did1')).resolves.toEqual(settings2);
      await expect(store.setSettings('did1', update2)).resolves.toEqual(settings3);
      await expect(store.getSettings('did1')).resolves.toEqual(settings3);
    });

    test('remove item to setting', async () => {
      await expect(store.getSettings('did1')).resolves.toEqual(settings3);
      await expect(store.setSettings('did1', remove3)).resolves.toEqual(settings4); // empty object
      await expect(store.getSettings('did1')).resolves.toEqual(settings4); // empty object
    });

    test('remove setting', async () => {
      await expect(store.getSettings('did1')).resolves.toEqual(settings4);
      await expect(store.delSettings('did1')).resolves.toEqual(settings4);
      await expect(store.getSettings('did1')).resolves.toBeFalsy();
    });

    test('should list all settings as expected', async () => {
      await store.delete('did1');
      await store.delete('did2');

      const list = await store.listConfigs();
      expect(list.length).toBe(0);

      await store.setSettings('did1', settings1);
      await store.setSettings('did2', settings1);
      const list2 = await store.listSettings();
      expect(list2.length).toBe(2);
      expect(list2[0]).toEqual({ did: 'did1', settings: settings1 });
      expect(list2[1]).toEqual({ did: 'did2', settings: settings1 });

      await store.delSettings('did1');
      const list3 = await store.listSettings();
      expect(list3.length).toBe(1);
      expect(list3[0]).toEqual({ did: 'did2', settings: settings1 });
    });
  });

  describe('addMeta', () => {
    const did = 'z1oDGYZjQYJHkuubL4D6vDYGuyEiu3Ve9Xk';

    test('should throw error if data invalid', () => {
      expect(store.addMeta({})).rejects.toThrow(/is required/);
      expect(store.addMeta({ did })).rejects.toThrow('"meta" is required');
      expect(store.addMeta({ did, meta: null })).rejects.toThrow('"meta" must be of type object');
      expect(store.addMeta({ did, meta: { did } })).rejects.toThrow('"meta.name" is required');
      expect(store.addMeta({ did, meta: { did, name: {} } })).rejects.toThrow('"meta.name" must be a string');
      expect(
        store.addMeta({ did, meta: { did: 'z1cBAYkiJTWnxu6QPT6YTwQ5JW1U2LapiuK', name: 'test' } })
      ).rejects.toThrow('"did" must be [ref:meta.did]');
    });

    test('should add with controller as expected', async () => {
      const data = {
        did,
        meta: { did, name: 'test' },
        controller: { nftId: did, nftOwner: did, chainHost: 'https://beta.abtnetwork.io/api/' },
      };

      const doc = await store.addMeta(data);

      expect(doc).toBeTruthy();
      expect(doc.meta).toEqual(data.meta);
      expect(doc.controller).toEqual(data.controller);
    });

    test('should add with empty controller as expected', async () => {
      const data = { did, meta: { did, name: 'test' }, controller: null };
      const doc = await store.addMeta(data);
      expect(doc).toBeTruthy();
    });

    test('should update the data if already exists', async () => {
      const data = {
        did,
        meta: { did, name: 'test' },
        controller: { nftId: did, nftOwner: did, chainHost: 'https://beta.abtnetwork.io/api/' },
      };

      const doc = await store.addMeta(data);
      expect(doc).toBeTruthy();

      data.meta.name = 'test-2';
      await store.addMeta(data);

      const dbData = await store.findOne({ did });
      expect(dbData.meta.name).toEqual(data.meta.name);
    });
  });

  describe('getNoIndexOverrides', () => {
    beforeEach(async () => {
      await store.delete('did-noindex-1');
      await store.delete('did-noindex-2');
      await store.delete('did-noindex-3');
    });

    test('should return empty object when no blocklets have APP_NO_INDEX', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'OTHER_KEY', value: 'test' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({});
    });

    test('should return true for blocklets with APP_NO_INDEX=true', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'APP_NO_INDEX', value: 'true' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({ 'did-noindex-1': true });
    });

    test('should return false for blocklets with APP_NO_INDEX=false', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'APP_NO_INDEX', value: 'false' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({ 'did-noindex-1': false });
    });

    test('should return overrides for multiple blocklets', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'APP_NO_INDEX', value: 'true' }]);
      await store.setConfigs('did-noindex-2', [{ key: 'APP_NO_INDEX', value: 'false' }]);
      await store.setConfigs('did-noindex-3', [{ key: 'OTHER_KEY', value: 'test' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({ 'did-noindex-1': true, 'did-noindex-2': false });
    });

    test('should skip blocklets with empty APP_NO_INDEX value', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'APP_NO_INDEX', value: '' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({});
    });

    test('should treat "1" as true and "0" as false', async () => {
      await store.setConfigs('did-noindex-1', [{ key: 'APP_NO_INDEX', value: '1' }]);
      await store.setConfigs('did-noindex-2', [{ key: 'APP_NO_INDEX', value: '0' }]);
      const result = await store.getNoIndexOverrides();
      expect(result).toEqual({ 'did-noindex-1': true, 'did-noindex-2': false });
    });
  });

  afterAll(async () => {
    await store.reset();
  });
});
