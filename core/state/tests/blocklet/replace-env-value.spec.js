const { test, describe, expect } = require('bun:test');
const replaceEnvValue = require('../../lib/util/docker/replace-env-value');

const dockerNamePrefix = 'blocklet';

describe('replaceEnvValue', () => {
  test('should replace host portion while keeping suffix', () => {
    const dockerEnv = {
      TEST_KEY: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu-host:8080',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      children: [
        {
          meta: { did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', name: 'discuss-kit' },
          configs: [],
          ports: {
            BLOCKLET_PORT: 3000,
          },
        },
      ],
    };

    // 整体替换后结果为 "prefix-root-child1:8080"
    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.TEST_KEY).toBe('blocklet-jvo8dpvx-discuss-kit:8080');
  });

  test('should replace port portion correctly', () => {
    const dockerEnv = {
      TEST_KEY: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu-port',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      children: [
        {
          meta: { did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', name: 'discuss-kit' },
          configs: [],
          ports: {
            BLOCKLET_PORT: 4000,
            EXTRA_PORT: 5000,
          },
        },
      ],
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.TEST_KEY).toBe('4000');
  });

  test('should replace env.xxx portion from configs', () => {
    const dockerEnv = {
      TEST_KEY: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu-env.ABC',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      children: [
        {
          meta: { did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', name: 'discuss-kit' },
          configs: [{ key: 'ABC', value: 'configValue' }],
          ports: {},
        },
      ],
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.TEST_KEY).toBe('configValue');
  });

  test('should replace port portion correctly with multiple match', () => {
    const dockerEnv = {
      TEST_KEY: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu-host:z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9-port',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      children: [
        {
          meta: { did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', name: 'discuss-kit' },
          configs: [],
          ports: {
            BLOCKLET_PORT: 4000,
            EXTRA_PORT: 5000,
          },
        },
        {
          meta: { did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9', name: 'media-kit' },
          configs: [],
          ports: {
            BLOCKLET_PORT: 1231,
            EXTRA_PORT: 1236,
          },
        },
      ],
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.TEST_KEY).toBe('blocklet-jvo8dpvx-discuss-kit:1231');
  });

  test('should replace port portion correctly with multiple match ports,host,port,env', () => {
    const dockerEnv = {
      TEST_KEY:
        'abcz8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9-ports.EXTRA_PORT z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu-host:z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9-portz8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9-env.DOG',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      children: [
        {
          meta: { did: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', name: 'discuss-kit' },
          configs: [],
          ports: {
            BLOCKLET_PORT: 4000,
            EXTRA_PORT: 5000,
          },
        },
        {
          meta: { did: 'z8ia1mAXo8ZE7ytGF36L5uBf9kD2kenhqFGp9', name: 'media-kit' },
          configs: [{ key: 'DOG', value: 'the dog' }],
          ports: {
            BLOCKLET_PORT: 1231,
            EXTRA_PORT: 1236,
          },
        },
      ],
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.TEST_KEY).toBe('abc1236 blocklet-jvo8dpvx-discuss-kit:1231the dog');
  });

  test('psk automatic env value', () => {
    const dockerEnv = {
      OTHER_KEY: '$BLOCKLET_AUTOMATIC_ENV_VALUE',
      OTHER_KEY2: '$BLOCKLET_AUTOMATIC_ENV_VALUE',
    };
    const rootBlocklet = {
      meta: { did: 'zNKoWjMr6fc1pnfx2bXYHw7hrVy7jVo8DPvX' },
      environmentObj: {
        BLOCKLET_APP_PSK: '12345678901',
      },
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    expect(result.OTHER_KEY).toBe('0b42a8ff993d47c832afaca');
    expect(result.OTHER_KEY2).toBe('0b42a8ff993d47c832afaca');
  });

  test('should leave the value unchanged if no match is found', () => {
    const dockerEnv = {
      TEST_KEY: 'non-matching-value',
    };
    const rootBlocklet = {
      meta: {},
      children: [],
    };

    const result = replaceEnvValue({ ...dockerEnv }, rootBlocklet, dockerNamePrefix);
    // 如果没有匹配到需要替换的部分，则原始值应保持不变
    expect(result.TEST_KEY).toBe('non-matching-value');
  });
});
