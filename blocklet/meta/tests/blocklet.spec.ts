import { test, expect } from 'bun:test';
import { getComponentsInternalInfo } from '../src/blocklet';
import { BlockletStatus } from '../src/constants';

test('getComponentsInternalInfo', () => {
  expect(getComponentsInternalInfo({} as any)).toEqual([]);
  expect(getComponentsInternalInfo({} as any)).toEqual([]);
  expect(getComponentsInternalInfo({ children: [] } as any)).toEqual([]);
  expect(
    getComponentsInternalInfo({
      children: [
        {
          meta: {
            title: 'Title1',
            did: 'did1',
            name: 'name1',
            interfaces: [
              {
                type: 'web',
                port: 'BLOCKLET_PORT',
              },
            ],
          },
          ports: { BLOCKLET_PORT: 3333 },
          mountPoint: '/mountPoint1',
          status: BlockletStatus.running,
          environments: [{ key: 'BLOCKLET_PORT', value: 3333 }],
        },
        {
          meta: {
            title: 'Title2',
            did: 'did2',
            name: 'name2',
            interfaces: [
              {
                type: 'web',
                port: 'BLOCKLET_PORT',
              },
            ],
          },
        },
      ],
    })
  ).toEqual([
    {
      title: 'Title1',
      did: 'did1',
      name: 'name1',
      mountPoint: '/mountPoint1',
      status: BlockletStatus.running,
      port: 3333,
      resources: [],
      resourcesV2: [],
      containerPort: '',
      group: undefined,
      isGreen: false,
      version: undefined,
    },
    {
      title: 'Title2',
      did: 'did2',
      name: 'name2',
      mountPoint: '',
      status: undefined,
      port: 0,
      resources: [],
      resourcesV2: [],
      containerPort: '',
      group: undefined,
      isGreen: false,
      version: undefined,
    },
  ]);
});

test('resources', () => {
  expect(
    getComponentsInternalInfo({
      children: [
        {
          meta: {
            title: 'Title1',
            did: 'did1',
            name: 'name1',
            version: '1.0.0',
            interfaces: [
              {
                type: 'web',
                port: 'BLOCKLET_PORT',
              },
            ],
            resources: ['/res1', '/res2'],
            resource: {
              bundles: [
                {
                  did: 'did1',
                  type: 'typeA',
                  public: true,
                },
                {
                  did: 'did2',
                  type: 'typeB',
                },
              ],
            },
          },
          mountPoint: '/mountPoint1',
          status: BlockletStatus.running,
          ports: { BLOCKLET_PORT: 3333 },
          environments: [
            { key: 'BLOCKLET_PORT', value: 3333 },
            { key: 'BLOCKLET_APP_DIR', value: '/path/to/data' },
          ],
        },
      ],
    })
  ).toEqual([
    {
      title: 'Title1',
      did: 'did1',
      name: 'name1',
      version: '1.0.0',
      mountPoint: '/mountPoint1',
      status: BlockletStatus.running,
      port: 3333,
      containerPort: '',
      group: undefined,
      isGreen: false,
      resources: [],
      resourcesV2: [
        {
          path: '/path/to/data/resources/did1/typeA',
          public: true,
        },
        {
          path: '/path/to/data/resources/did2/typeB',
          public: undefined,
        },
      ],
    },
  ]);
});
