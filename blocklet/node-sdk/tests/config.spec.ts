/* eslint-disable import/first */
process.env.BLOCKLET_COMPONENT_API_KEY = '123';
import { describe, test, expect, beforeEach, afterEach, mock, it, afterAll } from 'bun:test';

import { BlockletStatus } from '@blocklet/constant';
// eslint-disable-next-line import/order
import * as realConfig from '../src/config';

const mockEmit = mock();
(mockEmit as any).emit = mock(() => true);

mock.module('../src/config', () => {
  return {
    _esModule: true,
    ...realConfig,
    default: {
      ...realConfig.default,
      events: mockEmit,
    },
    events: mockEmit,
    env: {
      ...realConfig.env,
      appDescription: 'test blocklet description',
      appId: 'test blocklet id',
      appIds: ['test blocklet id'],
      appName: 'test blocklet name',
      appPid: 'test blocklet pid',
    },
    components: [
      {
        version: '1.1.1',
        did: 'did1',
        name: 'name1',
        title: 'title1',
        mountPoint: '/abc',
        port: 123,
        webEndpoint: 'http://127.0.0.1:123',
      },
    ],
  };
});

mock.module('@arcblock/ws', () => {
  return {
    WsClient: class {
      connect() {}

      channel() {
        const c = {
          join: () => c,
          receive: () => c,
          on: () => {},
        };
        return c;
      }
    },
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

import { setEnvironment } from '../tools/environment';

setEnvironment();

import { encrypt } from '../lib/security';
import config, {
  logger,
  components,
  env,
  events,
  Events,
  getBlockletJs,
  _handleComponentUpdateOld,
  _handleAppConfigUpdate,
  _handleComponentInstalled,
  _handleComponentUpdated,
  _handleComponentStarted,
  _handleComponentStopped,
  _handleComponentRemoved,
  _handleComponentConfigUpdate,
} from '../src/config';

const { fetchBlockletJs } = config;

test('logger', () => {
  expect(logger).toEqual({
    info: expect.any(Function),
    debug: expect.any(Function),
    warn: expect.any(Function),
    error: expect.any(Function),
  });
});

test('components', () => {
  const initialComponent = {
    version: '1.1.1',
    did: 'did1',
    name: 'name1',
    title: 'title1',
    mountPoint: '/abc',
    port: 123,
    webEndpoint: 'http://127.0.0.1:123',
  };

  // should initialize components
  expect(components).toEqual([initialComponent]);

  expect(events.emit).not.toHaveBeenCalledWith(Events.componentAdded, expect.anything());
  expect(events.emit).not.toHaveBeenCalledWith(Events.componentUpdated, expect.anything());
  expect(events.emit).not.toHaveBeenCalledWith(Events.componentStarted, expect.anything());
  expect(events.emit).not.toHaveBeenCalledWith(Events.componentStopped, expect.anything());
  expect(events.emit).not.toHaveBeenCalledWith(Events.componentRemoved, expect.anything());

  _handleComponentInstalled({
    components: [
      {
        did: 'did2',
        name: 'name2',
        version: '2.2.2',
        title: 'title2',
        mountPoint: '/2',
        port: 222,
      },
    ],
  });

  const newComponent = {
    did: 'did2',
    name: 'name2',
    version: '2.2.2',
    title: 'title2',
    mountPoint: '/2',
    port: 222,
    status: BlockletStatus.stopped,
    webEndpoint: 'http://127.0.0.1:222',
  };

  expect(components).toEqual([initialComponent, newComponent]);
  expect(events.emit).toHaveBeenCalledWith(Events.componentAdded, [newComponent]);

  _handleComponentStarted({
    components: [{ did: newComponent.did }],
  });
  expect(components).toEqual([
    initialComponent,
    {
      ...newComponent,
      status: BlockletStatus.running,
    },
  ]);
  expect(events.emit).toHaveBeenCalledWith(Events.componentStarted, [
    {
      ...newComponent,
      status: BlockletStatus.running,
    },
  ]);

  _handleComponentStopped({
    components: [{ did: newComponent.did }],
  });
  expect(components).toEqual([
    initialComponent,
    {
      ...newComponent,
      status: BlockletStatus.stopped,
    },
  ]);
  expect(events.emit).toHaveBeenCalledWith(Events.componentStopped, [
    {
      ...newComponent,
      status: BlockletStatus.stopped,
    },
  ]);

  _handleComponentUpdated({
    components: [
      {
        ...newComponent,
        mountPoint: '/2-2',
      },
    ],
  });
  expect(components).toEqual([
    initialComponent,
    {
      ...newComponent,
      mountPoint: '/2-2',
      status: BlockletStatus.stopped,
    },
  ]);
  expect(events.emit).toHaveBeenCalledWith(Events.componentUpdated, [
    {
      ...newComponent,
      mountPoint: '/2-2',
      status: BlockletStatus.stopped,
    },
  ]);

  _handleComponentRemoved({
    components: [{ did: newComponent.did }],
  });
  expect(components).toEqual([initialComponent]);
  expect(events.emit).toHaveBeenCalledWith(Events.componentRemoved, [{ did: newComponent.did }]);
});

describe('getBlockletJs', () => {
  const mockBlockletJs = 'window.blocklet={prefix: "/abc/",pageGroup: "",key: "value"}';

  it('should update the pageGroup when provided', () => {
    const pageGroup = 'my-page-group';
    const result = getBlockletJs(pageGroup, '', mockBlockletJs);
    expect(result).toContain(`pageGroup: "${pageGroup}"`);
  });

  it('should update the pathPrefix when provided', () => {
    const pathPrefix = 'my-path-prefix';
    const result = getBlockletJs('', pathPrefix, mockBlockletJs);
    expect(result).toContain(`prefix: "/${pathPrefix}/"`);
  });

  it('should handle both pageGroup and pathPrefix', () => {
    const pageGroup = 'my-page-group';
    const pathPrefix = 'my-path-prefix';
    const result = getBlockletJs(pageGroup, pathPrefix, mockBlockletJs);
    expect(result).toContain(`prefix: "/${pathPrefix}/"`);
    expect(result).toContain(`pageGroup: "${pageGroup}"`);
  });

  it('should not update when neither pageGroup nor pathPrefix is provided', () => {
    const result = getBlockletJs('', '', mockBlockletJs);
    expect(result).toBe(mockBlockletJs);
  });
});

describe('env', () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should work from process.env', () => {
    expect(env).toHaveProperty('appDescription');
    expect(env).toHaveProperty('appId');
    expect(env).toHaveProperty('appIds');
    expect(env).toHaveProperty('appName');
    expect(env).toHaveProperty('appPid');
    expect(env).toHaveProperty('appStorageEndpoint');
    expect(env).toHaveProperty('appUrl');
    expect(env).toHaveProperty('cacheDir');
    expect(env).toHaveProperty('dataDir');
    expect(env).toHaveProperty('isComponent');
    expect(env).toHaveProperty('mode');
    expect(env).toHaveProperty('preferences');
    expect(env).toHaveProperty('languages');
    expect(env).toHaveProperty('serverVersion');
  });

  describe('Initialization', () => {
    test('should initialize logger', () => {
      expect(logger).toBeDefined();
    });

    test('should initialize env', () => {
      expect(env).toBeDefined();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      mock.clearAllMocks();
    });

    afterEach(() => {
      process.env.DOCKER_HOST_SERVER_DIR = '';
      process.env.DOCKER_CONTAINER_SERVER_DIR = '';
    });

    test('should handle components updated event', () => {
      const data = { components: [{ port: 8080 }] };
      const updatedComponents = [{ port: 8080, webEndpoint: 'http://127.0.0.1:8080' }];
      // @ts-ignore
      _handleComponentUpdateOld(data);
      expect(components).toEqual(updatedComponents as typeof components);
      expect(events.emit).not.toHaveBeenCalledWith('componentsUpdate', updatedComponents);
    });

    test('should handle app config changed event', () => {
      expect(env.appName).toEqual('test blocklet name');
      let data = {
        configs: [
          { key: 'BLOCKLET_APP_NAME', value: 'My App' },
          { key: 'BLOCKLET_APP_LANGUAGES', value: 'en' },
          { key: 'prefs.key', value: 'value' },
        ],
      };
      _handleAppConfigUpdate(data);
      expect(env.appName).toEqual('My App');
      expect(env.languages).toEqual([{ code: 'en', name: 'English' }]);
      expect(env.preferences).toEqual({ key: 'value' });
      expect(events.emit).toHaveBeenCalledWith('envUpdate', {
        appName: 'My App',
        languages: [{ code: 'en', name: 'English' }],
        preferences: { key: 'value' },
      });

      data = {
        configs: [
          { key: 'BLOCKLET_APP_NAME', value: 'Updated' },
          { key: 'BLOCKLET_APP_LANGUAGES', value: 'zh' },
          { key: 'prefs.key', value: 'value-updated' },
          { key: 'prefs.keyNew', value: 'value-new' },
        ],
      };
      _handleAppConfigUpdate(data);
      expect(env.appName).toEqual('Updated');
      expect(env.preferences).toEqual({ key: 'value-updated', keyNew: 'value-new' });
      expect(env.languages).toEqual([{ code: 'zh', name: '简体中文' }]);
      expect(events.emit).toHaveBeenCalledWith('envUpdate', {
        appName: 'Updated',
        languages: [{ code: 'zh', name: '简体中文' }],
        preferences: { key: 'value-updated', keyNew: 'value-new' },
      });
    });

    test('should handle component config changed event', () => {
      const data = {
        configs: encrypt(
          JSON.stringify([
            { key: 'PROP1', value: 'v1' },
            { key: 'PROP2', value: 'v2' },
            { key: 'prefs.PROP3', value: 'v3' },
          ]),
          process.env.BLOCKLET_COMPONENT_API_KEY,
          process.env.BLOCKLET_COMPONENT_DID
        ),
      };
      _handleComponentConfigUpdate(data);

      expect(events.emit).toHaveBeenCalledWith('envUpdate', {
        PROP1: 'v1',
        PROP2: 'v2',
        preferences: { PROP3: 'v3' },
      });

      // @ts-ignore
      expect(env.PROP1).toBe('v1');
      // @ts-ignore
      expect(env.PROP2).toBe('v2');
      // @ts-ignore
      expect(env.preferences.PROP3).toBe('v3');
    });

    test('should update component store not in docker', () => {
      process.env.DOCKER_HOST_SERVER_DIR = '';
      process.env.DOCKER_CONTAINER_SERVER_DIR = '';
      const nextComponent = {
        did: 'did3',
        name: 'name3',
        version: '2.2.2',
        title: 'title3',
        mountPoint: '/aaaa/333',
        port: 333,
        status: BlockletStatus.stopped,
        webEndpoint: 'http://127.0.0.1:333',
      };
      _handleComponentUpdated({
        components: [
          {
            ...nextComponent,
          },
        ],
      });
      const raw = JSON.stringify(components);
      expect(raw).toContain('/aaaa/333');
    });

    test('should update component store in docker _handleComponentUpdated', () => {
      process.env.DOCKER_HOST_SERVER_DIR = `/host-data/blocklet/${Math.random().toString(36).substring(2, 15)}`;
      process.env.DOCKER_CONTAINER_SERVER_DIR = `/var/blocklet/${Math.random().toString(36).substring(2, 15)}`;
      const nextComponent = {
        did: 'did3',
        name: 'name3',
        version: '2.2.2',
        title: 'title3',
        mountPoint: `${process.env.DOCKER_HOST_SERVER_DIR}/333`,
        port: 333,
        status: BlockletStatus.stopped,
        webEndpoint: 'http://127.0.0.1:333',
      };
      _handleComponentUpdated({
        components: [
          {
            ...nextComponent,
          },
        ],
      });
      const raw = JSON.stringify(components);
      expect(raw).toContain(`${process.env.DOCKER_CONTAINER_SERVER_DIR}/333`);
      expect(raw).not.toContain(process.env.DOCKER_HOST_SERVER_DIR);
    });

    test('should update component store in docker _handleComponentInstalled', () => {
      process.env.DOCKER_HOST_SERVER_DIR = `/host-data/blocklet/${Math.random().toString(36).substring(2, 15)}`;
      process.env.DOCKER_CONTAINER_SERVER_DIR = `/var/blocklet/${Math.random().toString(36).substring(2, 15)}`;
      const nextComponent = {
        did: 'did3',
        name: 'name3',
        version: '2.2.2',
        title: 'title3',
        mountPoint: `${process.env.DOCKER_HOST_SERVER_DIR}/333`,
        port: 333,
        status: BlockletStatus.stopped,
        webEndpoint: 'http://127.0.0.1:333',
      };
      _handleComponentInstalled({
        components: [
          {
            ...nextComponent,
          },
        ],
      });
      const raw = JSON.stringify(components);
      expect(raw).toContain(`${process.env.DOCKER_CONTAINER_SERVER_DIR}/333`);
      expect(raw).not.toContain(process.env.DOCKER_HOST_SERVER_DIR);
    });
  });
});

describe('fetchBlockletJs', () => {
  const componentDid = 'did1';
  let mockGet: ReturnType<typeof mock>;

  beforeEach(() => {
    process.env.BLOCKLET_COMPONENT_DID = componentDid;
    mockGet = mock();
    mock.module('axios', () => ({
      default: {
        get: mockGet,
      },
    }));
    // Ensure componentStore contains the expected component
    _handleComponentInstalled({
      components: [
        {
          did: componentDid,
          name: 'test-component',
          version: '1.0.0',
          title: 'Test Component',
          mountPoint: '/test',
          port: 8080,
        },
      ],
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test('type="js" should return JS string format', async () => {
    const mockData = {
      appName: 'Test App',
      version: '1.0.0',
      prefix: '/test/',
    };
    mockGet.mockResolvedValueOnce({ data: mockData });

    const result = await fetchBlockletJs('js');

    expect(result).toContain('window.blocklet = {');
    expect(result).toContain('appName: "Test App"');
    expect(result).toContain('version: "1.0.0"');
    expect(result).toContain('prefix: "/test/"');
  });

  test('type="json" should return data and update theme settings', async () => {
    const mockData = {
      appName: 'Test App',
      theme: {
        prefer: 'dark',
        light: { palette: { background: { default: '#ffffff' } } },
        dark: { palette: { background: { default: '#000000' } } },
      },
    };
    mockGet.mockResolvedValueOnce({ data: mockData });

    const result = await fetchBlockletJs('json');

    expect(result).toEqual(mockData);
    const settings = config.getBlockletSettings();
    expect(settings.theme.prefer).toBe('dark' as any);
    expect(settings.theme.dark.palette.background.default).toBe('#000000');
    expect(settings.theme.light.palette.background.default).toBe('#ffffff');
  });

  test('type="js" should return JS string by default and empty string on error', async () => {
    const mockData = { key: 'value' };
    mockGet.mockResolvedValueOnce({ data: mockData });

    const result = await fetchBlockletJs();

    expect(typeof result).toBe('string');
    expect(result).toContain('window.blocklet = {');

    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const result1 = await fetchBlockletJs('js');

    expect(result1).toBe('');
  });

  test('type="json" should return empty object on error and parse string response', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchBlockletJs('json');

    expect(result).toEqual({});

    const mockData = { name: 'Parsed App' };
    mockGet.mockResolvedValueOnce({ data: JSON.stringify(mockData) });

    const result1 = await fetchBlockletJs('json');

    expect(result1).toEqual(mockData);
  });

  test('single-flight mode: concurrent calls should share the same request', async () => {
    mockGet.mockResolvedValue({ data: { shared: true } });

    const [result1, result2, result3] = await Promise.all([
      fetchBlockletJs('json'),
      fetchBlockletJs('json'),
      fetchBlockletJs('json'),
    ]);

    expect(result1).toEqual({ shared: true });
    expect(result2).toEqual({ shared: true });
    expect(result3).toEqual({ shared: true });
    // Under single-flight, concurrent requests should trigger only one actual request
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
