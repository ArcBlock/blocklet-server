import { describe, test, expect, mock } from 'bun:test';
import {
  isFreeBlocklet,
  isDeletableBlocklet,
  getAppMissingConfigs,
  getComponentMissingConfigs,
  wipeSensitiveData,
  forEachBlocklet,
  forEachChild,
  forEachChildSync,
  getAppName,
  getAppDescription,
  hasRunnableComponent,
  fixBlockletStatus,
  replaceSlotToIp,
  getSharedConfigObj,
  getComponentId,
  getComponentName,
  findComponent,
  findComponentById,
  findWebInterface,
  findWebInterfacePort,
  findServiceFromMeta,
  getParentComponentName,
  getConnectAppUrl,
  getChainInfo,
  isFreeComponent,
  isEnvShareable,
  isEnvShareableToClient,
  isExternalBlocklet,
  getBlockletAppIdList,
  getBlockletChainInfo,
  getBlockletServices,
  isInProgress,
  isBeforeInstalled,
  isRunning,
  forEachComponentV2,
  forEachComponentV2Sync,
  findComponentV2,
  findComponentByIdV2,
  filterComponentsV2,
  isGatewayBlocklet,
  isPackBlocklet,
  hasResourceType,
} from '../src/util';
import { getComponentProcessId } from '../src/get-component-process-id';
import { BlockletGroup, BlockletStatus } from '../src/constants';

describe('getAppMissingConfigs', () => {
  test('should return empty array if no missing configs in root blocklet and children blocklets', () => {
    expect(getAppMissingConfigs({})).toEqual([]);
    expect(
      getAppMissingConfigs({
        configs: [
          { required: false, key: 'a', value: 1 },
          { required: true, key: 'a', value: 1 },
        ],
      })
    ).toEqual([]);
    expect(
      getAppMissingConfigs({
        configs: [
          { required: false, key: 'a', value: 1 },
          { required: true, key: 'a', value: 1 },
        ],
        children: [
          {
            configs: [
              { required: false, key: 'a', value: 1 },
              { required: true, key: 'a', value: 1 },
            ],
          },
        ],
      })
    ).toEqual([]);
  });
  test('should return all missing configs in the root blocklet', () => {
    const configs = getAppMissingConfigs({
      children: [
        {
          meta: { did: 'test1' },
          configs: [
            { required: false, key: '1', value: 1 },
            { required: true, key: '2' },
            { required: true, key: '3' },
          ],
        },
      ],
    });

    expect(configs.length).toEqual(2);
    expect(configs[0]).toEqual({ did: 'test1', key: '2' });
    expect(configs[1]).toEqual({ did: 'test1', key: '3' });
  });
  test('should skip all prefs in the root blocklet', () => {
    const configs = getAppMissingConfigs({
      children: [
        {
          meta: { did: 'test1' },
          configs: [
            { required: true, key: 'prefs.1', value: 1 },
            { required: true, key: '2' },
          ],
        },
      ],
    });

    expect(configs.length).toEqual(1);
    expect(configs[0]).toEqual({ did: 'test1', key: '2' });
  });
  test('should return all missing configs in the root blocklet and children blocklets', () => {
    const configs = getAppMissingConfigs({
      meta: { did: 'test1' },
      configs: [
        { required: false, key: '1', value: 1 },
        { required: true, key: '2', description: 'desc2' },
      ],
      children: [
        {
          meta: { did: 'test2' },
          configs: [
            { required: false, key: '1', value: 1 },
            { required: true, key: '3' },
          ],
        },
        {
          meta: { did: 'test3' },
          configs: [
            { required: false, key: '1', value: 1 },
            { required: true, key: '4', description: 'desc4' },
          ],
        },
      ],
    });

    expect(configs.length).toEqual(2);
    expect(configs[0]).toEqual({ did: 'test2', key: '3' });
    expect(configs[1]).toEqual({ did: 'test3', key: '4', description: 'desc4' });
  });
  test('should ignore required env in root container', () => {
    const app = {
      meta: { did: 'test1' },
      configs: [
        { required: false, key: '1', value: 1 },
        { required: true, key: '2', description: 'desc2' }, // required is not useful in container
      ],
      children: [
        {
          meta: { did: 'test2' },
          configs: [
            { required: false, key: '1', value: 1 },
            { required: true, key: '3' },
            { required: true, key: '5' },
          ],
        },
        {
          meta: { did: 'test3' },
          configs: [
            { required: false, key: '1', value: 1 },
            { required: true, key: '4', description: 'desc4', value: '4' },
          ],
        },
      ],
    };
    const configs1 = getAppMissingConfigs(app);
    expect(configs1.length).toEqual(2);

    (app.children[0] as any).meta.group = BlockletGroup.gateway;
    const configs2 = getAppMissingConfigs(app);
    expect(configs2.length).toEqual(0);
  });
  describe('chain info', () => {
    test('chain host', () => {
      // root BLOCKLET_APP_CHAIN_HOST exist, ignore value of child CHAIN_HOST
      const configs = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_HOST', value: '' }],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_HOST', value: 'not empty' }],
          },
          {
            meta: { did: 'test3' },
            configs: [{ required: false, key: 'CHAIN_HOST', value: 'not empty' }],
          },
          {
            meta: { did: 'test4' },
            configs: [{ required: true, key: 'CHAIN_HOST', value: 'not empty' }],
          },
        ],
      });

      expect(configs.length).toEqual(2);
      expect(configs[0]).toEqual({ did: 'test2', key: 'CHAIN_HOST' });
      expect(configs[1]).toEqual({ did: 'test4', key: 'CHAIN_HOST' });

      const configs2 = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_HOST', value: 'not empty' }],
          },
        ],
      });

      expect(configs2.length).toEqual(0);
    });
    test('chain id', () => {
      // root BLOCKLET_APP_CHAIN_ID exist, ignore value of child CHAIN_ID
      const configs = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_ID', value: '' }],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_ID', value: 'not empty' }],
          },
          {
            meta: { did: 'test3' },
            configs: [{ required: false, key: 'CHAIN_ID', value: 'not empty' }],
          },
          {
            meta: { did: 'test4' },
            configs: [{ required: true, key: 'CHAIN_ID', value: 'not empty' }],
          },
        ],
      });

      expect(configs.length).toEqual(2);
      expect(configs[0]).toEqual({ did: 'test2', key: 'CHAIN_ID' });
      expect(configs[1]).toEqual({ did: 'test4', key: 'CHAIN_ID' });

      const configs2 = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_ID', value: 'not empty' }],
          },
        ],
      });

      expect(configs2.length).toEqual(0);
    });
    test('chain type', () => {
      // root BLOCKLET_APP_CHAIN_TYPE exist, ignore value of child CHAIN_TYPE
      const configs = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: '' }],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
          {
            meta: { did: 'test3' },
            configs: [{ required: false, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
          {
            meta: { did: 'test4' },
            configs: [{ required: true, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
        ],
      });

      expect(configs.length).toEqual(2);
      expect(configs[0]).toEqual({ did: 'test2', key: 'CHAIN_TYPE' });
      expect(configs[1]).toEqual({ did: 'test4', key: 'CHAIN_TYPE' });

      const configs2 = getAppMissingConfigs({
        meta: { did: 'test1' },
        configs: [],
        children: [
          {
            meta: { did: 'test2' },
            configs: [{ required: true, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
        ],
      });

      expect(configs2.length).toEqual(0);
    });
  });
});
describe('getComponentMissingConfigs', () => {
  test('should return empty array if no missing configs in component', () => {
    expect(getComponentMissingConfigs({})).toEqual([]);
    expect(
      getComponentMissingConfigs({
        configs: [
          { key: 'a', required: false, value: '' },
          { key: 'b', required: true, value: 2 },
        ],
      })
    ).toEqual([]);
  });
  test('should return empty array if missing configs covered by ancestors', () => {
    expect(
      getComponentMissingConfigs(
        {
          configs: [
            { key: 'a', required: false, value: 1 },
            { key: 'b', required: true, value: '' },
          ],
        },
        {
          configs: [{ key: 'b', secure: false, value: 2 }],
        }
      )
    ).toEqual([]);
  });
  test('should return missing configs', () => {
    expect(
      getComponentMissingConfigs({
        meta: { did: '1' },
        configs: [
          { key: 'a', required: false, value: '' },
          { key: 'b', required: true, value: '' },
        ],
      })
    ).toEqual([{ did: '1', key: 'b' }]);
  });

  describe('chain info', () => {
    test('chain host', () => {
      const app = {
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_HOST', value: '' }],
      };
      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: true, key: 'CHAIN_HOST', value: 'not empty' }],
          },
          app
        )
      ).toEqual([{ did: '1', key: 'CHAIN_HOST' }]);

      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: false, key: 'CHAIN_HOST', value: 'not empty' }],
          },
          app
        )
      ).toEqual([]);
    });
    test('chain id', () => {
      const app = {
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_ID', value: '' }],
      };
      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: true, key: 'CHAIN_ID', value: 'not empty' }],
          },
          app
        )
      ).toEqual([{ did: '1', key: 'CHAIN_ID' }]);

      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: false, key: 'CHAIN_ID', value: 'not empty' }],
          },
          app
        )
      ).toEqual([]);
    });
    test('chain type', () => {
      const app = {
        meta: { did: 'test1' },
        configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: '' }],
      };
      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: true, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
          app
        )
      ).toEqual([{ did: '1', key: 'CHAIN_TYPE' }]);

      expect(
        getComponentMissingConfigs(
          {
            meta: { did: '1' },
            configs: [{ required: false, key: 'CHAIN_TYPE', value: 'not empty' }],
          },
          app
        )
      ).toEqual([]);
    });
  });
});
describe('wipeSensitiveData', () => {
  test('should return origin on empty', () => {
    expect(wipeSensitiveData()).toEqual(undefined);
    expect(wipeSensitiveData({})).toEqual({
      children: [],
      configs: [],
      environments: [],
      migratedFrom: [],
      settings: undefined,
    });
  });
  test('should wipe secure configs', () => {
    expect(
      wipeSensitiveData({
        environmentObj: {
          BLOCKLET_APP_SK: 'abcd',
          BLOCKLET_APP_NAME: 'abc',
        },
        configObj: {},
        configs: [
          { key: 'BLOCKLET_APP_SK', secure: true, value: 'abcd' },
          { key: 'BLOCKLET_APP_NAME', secure: false, value: 'abc' },
        ],
      })
    ).toEqual({
      configs: [
        { key: 'BLOCKLET_APP_SK', secure: true, value: '__encrypted__' },
        { key: 'BLOCKLET_APP_NAME', secure: false, value: 'abc' },
      ],
      children: [],
      environments: [],
      migratedFrom: [],
      settings: undefined,
    });
  });
  test('should wipe secure environments', () => {
    expect(
      wipeSensitiveData({
        environments: [
          { key: 'BLOCKLET_APP_SK', value: 'abcd' },
          { key: 'BLOCKLET_APP_NAME', value: 'abc' },
          { key: 'BLOCKLET_APP_SALT', value: '1234567890' },
        ],
      })
    ).toEqual({
      environments: [
        { key: 'BLOCKLET_APP_SK', value: '__encrypted__' },
        { key: 'BLOCKLET_APP_NAME', value: 'abc' },
        { key: 'BLOCKLET_APP_SALT', value: '__encrypted__' },
      ],
      children: [],
      configs: [],
      migratedFrom: [],
      settings: undefined,
    });
  });
  test('should wipe sensitive for nested', () => {
    expect(
      wipeSensitiveData({
        environments: [
          { key: 'BLOCKLET_APP_SK', value: 'abcd' },
          { key: 'BLOCKLET_APP_NAME', value: 'abc' },
        ],
        children: [
          {
            did: '1',
            configs: [
              { key: 'BLOCKLET_APP_SK', secure: true, value: 'abcd' },
              { key: 'BLOCKLET_APP_NAME', secure: false, value: 'abc' },
            ],
            environmentObj: {
              BLOCKLET_APP_SK: 'abcd',
              BLOCKLET_APP_NAME: 'abc',
            },
            configObj: {},
          },
        ],
      })
    ).toEqual({
      environments: [
        { key: 'BLOCKLET_APP_SK', value: '__encrypted__' },
        { key: 'BLOCKLET_APP_NAME', value: 'abc' },
      ],
      children: [
        {
          did: '1',
          environments: [],
          configs: [
            { key: 'BLOCKLET_APP_SK', secure: true, value: '__encrypted__' },
            { key: 'BLOCKLET_APP_NAME', secure: false, value: 'abc' },
          ],
        },
      ],
      configs: [],
      migratedFrom: [],
      settings: undefined,
    });
  });
});

describe('isFreeBlocklet', () => {
  test('should return true for free blocklet', () => {
    expect(isFreeBlocklet({} as any)).toEqual(true);
    expect(isFreeBlocklet({ payment: {} } as any)).toEqual(true);
    expect(isFreeBlocklet({ payment: 0 } as any)).toEqual(true);
    expect(isFreeBlocklet({ payment: { price: [] } } as any)).toEqual(true);
    expect(isFreeBlocklet({ payment: { price: [{ address: 'token1', value: 0 }] } } as any)).toEqual(true);
    expect(
      isFreeBlocklet({
        payment: {
          price: [
            { address: 'token2', value: 0 },
            { address: 'token1', value: 0 },
          ],
        },
      } as any)
    ).toEqual(true);
  });
  test('should return false for paid blocklet', () => {
    expect(isFreeBlocklet({ payment: { price: [{ address: 'token1', value: 2 }] } } as any)).toEqual(false);
    expect(isFreeBlocklet({ payment: { price: [{ address: 'token1', value: 3 }] } } as any)).toEqual(false);
    expect(
      isFreeBlocklet({
        payment: {
          price: [
            { address: 'token2', value: 2 },
            { address: 'token1', value: 2 },
          ],
        },
      } as any)
    ).toEqual(false);
  });
});
describe('forEachBlocklet', () => {
  test('should not throw when callback not throw: sync', () => {
    expect(() => forEachBlocklet({}, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachBlocklet({ children: [1, 2, 3] }, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachBlocklet({ children: [1, 2, 3] }, () => {}, { parallel: true })).not.toThrow();
    expect(() => forEachBlocklet({ children: [1, 2, 3] }, () => {}, { parallel: false })).not.toThrow();
  });
  test('should throw when callback throw: sync', () => {
    const cb = () => {
      throw new Error('Error');
    };

    expect(() => forEachBlocklet({}, cb, { sync: true })).toThrow();
    expect(() => forEachBlocklet({ children: [1, 2, 3] }, cb, { sync: true })).toThrow();
  });
  test('should throw when callback throw: async', async () => {
    const cb = (arg: number) => {
      if (arg === 1) {
        throw new Error('Test Error');
      }
    };

    await expect(forEachBlocklet(1, cb, { sync: false })).rejects.toThrow('Test Error');
    await expect(forEachBlocklet({ children: [1, 2, 3] }, cb, { sync: false })).rejects.toThrow('Test Error');
  });
  test('should throw when callback throw: parallel', async () => {
    expect.assertions(2);
    const cb = (arg: number) => {
      if (arg === 2) {
        throw new Error('Test Error');
      }
    };

    try {
      await forEachBlocklet(2, cb, { parallel: true });
    } catch (err) {
      expect((err as Error).message).toBe('Test Error');
    }
    try {
      await forEachBlocklet({ children: [1, 2, 3] }, cb, { parallel: true });
    } catch (err) {
      expect((err as Error).message).toBe('Test Error');
    }
  });
  // nested component
  test('should nested composable blocklet work as expected', async () => {
    const blocklet: any = {
      meta: { did: '1' },
      children: [1, 2, { children: [3, 4] }],
    };

    const cb1 = mock();

    const cb2 = mock();

    const cb3 = mock();

    const cb31 = mock();

    await forEachBlocklet(blocklet, cb1, {});
    await forEachBlocklet(blocklet, cb2, { sync: true });
    await forEachBlocklet(blocklet, cb3, { parallel: true });
    await forEachBlocklet(blocklet, cb31, { parallel: true, concurrencyLimit: 1 });
    [cb1, cb2, cb3, cb31].forEach((cb) => {
      expect(cb.mock.calls.length).toBe(6);
      expect(cb.mock.calls[0][0]).toBe(blocklet);
      expect(cb.mock.calls[0][1].level).toBe(0);
      expect(cb.mock.calls[0][1].parent).toBeUndefined();
      expect(cb.mock.calls[0][1].root).toBe(blocklet);
      expect(cb.mock.calls[0][1].ancestors).toEqual([]);
      expect(cb.mock.calls[0][1].params).toBeUndefined();
      expect(cb.mock.calls[0][1].id).toBeTruthy();
      expect(cb.mock.calls[1][0]).toBe(blocklet.children[0]);
      expect(cb.mock.calls[1][1].level).toBe(1);
      expect(cb.mock.calls[1][1].parent).toBe(blocklet);
      expect(cb.mock.calls[1][1].root).toBe(blocklet);
      expect(cb.mock.calls[1][1].ancestors).toEqual([blocklet]);
      expect(cb.mock.calls[1][1].params).toBeUndefined();
      expect(cb.mock.calls[2][0]).toBe(blocklet.children[1]);
      expect(cb.mock.calls[3][0]).toBe(blocklet.children[2]);
      expect(cb.mock.calls[4][0]).toBe(blocklet.children[2].children[0]);
      expect(cb.mock.calls[4][1].level).toBe(2);
      expect(cb.mock.calls[4][1].parent).toBe(blocklet.children[2]);
      expect(cb.mock.calls[4][1].root).toBe(blocklet);
      expect(cb.mock.calls[4][1].ancestors).toEqual([blocklet, blocklet.children[2]]);
      expect(cb.mock.calls[5][0]).toBe(blocklet.children[2].children[1]);
    });
    // support pass custom params to child
    const mockFn = (_b: any, { level }: any) => `parent level: ${level}`;

    const cb4 = mock(mockFn);

    const cb5 = mock(mockFn);

    await forEachBlocklet(blocklet, cb4, {});
    await forEachBlocklet(blocklet, cb5, { sync: true });
    [cb4, cb5].forEach((cb) => {
      expect(cb.mock.calls.length).toBe(6);
      expect(cb.mock.calls[0][1].parent).toBe(undefined);
      expect(cb.mock.calls[0][1].params).toBe(undefined);
      expect(cb.mock.calls[1][1].parent).toBe(blocklet);
      expect(cb.mock.calls[1][1].params).toBe('parent level: 0');
      expect(cb.mock.calls[2][1].parent).toBe(blocklet);
      expect(cb.mock.calls[2][1].params).toBe('parent level: 0');
      expect(cb.mock.calls[3][1].parent).toBe(blocklet);
      expect(cb.mock.calls[3][1].params).toBe('parent level: 0');
      expect(cb.mock.calls[4][1].parent).toBe(blocklet.children[2]);
      expect(cb.mock.calls[4][1].params).toBe('parent level: 1');
      expect(cb.mock.calls[5][1].parent).toBe(blocklet.children[2]);
      expect(cb.mock.calls[5][1].params).toBe('parent level: 1');
    });
  });
});
describe('forEachChild', () => {
  test('should not throw when callback not throw: sync', () => {
    // @ts-expect-error FIXME:
    expect(() => forEachChildSync({}, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachChild({ children: [1, 2, 3] }, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachChild({ children: [1, 2, 3] }, () => {}, { parallel: true })).not.toThrow();
    expect(() => forEachChild({ children: [1, 2, 3] }, () => {}, { parallel: false })).not.toThrow();
    const cb = () => {
      throw new Error('Error');
    };

    expect(() => forEachChild({}, cb, { sync: true })).not.toThrow();
  });
  test('should throw when callback throw', async () => {
    expect.assertions(4);
    const cb = () => {
      throw new Error('Test Error');
    };

    expect(() => forEachChild({ children: [1, 2, 3] }, cb, { sync: true })).toThrowError('Test Error');
    expect(() => forEachChildSync({ children: [1, 2, 3] }, cb)).toThrowError('Test Error');
    expect(forEachChild({ children: [1, 2, 3] }, cb)).rejects.toThrowError('Test Error');
    try {
      await forEachBlocklet({ children: [1, 2, 3] }, cb, { parallel: true });
    } catch (err) {
      expect((err as Error).message).toBe('Test Error');
    }
  });
});
describe('forEachComponentV2', () => {
  test('should not throw when callback not throw: sync', () => {
    expect(() => forEachComponentV2({}, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachComponentV2({ children: [1, 2, 3] }, () => {}, { sync: true })).not.toThrow();
    expect(() => forEachComponentV2Sync({ children: [1, 2, 3] }, () => {})).not.toThrow();
    expect(() => forEachComponentV2({ children: [1, 2, 3] }, () => {}, { parallel: true })).not.toThrow();
    expect(() => forEachComponentV2({ children: [1, 2, 3] }, () => {}, { parallel: false })).not.toThrow();
  });

  test('should throw when callback throw: sync', () => {
    const cb = () => {
      throw new Error('Error');
    };

    expect(() => forEachComponentV2({}, cb, { sync: true })).not.toThrow(); // no children
    expect(() => forEachComponentV2({ children: [1, 2, 3] }, cb, { sync: true })).toThrow();
    expect(() => forEachComponentV2Sync({ children: [1, 2, 3] }, cb)).toThrow();
  });

  test('should throw when callback throw v2: async', () => {
    const cb = (arg: number) => {
      if (arg !== 1) {
        throw new Error('Test Error');
      }
    };

    expect(forEachComponentV2(1, cb, { sync: false })).resolves.toThrow(); // no children
    expect(forEachComponentV2({ children: [1, 2, 3] }, cb, { sync: false })).rejects.toThrow('Test Error');
  });

  test('should throw when callback throw: parallel', async () => {
    expect.assertions(1);
    const cb = (arg: number) => {
      if (arg === 2) {
        throw new Error('Test Error');
      }
    };

    try {
      await forEachComponentV2(2, cb, { parallel: true });
    } catch (err) {
      expect((err as Error).message).toBe('should not be here');
    }
    try {
      await forEachComponentV2({ children: [1, 2, 3] }, cb, { parallel: true });
    } catch (err) {
      expect((err as Error).message).toBe('Test Error');
    }
  });

  // nested component
  test('should nested composable blocklet work as expected', async () => {
    const blocklet: any = {
      meta: { did: '1' },
      children: [1, 2, 3, 4],
    };

    const cb1 = mock();
    const cb2 = mock();
    const cb3 = mock();
    const cb4 = mock();
    const cb5 = mock();

    await forEachComponentV2(blocklet, cb1, {});
    forEachComponentV2(blocklet, cb2, { sync: true });
    forEachComponentV2Sync(blocklet, cb3);
    await forEachComponentV2(blocklet, cb4, { parallel: true });
    await forEachComponentV2(blocklet, cb5, { parallel: true, concurrencyLimit: 1 });
    [cb1, cb2, cb3, cb4].forEach((cb) => {
      expect(cb.mock.calls.length).toBe(4);
      expect(cb.mock.calls[0][0]).toBe(blocklet.children[0]);
      expect(cb.mock.calls[0][1]).toBeUndefined();
      expect(cb.mock.calls[1][0]).toBe(blocklet.children[1]);
      expect(cb.mock.calls[2][0]).toBe(blocklet.children[2]);
      expect(cb.mock.calls[3][0]).toBe(blocklet.children[3]);
    });
  });
});
describe('isDeletableBlocklet', () => {
  test('should return true for deletable blocklet', () => {
    expect(isDeletableBlocklet()).toEqual(false);
    expect(isDeletableBlocklet({ environments: [] })).toEqual(true);
    expect(isDeletableBlocklet({ environments: [{ key: 'BLOCKLET_DELETABLE', value: 'yes' }] })).toEqual(true);
    expect(isDeletableBlocklet({ environments: [{ key: 'BLOCKLET_DELETABLE', value: 'no' }] })).toEqual(false);
  });
});

describe('getAppName', () => {
  test('get name by environments', () => {
    const value = getAppName({
      meta: {
        title: 'title value',
        name: 'name value',
      },
      environments: [
        {
          key: 'BLOCKLET_APP_NAME',
          value: 'environments app name value',
        },
      ],
    });

    expect(value).toEqual('environments app name value');
  });

  test('get name by meta data', () => {
    const value = getAppName(
      {
        meta: {
          title: 'title value',
          name: 'name value',
        },
        environments: [
          {
            key: 'BLOCKLET_APP_NAME',
            value: 'environments app name value',
          },
        ],
      },
      true
    );

    expect(value).toEqual('title value');
  });

  test('get name by meta title', () => {
    const value = getAppName({
      meta: {
        title: 'title value',
        name: 'name value',
      },
      environments: [],
    });

    expect(value).toEqual('title value');
  });

  test('get name by meta name', () => {
    const value = getAppName({
      meta: {
        title: undefined,
        name: 'name value',
      },
    });

    expect(value).toEqual('name value');
  });
});

describe('getAppDescription', () => {
  test('get description by environments', () => {
    const value = getAppDescription({
      meta: {
        title: 'title value',
        name: 'name value',
      },
      environments: [
        {
          key: 'BLOCKLET_APP_DESCRIPTION',
          value: 'environments app name value',
        },
      ],
    });

    expect(value).toEqual('environments app name value');
  });

  test('get name by meta data', () => {
    const value = getAppDescription(
      {
        meta: {
          description: 'title value',
          name: 'name value',
        },
        environments: [
          {
            key: 'BLOCKLET_APP_DESCRIPTION',
            value: 'environments app name value',
          },
        ],
      },
      true
    );

    expect(value).toEqual('title value');
  });

  test('get name by meta title', () => {
    const value = getAppDescription({
      meta: {
        description: 'title value',
        name: 'name value',
      },
      environments: [],
    });

    expect(value).toEqual('title value');
  });

  test('get name by meta name', () => {
    const value = getAppDescription({
      meta: {
        description: undefined,
        name: 'name value',
      },
    });

    expect(value).toEqual('name value');
  });
});

test('hasRunnableComponent', () => {
  expect(hasRunnableComponent({ meta: { group: BlockletGroup.gateway } })).toBe(false);
  expect(hasRunnableComponent({ meta: { group: BlockletGroup.dapp } })).toBe(true);
  expect(
    hasRunnableComponent({ meta: { group: BlockletGroup.dapp }, children: [{ meta: { group: BlockletGroup.dapp } }] })
  ).toBe(true);
});
test('fixBlockletStatus', () => {
  expect(() => fixBlockletStatus()).not.toThrow();
  const b1 = { status: 1, source: 1 };

  fixBlockletStatus(b1);
  expect(b1).toEqual({ status: 'downloading', source: 'local' } as unknown as typeof b1);
  const b2 = { status: 1, source: 1, children: [{ status: 1, source: 1 }] };

  fixBlockletStatus(b2);
  expect(b2).toEqual({
    status: 'downloading',
    source: 'local',
    children: [{ status: 'downloading', source: 'local' }],
  } as unknown as typeof b2);
  const b3 = { status: 1, source: 1, settings: { children: [{ status: 1 }] } };

  fixBlockletStatus(b3);
  expect(b3).toEqual({
    status: 'downloading',
    source: 'local',
    settings: {
      children: [{ status: 'downloading' }],
    },
  } as unknown as typeof b3);
  const b4 = { status: 1, source: 1, settings: { children: [{ status: 1, source: 1 }] } };

  fixBlockletStatus(b4);
  expect(b4).toEqual({
    status: 'downloading',
    source: 'local',
    settings: {
      children: [{ status: 'downloading', source: 'local' }],
    },
  } as unknown as typeof b4);
  const b5 = {
    status: 1,
    source: 1,
    children: [{ status: 1, source: 1, children: [{ status: 1, source: 1 }] }],
    settings: {
      children: [{ status: 1, source: 1, children: [{ status: 1, source: 1 }] }],
    },
  };

  fixBlockletStatus(b5);
  expect(b5).toEqual({
    status: 'downloading',
    source: 'local',
    children: [
      {
        status: 'downloading',
        source: 'local',
        children: [
          {
            status: 'downloading',
            source: 'local',
          },
        ],
      },
    ],
    settings: {
      children: [{ status: 'downloading', source: 'local', children: [{ status: 'downloading', source: 'local' }] }],
    },
  } as unknown as typeof b5);
});
describe('replaceSlotToIp', () => {
  test('ipv4', () => {
    // good case
    expect(replaceSlotToIp('http://888-888-888-888.ip.abtnet.io', '127.0.0.1')).toEqual(
      'http://127-0-0-1.ip.abtnet.io'
    );
    expect(replaceSlotToIp('http://arcblock.io', '127.0.0.1')).toEqual('http://arcblock.io');
    // edge case
    expect(replaceSlotToIp()).toEqual('');
    expect(replaceSlotToIp('http://arcblock.io')).toEqual('http://arcblock.io');
    expect(replaceSlotToIp('http://888-888-888-888.ip.abtnet.io')).toEqual('http://.ip.abtnet.io');
  });

  test('ipv6', () => {
    expect(replaceSlotToIp('http://888-888-888-888.ip.abtnet.io', '2060:4700:3034::6815:5be8')).toEqual(
      'http://2060-4700-3034--6815-5be8.ip.abtnet.io'
    );
  });
});

describe('getSharedConfigObj', () => {
  test('getSharedConfigObj', () => {
    const b1 = { meta: { did: 'parent' }, configs: [{ key: 'a', value: 'b1', secure: false }] };
    const b2 = { meta: { did: 'parent' }, configs: [{ key: 'a', value: 'b2', secure: true }] };
    const b3 = { meta: { did: 'parent' }, configs: [{ key: 'a', value: 'b3', shared: false }] };
    const b4 = { meta: { did: 'parent' }, configs: [{ key: 'a', value: 'b4' }] };
    const b5 = {
      meta: { did: 'parent' },
      configs: [{ key: 'a', value: 'b5' }],
      children: [{ meta: { did: 'child2' }, configs: [{ key: 'b', value: 'c5', shared: false }] }],
    };
    const b6 = {
      meta: { did: 'parent' },
      configs: [{ key: 'a', value: 'b6' }],
      children: [{ meta: { did: 'child2' }, configs: [{ key: 'b', value: 'c6', shared: true }] }],
    };
    const b7 = {
      meta: { did: 'parent' },
      configs: [{ key: 'a', value: 'b7' }],
      children: [{ meta: { did: 'child2' }, configs: [{ key: 'a', value: 'c7', shared: true }] }],
    };
    const b8 = {
      meta: { did: 'parent' },
      configs: [{ key: 'a', value: 'b8' }],
      children: [{ meta: { did: 'child2' }, configs: [{ key: 'b', value: 'c8', shared: true, secure: true }] }],
    };
    const b9 = { meta: { did: 'parent' }, configs: [{ key: 'prefs.a', value: 'b3', shared: true }] };

    expect(getSharedConfigObj()).toEqual({});
    expect(getSharedConfigObj(null, { configs: [{ key: 'a' }] })).toEqual({});
    expect(getSharedConfigObj({ configs: [{ key: 'a' }] })).toEqual({});
    expect(getSharedConfigObj(b1, { configs: [{ key: 'a' }] })).toEqual({ a: 'b1' });
    expect(getSharedConfigObj(b1, { configs: [] })).toEqual({ a: 'b1' }); // return shared config even if not have this config
    expect(getSharedConfigObj(b1, { configs: [{ key: 'a', value: 'custom' }] })).toEqual({}); // not return shared config if has own config with NO-EMPTY value and NOT shareable
    expect(getSharedConfigObj(b1, { configs: [{ key: 'a', value: '' }] })).toEqual({ a: 'b1' }); // return shared config if has own config with EMPTY value and NOT shareable
    expect(getSharedConfigObj(b1, { configs: [{ key: 'a', value: 'custom', shared: true }] })).toEqual({ a: 'b1' }); // return shared config if has own config with NO-EMPTY value and shareable
    expect(getSharedConfigObj(b2, { configs: [{ key: 'a' }] })).toEqual({}); // secure env in container is not shareable by default
    expect(getSharedConfigObj(b2, { configs: [{ key: 'a' }] }, true)).toEqual({ a: 'b2' }); // secure env in container is also shareable

    expect(getSharedConfigObj(b3, { configs: [{ key: 'a' }] })).toEqual({ a: 'b3' }); // config in container is force shared to components
    expect(getSharedConfigObj(b4, { configs: [{ key: 'a' }] })).toEqual({ a: 'b4' });
    expect(getSharedConfigObj(b5, { configs: [{ key: 'a' }] })).toEqual({ a: 'b5' }); // child config is not shareable
    expect(getSharedConfigObj(b6, { configs: [{ key: 'a' }] })).toEqual({ a: 'b6', b: 'c6' }); // another child config is shareable
    expect(getSharedConfigObj(b7, { configs: [{ key: 'a' }] })).toEqual({ a: 'b7' }); // child config is shareable but exist in app
    expect(getSharedConfigObj(b8, { configs: [{ key: 'a' }] })).toEqual({ a: 'b8' }); // another child config is secure
    expect(getSharedConfigObj(b8, { configs: [{ key: 'a' }] }, true)).toEqual({ a: 'b8', b: 'c8' }); // another child config is secure
    expect(getSharedConfigObj(b9, { configs: [{ key: 'a' }] })).toEqual({}); // preference key is not shareable

    expect(
      getSharedConfigObj(
        { configs: [{ key: 'a', value: '{env.appDir}' }], configObj: { a: '/path/to/xxx' } },
        { configs: [{ key: 'a', value: '' }], configObj: { a: '' } }
      )
    ).toEqual({ a: '/path/to/xxx' });
    expect(
      getSharedConfigObj(
        { configs: [{ key: 'a', value: '{env.appDir}' }], configObj: { a: '/path/to/xxx' } },
        { configs: [{ key: 'a', value: '{env.appDir}' }], configObj: { a: '/path/to/yyy' } }
      )
    ).toEqual({});
    expect(
      getSharedConfigObj(
        { configs: [{ key: 'a', value: '{env.appDir}' }], configObj: { a: '/path/to/xxx' } },
        { configs: [{ key: 'a', value: '{env.appDir}', shared: true }], configObj: { a: '/path/to/yyy' } }
      )
    ).toEqual({ a: '/path/to/xxx' });
  });

  test('chain info in app config', () => {
    // chain host

    const root = {
      configs: [{ key: 'BLOCKLET_APP_CHAIN_HOST', value: 'https://main.abtnetwork.io/api/' }],
    };
    expect(getSharedConfigObj(root, { configs: [] })).toEqual({ CHAIN_HOST: 'https://main.abtnetwork.io/api/' });
    expect(getSharedConfigObj(root, { configs: [{ key: 'CHAIN_HOST', value: 'custom chain endpoint' }] })).toEqual({
      CHAIN_HOST: 'https://main.abtnetwork.io/api/', // own config value should be ignored
    });
    expect(
      getSharedConfigObj(
        { configs: [{ key: 'BLOCKLET_APP_CHAIN_HOST', value: '' }] },
        { configs: [{ key: 'CHAIN_HOST', value: 'custom chain endpoint' }] }
      )
    ).toEqual({
      CHAIN_HOST: '', // own config value should be ignored as long as prop exists in root config
    });

    expect(
      getSharedConfigObj(
        {
          configs: [{ key: 'CHAIN_HOST', value: 'https://main.abtnetwork.io/api/' }],
        },
        { configs: [{ key: 'CHAIN_HOST', value: 'custom chain endpoint' }] }
      )
    ).toEqual({}); // CHAIN_HOST in root component is not god

    // chain id

    const root2 = {
      configs: [{ key: 'BLOCKLET_APP_CHAIN_ID', value: 'a' }],
    };
    expect(getSharedConfigObj(root2, { configs: [] })).toEqual({ CHAIN_ID: 'a' });
    expect(getSharedConfigObj(root2, { configs: [{ key: 'CHAIN_HOST', value: 'custom chain id' }] })).toEqual({
      CHAIN_ID: 'a', // own config value should be ignored
    });
    expect(
      getSharedConfigObj(
        { configs: [{ key: 'BLOCKLET_APP_CHAIN_ID', value: '' }] },
        { configs: [{ key: 'CHAIN_ID', value: 'custom chain id' }] }
      )
    ).toEqual({
      CHAIN_ID: '', // own config value should be ignored as long as prop exists in root config
    });

    expect(
      getSharedConfigObj(
        {
          configs: [{ key: 'CHAIN_ID', value: 'a' }],
        },
        { configs: [{ key: 'CHAIN_ID', value: 'custom chain id' }] }
      )
    ).toEqual({}); // CHAIN_ID in root component is not god

    // chain type

    const root3 = {
      configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: 'arcblock' }],
    };
    expect(getSharedConfigObj(root3, { configs: [] })).toEqual({ CHAIN_TYPE: 'arcblock' });
    expect(getSharedConfigObj(root3, { configs: [{ key: 'CHAIN_HOST', value: 'custom chain type' }] })).toEqual({
      CHAIN_TYPE: 'arcblock', // own config value should be ignored
    });
    expect(
      getSharedConfigObj(
        { configs: [{ key: 'BLOCKLET_APP_CHAIN_TYPE', value: '' }] },
        { configs: [{ key: 'CHAIN_TYPE', value: 'custom chain type' }] }
      )
    ).toEqual({
      CHAIN_TYPE: '', // own config value should be ignored as long as prop exists in root config
    });

    expect(
      getSharedConfigObj(
        {
          configs: [{ key: 'CHAIN_TYPE', value: 'a' }],
        },
        { configs: [{ key: 'CHAIN_TYPE', value: 'custom chain type' }] }
      )
    ).toEqual({}); // CHAIN_TYPE in root component is not god
  });
});

test('getComponentProcessId', () => {
  expect(getComponentProcessId({ meta: { name: 'a' } } as any)).toBe('a');
  expect(getComponentProcessId({ meta: { name: '@a/1' } } as any)).toBe('@a/1');
  expect(getComponentProcessId({ meta: { name: 'a' } } as any, [{ meta: { name: 'b' } } as any])).toBe('b/a');
  expect(getComponentProcessId({ meta: { name: '@a/1' } } as any, [{ meta: { name: '@b/2' } } as any])).toBe(
    '%40b%2F2/%40a%2F1'
  );
  expect(
    getComponentProcessId(
      { meta: { name: '@a/1' } } as any,
      [{ meta: { name: '@b/2' } }, { meta: { name: '@c/3' } }] as any
    )
  ).toBe('%40b%2F2/%40c%2F3/%40a%2F1');
  const parent = Array(120).fill('a').join('');

  const child = Array(120).fill('b').join('');

  expect(getComponentProcessId({ meta: { name: child } } as any, [{ meta: { name: parent } } as any])).toBe(
    '38e137355d31783de2ded20dabf5102e'
  );
});
test('getComponentId', () => {
  expect(getComponentId({ meta: { did: 'a' } })).toBe('a');
  expect(getComponentId({ meta: { did: 'a' } }, [{ meta: { did: 'b' } }])).toBe('b/a');
  expect(getComponentId({ meta: { did: 'a' } }, [{ meta: { did: 'b' } }, { meta: { did: 'c' } }])).toBe('b/c/a');
  // invalid input
  expect(getComponentId()).toBe('');
  expect(getComponentId({}, [])).toBe('');
  expect(getComponentId({}, [{}])).toBe('/');
});
test('getComponentName', () => {
  expect(getComponentName({ meta: { name: 'a' } })).toBe('a');
  expect(getComponentName({ meta: { name: '@a/1' } })).toBe('@a/1');
  expect(getComponentName({ meta: { name: 'a' } }, [{ meta: { name: 'b' } }])).toBe('b/a');
  expect(getComponentName({ meta: { name: '@a/1' } }, [{ meta: { name: '@b/2' } }])).toBe('@b/2/@a/1');
  expect(getComponentName({ meta: { name: '@a/1' } }, [{ meta: { name: '@b/2' } }, { meta: { name: '@c/3' } }])).toBe(
    '@b/2/@c/3/@a/1'
  );
  // invalid input
  expect(getComponentName()).toBe('');
  expect(getComponentName({}, [])).toBe('');
  expect(getComponentName({}, [{}])).toBe('/');
});
test('findComponent', () => {
  const c1: any = { meta: { did: 'c1', bundleDid: 'b1' } };

  const c2: any = { meta: { did: 'c2', bundleDid: 'b2' } };

  const c31: any = { meta: { did: 'c31', bundleDid: 'b3' } };
  const c32: any = { meta: { did: 'c32', bundleDid: 'b3' } };

  c1.children = [c2];
  c2.children = [c31, c32];

  expect(findComponent(c1, (x) => x.meta.bundleDid === 'b1')).toBe(c1);
  expect(findComponent(c1, (x) => x.meta.bundleDid === 'b2')).toBe(c2);
  expect(findComponent(c1, (x) => x.meta.bundleDid === 'b3')).toBe(c31);
  expect(findComponent(c1, (x) => x.meta.bundleDid === 'b3' && x.meta.did === 'c32')).toBe(c32);
  expect(findComponent(c1, (x) => x.meta.bundleDid === 'b3', { returnAncestors: true })).toEqual({
    component: c31,
    ancestors: [c1, c2],
  });
  expect((findComponent as any)(c1)).toBe(null);
  expect(findComponent(c1, (() => {}) as any)).toBe(null);
  expect(
    findComponent(
      c1,
      (_, { ancestors }) => ancestors.length === 2 && ancestors[0].meta.did === 'c1' && ancestors[1].meta.did === 'c2'
    )
  ).toBe(c31);
});

test('findComponentById', () => {
  const c1: any = { meta: { did: 'c1' } };

  const c2: any = { meta: { did: 'c2' } };

  const c3: any = { meta: { did: 'c3' } };

  c1.children = [c2];
  c2.children = [c3];
  expect(findComponentById(c1, 'c1')).toBe(c1);
  expect(findComponentById(c1, 'c1/c2')).toBe(c2);
  expect(findComponentById(c1, 'c1/c2/c3')).toBe(c3);
  expect(findComponentById(c1, 'c1/c2/c3', { returnAncestors: true })).toEqual({ component: c3, ancestors: [c1, c2] });
  expect(findComponentById(c1, 'xxx')).toBe(null);

  expect(findComponentById(c1, ['c1'])).toBe(c1);
  expect(findComponentById(c1, ['c1', 'c2'])).toBe(c2);
  expect(findComponentById(c1, ['c1', 'c2', 'c3'])).toBe(c3);
  expect(findComponentById(c1, ['c1', 'c2', 'c3'], { returnAncestors: true })).toEqual({
    component: c3,
    ancestors: [c1, c2],
  });
  expect(findComponentById(c1, ['xxx'])).toBe(null);
});

test('findComponentV2', () => {
  const c1: any = { meta: { did: 'c1', bundleDid: 'b1' } };

  const c2: any = { meta: { did: 'c2', bundleDid: 'b2' } };

  const c3: any = { meta: { did: 'c3', bundleDid: 'b3' } };
  const c4: any = { meta: { did: 'c4', bundleDid: 'b4' } };

  c1.children = [c2, c3, c4];

  expect(findComponentV2(c1, (x) => x.meta.bundleDid === 'b1')).toBeFalsy();
  expect(findComponentV2(c1, (x) => x.meta.bundleDid === 'b2')).toBe(c2);
  expect(findComponentV2(c1, (x) => x.meta.bundleDid === 'b3')).toBe(c3);
  expect(findComponentV2(c1, (x) => x.meta.bundleDid === 'b4' && x.meta.did === 'c4')).toBe(c4);
  expect((findComponentV2 as any)(c1)).toBeFalsy();
  expect((findComponentV2 as any)(c1, () => {})).toBeFalsy();
});

test('findComponentByIdV2', () => {
  const c1: any = { meta: { did: 'c1' } };

  const c2: any = { meta: { did: 'c2' } };

  const c3: any = { meta: { did: 'c3' } };

  c1.children = [c2, c3];

  expect((findComponentByIdV2 as any)(c1)).toBeFalsy();
  expect(findComponentByIdV2(c1, 'c1')).toBeFalsy();
  expect(findComponentByIdV2(c1, 'c1/c2')).toBe(c2);
  expect(findComponentByIdV2(c1, 'c2')).toBe(c2);
  expect(findComponentByIdV2(c1, 'c1/c3')).toBe(c3);
  expect(findComponentByIdV2(c1, 'c3')).toBe(c3);
  expect(findComponentByIdV2(c1, 'xxx')).toBeFalsy();

  expect(findComponentByIdV2(c1, ['c2'])).toBe(c2);
  expect(findComponentByIdV2(c1, ['c1', 'c2'])).toBe(c2);
  expect(findComponentByIdV2(c1, ['c3'])).toBe(c3);
  expect(findComponentByIdV2(c1, ['c1', 'c3'])).toBe(c3);
  expect(findComponentByIdV2(c1, ['c2', 'c3'])).toBeFalsy();
  expect(findComponentByIdV2(c1, ['xxx'])).toBeFalsy();
});

test('findWebInterface', () => {
  expect(findWebInterface()).toBeFalsy();
  expect(findWebInterface({})).toBeFalsy();
  expect(findWebInterface({ meta: {} })).toBeFalsy();
  expect(findWebInterface({ meta: { interfaces: [] } })).toBeFalsy();
  expect(findWebInterface({ meta: { interfaces: {} } })).toBeFalsy();
  expect(findWebInterface({ meta: { interfaces: [{ type: 'web', key: 'value' }] } })).toEqual({
    type: 'web',
    key: 'value',
  });
  expect(findWebInterface({ interfaces: [{ type: 'web', key: 'value' }] })).toEqual({
    type: 'web',
    key: 'value',
  });
});

test('findWebInterfacePort', () => {
  expect(findWebInterfacePort()).toBeFalsy();
  expect(findWebInterfacePort({})).toBeFalsy();
  expect(findWebInterfacePort({ meta: {} })).toBeFalsy();
  expect(findWebInterfacePort({ meta: { interfaces: [] } })).toBeFalsy();
  expect(findWebInterfacePort({ meta: { interfaces: {} } })).toBeFalsy();
  expect(findWebInterfacePort({ meta: { interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }] } })).toBeFalsy();

  expect(
    findWebInterfacePort({
      meta: { interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }] },
      ports: { NOT_MATCH: 8888 },
    })
  ).toBeFalsy();

  expect(
    findWebInterfacePort({
      meta: { interfaces: [{ type: 'web', port: 'NOT_MATCH' }] },
      ports: { BLOCKLET_PORT: 8888 },
    })
  ).toBeFalsy();

  expect(
    findWebInterfacePort({
      meta: { interfaces: [{ type: 'web', port: 'BLOCKLET_PORT' }] },
      ports: { BLOCKLET_PORT: 8888 },
    })
  ).toBe(8888);
});

test('findServiceFromMeta', () => {
  expect(findServiceFromMeta()).toBeFalsy();
  expect(
    findServiceFromMeta(
      {
        meta: { interfaces: [{ type: 'web', services: [{ name: 'auth', config: { key: 'value' } }] }] },
      } as any,
      'auth'
    )
  ).toEqual({
    name: 'auth',
    config: { key: 'value' },
  });
  expect(
    findServiceFromMeta(
      {
        interfaces: [{ type: 'web', services: [{ name: 'auth', config: { key: 'value' } }] }],
      } as any,
      'auth'
    )
  ).toEqual({
    name: 'auth',
    config: { key: 'value' },
  });
});

test('getParentComponentName', () => {
  expect(getParentComponentName()).toBe('');
  expect(getParentComponentName('a')).toBe('');
  expect(getParentComponentName('@a/b')).toBe('');
  expect(getParentComponentName('a/b')).toBe('a');
  expect(getParentComponentName('@a/b/c')).toBe('@a/b');
  expect(getParentComponentName('a/@b/c')).toBe('a');
  expect(getParentComponentName('@a/b/@c/d')).toBe('@a/b');
  expect(getParentComponentName('@a/b/@c/d/e')).toBe('@a/b/@c/d');
  expect(getParentComponentName('@a/b/@c/d/@e/f')).toBe('@a/b/@c/d');
});
test('getConnectAppUrl', () => {
  expect(getConnectAppUrl({ request: { headers: {} }, baseUrl: 'www.arcblock.io' })).toEqual('www.arcblock.io');
  expect(getConnectAppUrl({ request: { headers: { 'x-path-prefix': '/p' } }, baseUrl: 'www.arcblock.io' })).toEqual(
    'www.arcblock.io'
  );
  expect(
    getConnectAppUrl({
      request: {
        headers: {
          'x-path-prefix': '/p/a',
          'x-group-path-prefix': '/p',
          'x-blocklet-did': 'parent',
          'x-blocklet-real-did': 'child',
        },
      },
      baseUrl: 'www.arcblock.io/p/a',
    })
  ).toEqual('www.arcblock.io/p');
});
test('isFreeComponent', () => {
  expect((isFreeComponent as any)({})).toEqual(true);
  expect((isFreeComponent as any)({ payment: {} })).toEqual(true);
  expect((isFreeComponent as any)({ payment: { componentPrice: [] } })).toEqual(true);
  expect((isFreeComponent as any)({ payment: { componentPrice: [{ type: 'fixed', value: 2 }] } })).toEqual(false);
});
test('getChainInfo', () => {
  expect(getChainInfo({})).toEqual({ host: 'none', id: 'none', type: 'arcblock' });
  expect(getChainInfo({ CHAIN_ID: 'beta' })).toEqual({ host: 'none', id: 'beta', type: 'arcblock' });
  expect(getChainInfo({ CHAIN_TYPE: 'ethereum', CHAIN_ID: '4' })).toEqual({
    host: 'none',
    id: '4',
    type: 'ethereum',
  });
  expect(getChainInfo({ CHAIN_TYPE: 'ethereum' })).toEqual({
    host: 'none',
    id: '1',
    type: 'ethereum',
  });
  expect(
    getChainInfo({ CHAIN_TYPE: 'ethereum', CHAIN_ID: '4', CHAIN_HOST: 'https://beta.abtnetwork.io/api/' })
  ).toEqual({
    host: 'https://beta.abtnetwork.io/api/',
    id: '4',
    type: 'ethereum',
  });
});

test('isEnvShareableToClient', () => {
  expect(isEnvShareableToClient()).toBe(false);
  expect(isEnvShareableToClient(null)).toBe(false);
  expect((isEnvShareableToClient as any)({})).toBe(false);
  expect((isEnvShareableToClient as any)({ name: 'a' })).toBe(true);
  expect((isEnvShareableToClient as any)({ name: 'a', value: 'A' })).toBe(true);
  expect((isEnvShareableToClient as any)({ key: 'a' })).toBe(true);
  expect((isEnvShareableToClient as any)({ key: 'a', value: 'A' })).toBe(true);
  expect((isEnvShareableToClient as any)({ key: 'a', secure: true })).toBe(false);
  expect((isEnvShareableToClient as any)({ value: 'a', secure: true })).toBe(false);
  expect((isEnvShareableToClient as any)({ key: 'a', shared: false })).toBe(false);
  expect((isEnvShareableToClient as any)({ value: 'a', shared: false })).toBe(false);
  expect((isEnvShareableToClient as any)({ key: 'a', secure: true, shared: true })).toBe(false);
  expect((isEnvShareableToClient as any)({ key: 'BLOCKLET_APP_NAME' })).toBe(false);
});

test('isEnvShareable', () => {
  expect(isEnvShareable()).toBe(false);
  expect(isEnvShareable(null)).toBe(false);
  expect(isEnvShareable({})).toBe(false);

  // shared must be explicitly set to true
  expect(isEnvShareable({ name: 'a' })).toBe(false);
  expect(isEnvShareable({ name: 'a', value: 'A' } as any)).toBe(false);
  expect(isEnvShareable({ key: 'a' })).toBe(false);
  expect(isEnvShareable({ key: 'a', value: 'A' } as any)).toBe(false);
  expect(isEnvShareable({ name: 'a', shared: true })).toBe(true);
  expect(isEnvShareable({ name: 'a', value: 'A', shared: true } as any)).toBe(true);
  expect(isEnvShareable({ key: 'a', shared: true })).toBe(true);
  expect(isEnvShareable({ key: 'a', value: 'A', shared: true } as any)).toBe(true);

  expect(isEnvShareable({ key: 'a', secure: true })).toBe(false);
  expect(isEnvShareable({ value: 'a', secure: true } as any)).toBe(false);
  expect(isEnvShareable({ key: 'a', shared: false })).toBe(false);
  expect(isEnvShareable({ value: 'a', shared: false } as any)).toBe(false);
  expect(isEnvShareable({ key: 'a', secure: true, shared: true })).toBe(false);
  expect(isEnvShareable({ key: 'a', secure: true, shared: true }, true)).toBe(true);
  expect(isEnvShareable({ key: 'BLOCKLET_APP_NAME' })).toBe(false);
});

test('isExternalBlocklet', () => {
  expect(isExternalBlocklet({ controller: { id: 'xxx', expireDate: 'xxx' } })).toBe(true);
  expect(isExternalBlocklet({ controller: {} })).toBe(true);
  expect(isExternalBlocklet()).toBe(false);
  expect(isExternalBlocklet({})).toBe(false);
  expect(isExternalBlocklet({ controller: null })).toBe(false);
});

test('getBlockletAppIdList', () => {
  expect(getBlockletAppIdList({})).toEqual([]);
  expect(getBlockletAppIdList({ appDid: 'a' })).toEqual(['a']);
  expect(getBlockletAppIdList({ appPid: 'b' })).toEqual(['b']);
  expect(getBlockletAppIdList({ appDid: 'a', appPid: 'b' })).toEqual(['a', 'b']);
  expect(getBlockletAppIdList({ appDid: 'a', appPid: 'b', migratedFrom: null })).toEqual(['a', 'b']);
  expect(getBlockletAppIdList({ appDid: 'a', appPid: 'b', migratedFrom: [] })).toEqual(['a', 'b']);
  expect(getBlockletAppIdList({ appDid: 'a', appPid: 'b', migratedFrom: [{ appDid: 'c' }] })).toEqual(['a', 'b', 'c']);
  expect(getBlockletAppIdList({ appDid: 'a', appPid: 'b', migratedFrom: [{ appDid: 'a' }] })).toEqual(['a', 'b']);
});

describe('getBlockletChainInfo', () => {
  const hostname1 = 'https://chain1';
  const hostname2 = 'https://chain2';
  const emptyInfo: any = { id: 'none', host: 'none', type: 'arcblock' };
  test('should work as expected', () => {
    expect(getBlockletChainInfo()).toEqual(emptyInfo);
    expect(getBlockletChainInfo({})).toEqual(emptyInfo);
    expect(getBlockletChainInfo({ configObj: {} })).toEqual(emptyInfo);
    expect(getBlockletChainInfo({ configObj: { CHAIN_HOST: '' } })).toEqual(emptyInfo);
    expect(getBlockletChainInfo({ configObj: { CHAIN_HOST: 'none' } })).toEqual(emptyInfo);
    expect(getBlockletChainInfo({ configObj: { CHAIN_HOST: hostname1 } })).toEqual({ ...emptyInfo, host: hostname1 });

    expect(
      getBlockletChainInfo({ configObj: { CHAIN_HOST: 'none' }, children: [{ configObj: { CHAIN_HOST: 'none' } }] })
    ).toEqual(emptyInfo);
    expect(
      getBlockletChainInfo({ configObj: { CHAIN_HOST: 'none' }, children: [{ configObj: { CHAIN_HOST: hostname1 } }] })
    ).toEqual({ ...emptyInfo, host: hostname1 });

    expect(
      getBlockletChainInfo({
        configObj: { CHAIN_HOST: hostname2 },
        children: [{ configObj: { CHAIN_HOST: hostname1 } }],
      })
    ).toEqual({ ...emptyInfo, host: hostname2 });

    expect(
      getBlockletChainInfo({
        configObj: { CHAIN_HOST: 'none' },
        children: [{ configObj: { CHAIN_HOST: hostname2 } }, { configObj: { CHAIN_HOST: hostname1 } }],
      })
    ).toEqual({ ...emptyInfo, host: hostname2 });

    expect(
      getBlockletChainInfo({
        configObj: { CHAIN_HOST: 'none' },
        children: [{ children: [{ configObj: { CHAIN_HOST: hostname2 } }] }, { configObj: { CHAIN_HOST: hostname1 } }],
      })
    ).toEqual({ ...emptyInfo, host: hostname2 });
  });
});

test('getBlockletServices', () => {
  expect(
    getBlockletServices({
      meta: {
        interfaces: [
          { type: 'service', protocol: 'udp', name: 'dns', port: { external: 53, internal: 'BLOCKLET_PORT' } },
        ],
      },
      ports: { BLOCKLET_PORT: 3333 },
    })
  ).toEqual([
    {
      name: 'dns',
      protocol: 'udp',
      port: 53,
      upstreamPort: 3333,
    },
  ]);

  expect(
    getBlockletServices({
      children: [
        {
          meta: {
            interfaces: [
              { type: 'service', protocol: 'udp', name: 'dns', port: { external: 53, internal: 'BLOCKLET_PORT' } },
            ],
          },
          ports: { BLOCKLET_PORT: 3333 },
        },
      ],
    })
  ).toEqual([
    {
      name: 'dns',
      protocol: 'udp',
      port: 53,
      upstreamPort: 3333,
    },
  ]);

  expect(
    getBlockletServices({
      children: [
        {
          children: [
            {
              meta: {
                interfaces: [
                  { type: 'service', protocol: 'udp', name: 'dns', port: { external: 53, internal: 'BLOCKLET_PORT' } },
                ],
              },
              ports: { BLOCKLET_PORT: 3333 },
            },
          ],
        },
      ],
    })
  ).toEqual([
    {
      name: 'dns',
      protocol: 'udp',
      port: 53,
      upstreamPort: 3333,
    },
  ]);

  expect(
    getBlockletServices({
      children: [
        {
          meta: {
            interfaces: [{ type: 'service' }],
          },
        },
      ],
    })
  ).toEqual([
    {
      name: undefined,
      protocol: undefined,
      port: NaN,
      upstreamPort: NaN,
    },
  ]);

  expect(getBlockletServices({} as any)).toEqual([]);
  expect(getBlockletServices({})).toEqual([]);
  expect(getBlockletServices({ meta: {} })).toEqual([]);
  expect(getBlockletServices({ meta: { interfaces: [] } })).toEqual([]);
  expect(getBlockletServices({ meta: { interfaces: [{ name: 'a', port: 'BLOCKLET_PORT' }] } })).toEqual([]);
  expect(
    getBlockletServices({
      meta: { interfaces: [{ name: 'dns', port: { external: 'DNS_PORT', internal: 'BLOCKLET_PORT' } }] },
    })
  ).toEqual([]);
});

test('isInProgress', () => {
  [
    BlockletStatus.waiting,
    BlockletStatus.downloading,
    BlockletStatus.installing,
    BlockletStatus.upgrading,
    BlockletStatus.starting,
    BlockletStatus.stopping,
    'waiting',
    'downloading',
    'starting',
    'installing',
    'stopping',
    'upgrading',
    'restarting',
    'deleting',
  ].forEach((status) => expect(isInProgress(status)).toBe(true));

  [
    BlockletStatus.installed,
    BlockletStatus.stopped,
    BlockletStatus.running,
    BlockletStatus.error,
    'installed',
    'stopped',
    'running',
    'error',
  ].forEach((status) => expect(isInProgress(status)).toBe(false));
});

test('isBeforeInstalled', () => {
  [
    BlockletStatus.added,
    BlockletStatus.waiting,
    BlockletStatus.downloading,
    BlockletStatus.installing,
    'added',
    'waiting',
    'downloading',
    'installing',
  ].forEach((status) => expect(isBeforeInstalled(status)).toBe(true));

  [
    BlockletStatus.installed,
    BlockletStatus.upgrading,
    BlockletStatus.starting,
    BlockletStatus.running,
    'installed',
    'upgrading',
    'starting',
    'running',
  ].forEach((status) => expect(isBeforeInstalled(status)).toBe(false));
});

test('isRunning', () => {
  [BlockletStatus.running, 'running'].forEach((status) => expect(isRunning(status)).toBe(true));

  [BlockletStatus.installed, 'installed'].forEach((status) => expect(isRunning(status)).toBe(false));
});

test('filterComponentsV2', () => {
  expect((filterComponentsV2 as any)()).toEqual([]);
  expect((filterComponentsV2 as any)({})).toEqual([]);
  expect((filterComponentsV2 as any)({ children: [{ value: 1 }, { value: 2 }] })).toEqual([]);
  expect((filterComponentsV2 as any)({ children: [{ value: 1 }, { value: 2 }] }, (x) => x.value === 1)).toEqual([
    { value: 1 },
  ]);
  expect((filterComponentsV2 as any)({ children: [{ value: 1 }, { value: 2 }] }, (x) => x.value > 0)).toEqual([
    { value: 1 },
    { value: 2 },
  ]);
});

test('isGatewayBlocklet', () => {
  expect((isGatewayBlocklet as any)()).toBe(false);
  expect((isGatewayBlocklet as any)({})).toBe(false);
  expect((isGatewayBlocklet as any)({ group: 'xxx' } as any)).toBe(false);
  expect((isGatewayBlocklet as any)({ group: BlockletGroup.gateway } as any)).toBe(true);
  expect((isGatewayBlocklet as any)({ group: 'gateway' } as any)).toBe(true);
});

test('hasResourceType', () => {
  expect((hasResourceType as any)()).toBe(false);
  expect((hasResourceType as any)({})).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: [] } })).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: ['a.js'] } }, 'html')).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: ['a.js.xxx'] } }, '.js')).toBe(false);

  expect((hasResourceType as any)({ meta: { resources: ['a.js'] } })).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: ['a.js'] } }, 'js')).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: ['a.js'] } }, '.js')).toBe(false);
  expect((hasResourceType as any)({ meta: { resources: [] } })).toBe(false);

  expect(
    hasResourceType({ meta: { resource: { bundles: [{ did: 'x', type: 'js' }] } } }, { type: 'html', did: 'x' })
  ).toBe(false);
  expect(
    hasResourceType({ meta: { resource: { bundles: [{ did: 'x', type: 'js' }] } } }, { type: '.js', did: 'x' })
  ).toBe(false);
  expect(hasResourceType({ meta: { resource: { bundles: [{ did: 'x', type: 'js' }] } } })).toBe(false);
  expect(
    hasResourceType({ meta: { resource: { bundles: [{ did: 'x', type: 'js' }] } } }, { type: 'js', did: 'x' })
  ).toBe(true);
});

test('isPackBlocklet', () => {
  expect((isPackBlocklet as any)()).toBe(false);
  expect((isPackBlocklet as any)({})).toBe(false);
  expect((isPackBlocklet as any)({ group: 'xxx' } as any)).toBe(false);
  expect((isPackBlocklet as any)({ group: BlockletGroup.pack } as any)).toBe(true);
  expect((isPackBlocklet as any)({ group: 'pack' } as any)).toBe(true);
});
