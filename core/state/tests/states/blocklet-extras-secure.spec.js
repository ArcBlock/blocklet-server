const { describe, test, expect, beforeAll, beforeEach, afterAll } = require('bun:test');
const crypto = require('crypto');

const dek = crypto.randomBytes(32);

const ExtrasState = require('../../lib/states/blocklet-extras');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('BlockletExtrasState - Secure', () => {
  let store = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    store = new ExtrasState(models.BlockletExtra, { dek });
  });

  beforeEach(async () => {
    await store.delete('did1');
    await store.delete('did2');
  });

  test('add secure configs when did is not exit', async () => {
    const noSecureConfig = {
      key: 'key',
      value: 'originalValue',
      required: true,
      description: 'originalDescription',
      secure: false,
      validation: '',
      custom: false,
    };
    const secureConfig = { ...noSecureConfig, secure: true };

    const item1 = await store.setConfigs('did1', [secureConfig]);
    expect(item1).toEqual([secureConfig]);
    const item11 = await store.findOne({ did: 'did1' });
    expect(item11.configs[0].value).not.toBe('originalValue');
    const item12 = await store.getConfigs('did1');
    expect(item12[0].value).toBe('originalValue');
    const item13 = await store.getConfigs(['did1']);
    expect(item13[0].value).toBe('originalValue');

    const item2 = await store.setConfigs('did2', [noSecureConfig]);
    expect(item2).toEqual([noSecureConfig]);
    const item21 = await store.findOne({ did: 'did2' });
    expect(item21.configs[0].value).toBe('originalValue');
  });

  test('add secure configs from meta', async () => {
    const noSecureEnvironmentConfig = {
      name: 'name',
      description: 'description',
      default: 'defaultValue',
      required: true,
      secure: false,
      validation: '',
      custom: false,
    };
    const secureEnvironmentConfig = {
      ...noSecureEnvironmentConfig,
      secure: true,
    };
    const item1 = await store.setConfigs('did1', [secureEnvironmentConfig]);
    expect(item1[0].value).toBe('defaultValue');

    const item11 = await store.findOne({ did: 'did1' });
    expect(item11.configs[0].value).not.toBe('defaultValue');

    const item2 = await store.setConfigs('did2', [noSecureEnvironmentConfig]);
    expect(item2[0].value).toBe('defaultValue');

    const item21 = await store.findOne({ did: 'did2' });
    expect(item21.configs[0].value).toBe('defaultValue');
  });

  test('update configs when reinstall if secure changes', async () => {
    const item1 = await store.setConfigs('did1', [
      {
        key: 'key',
        value: 'originalValue',
        required: true,
        description: 'originalDescription',
        secure: false,
        validation: '',
        custom: false,
      },
    ]);
    expect(item1[0].secure).toBe(false);

    const item11 = await store.findOne({ did: 'did1' });
    expect(item11.configs[0].value).toBe('originalValue');

    const item2 = await store.setConfigs('did1', [
      {
        name: 'key',
        description: 'description1',
        default: 'newValue1',
        secure: true,
      },
    ]);
    expect(item2[0].secure).toBe(true);
    expect(item2[0].key).toBe('key');
    expect(item2[0].name).toBeUndefined();
    expect(item2[0].value).toBe('originalValue');
    expect(item2[0].description).toBe('description1');

    const item21 = await store.findOne({ did: 'did1' });
    expect(item21.configs[0].value).not.toBe('originalValue');

    const environmentConfigsV2 = [
      {
        name: 'key',
        description: 'description2',
        default: 'newValue2',
        secure: false,
      },
    ];

    const item3 = await store.setConfigs('did1', environmentConfigsV2);
    expect(item3[0].secure).toBe(false);
    expect(item3[0].description).toBe('description2');
    expect(item3[0].value).toBe('originalValue');

    const item31 = await store.findOne({ did: 'did1' });
    expect(item31.configs[0].value).toBe('originalValue');
  });

  test('encryptSecurityData', async () => {
    expect(store.encryptSecurityData({ data: null })).toBe(null);
    expect(() => store.encryptSecurityData({ data: {} })).toThrow('data.did does not exist');

    const bak = store.config;
    store.config = { dek: null };
    expect(store.encryptSecurityData({ data: {} })).toEqual({});
    store.config = bak;

    const data = {
      did: 'did2',
      configs: [
        {
          key: 'key1',
          value: 'value1',
          secure: true,
        },
        {
          key: 'key2',
          value: 'value2',
          secure: false,
        },
      ],
      children: [
        {
          did: 'did21',
          configs: [
            {
              key: 'key3',
              value: 'value3',
              secure: true,
            },
            {
              key: 'key4',
              value: 'value4',
              secure: false,
            },
          ],
        },
      ],
    };

    expect(data.configs[0].value).toBe('value1');
    expect(data.configs[1].value).toBe('value2');
    expect(data.children[0].configs[0].value).toBe('value3');
    expect(data.children[0].configs[1].value).toBe('value4');

    // 加密数据, rootDid 需要和 data.did 相同
    const res1 = store.encryptSecurityData({ data });
    expect(res1).toBe(data);
    expect(data.configs[0].value).not.toBe('value1'); // secure value should be encrypted
    expect(data.configs[1].value).toBe('value2');
    expect(data.children[0].configs[0].value).not.toBe('value3'); // secure value should be encrypted
    expect(data.children[0].configs[1].value).toBe('value4');

    // 直接把加密后的数据 insert 到 db 中
    await store.insert(data);

    // getConfigs() 会自动解密数据
    const res2 = await store.getConfigs(['did2']);
    expect(res2[0].value).toBe('value1');
    expect(res2[1].value).toBe('value2');
    const res3 = await store.getConfigs(['did2', 'did21']);
    expect(res3[0].value).toBe('value3');
    expect(res3[1].value).toBe('value4');
  });

  // ==================== Settings Secure Tests ====================

  describe('Settings - Secure Fields', () => {
    const ENCRYPTED_PREFIX = 'ENC:';

    beforeEach(async () => {
      await store.delete('did1');
    });

    test('should encrypt and decrypt notification.email.password and port', async () => {
      const settings = {
        notification: {
          email: {
            host: 'smtp.example.com',
            port: '587',
            password: 'my-secret-password',
          },
        },
      };

      // 设置 settings，返回值应该是解密后的明文
      const result = await store.setSettings('did1', settings);
      expect(result.notification.email.password).toBe('my-secret-password');
      expect(result.notification.email.port).toBe('587');

      // 数据库中存储的应该是加密后的值（带 ENC: 前缀）
      const dbData = await store.findOne({ did: 'did1' });
      expect(dbData.settings.notification.email.password).toMatch(new RegExp(`^${ENCRYPTED_PREFIX}`));
      expect(dbData.settings.notification.email.host).toBe('smtp.example.com'); // 非敏感字段保持原值

      // 通过 getSettings 获取应该是解密后的值
      const getResult = await store.getSettings('did1');
      expect(getResult.notification.email.password).toBe('my-secret-password');
      expect(getResult.notification.email.port).toBe('587');
    });

    test('should handle legacy unencrypted data (backward compatibility)', async () => {
      // 模拟历史数据：直接插入未加密的数据到数据库
      await store.insert({
        did: 'did1',
        settings: {
          notification: {
            email: {
              password: 'plain-text-password', // 没有 ENC: 前缀
              port: '587',
            },
          },
        },
      });

      // 读取时，未加密的历史数据应该保持原值
      const result = await store.getSettings('did1');
      expect(result.notification.email.password).toBe('plain-text-password');
      expect(result.notification.email.port).toBe('587');
    });
  });

  afterAll(async () => {
    await store.reset();
  });
});
