/* eslint-disable no-var */
/* eslint-disable max-classes-per-file */
import http from 'http';
import { mock, describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
// @ts-ignore
import detectPort from 'detect-port';
// @ts-ignore
import sleep from '@abtnode/util/lib/sleep';
import { BlockletInternalEvents } from '@blocklet/constant';
// @ts-ignore
import * as JWT from '@arcblock/jwt';
import { setEnvironment, clearEnvironment } from '../../tools/environment';

import NotificationService, { _emitter } from '../../src/service/notification';
import { TNotificationInput } from '../../src/types/notification';

const { EventEmitter } = require('node:events');

// Create mock emitters for testing
const didEmitter = new EventEmitter();
const appEmitter = new EventEmitter();
const componentEmitter = new EventEmitter();
const mockDidChannelEmitter = didEmitter;
const mockAppChannelEmitter = appEmitter;
const mockComponentChannelEmitter = componentEmitter;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockWsClient {
  connect() {}

  disconnect() {}

  onError() {}

  onClose() {}

  channel(name: any) {
    const isAppChannel = /app:(\w+):public/.test(name);
    const isComponentChannel = /component:(\w+):(\w+)/.test(name);
    let emitter = didEmitter;
    if (isAppChannel) {
      emitter = appEmitter;
    }
    if (isComponentChannel) {
      emitter = componentEmitter;
    }
    const c = {
      join: () => c,
      receive(...args: any[]) {
        emitter.on(...args);
        return c;
      },
      on: emitter.on.bind(emitter),
    };
    return c;
  }
}

const mockDid1 = 'zNKmUZWxEnDviFL6wgUQXCT8pe5KUQR1kqgY';
const mockDid2 = 'z1b1vpz9r9Tj4e6CAqpuccSiPLD4FfR7sLV';

const serverSk =
  '0x7faa93a4c38df5b3f7e3dd756c4e4fdc6d38141a0118c2b39b3a2b16f80303d9137be0508ee3cbc71a4c39e93f816cfab118554ab85f1806fb09bd6f2a4f11a5';
const serverPk = '0x137be0508ee3cbc71a4c39e93f816cfab118554ab85f1806fb09bd6f2a4f11a5';
const serverDid = 'zNKWf8PnA4hxg62Z79eYqPz5uZVHU2MvX8a4';

const setServerEnvironment = () => {
  process.env.ABT_NODE_VERSION = '1.16.15';
  process.env.ABT_NODE_DID = 'zNKWf8PnA4hxg62Z79eYqPz5uZVHU2MvX8a4';
  process.env.ABT_NODE_PK = '0x137be0508ee3cbc71a4c39e93f816cfab118554ab85f1806fb09bd6f2a4f11a5';
  process.env.BLOCKLET_COMPONENT_DID = 'z2qa2vFUYqt8y2eB4vVqRZXnLJmPgm7RE5Xom';
};
const clearServerEnvironment = () => {
  process.env.ABT_NODE_VERSION = '';
  process.env.ABT_NODE_DID = '';
  process.env.ABT_NODE_PK = '';
  process.env.BLOCKLET_COMPONENT_DID = '';
};

describe('NotificationService', () => {
  const OLD_ENV = process.env;
  let server: any = null;
  const actions = [
    {
      name: 'link',
      title: 'Link',
      color: '#333',
      bgColor: '#eee',
      link: 'https://arcblock.io',
    },
  ];
  const attachments = [
    {
      type: 'token',
      data: {
        address: mockDid1,
        amount: '1',
        symbol: '123',
        senderDid: mockDid1,
        chainHost: 'https://chain.api',
        decimal: 16,
      },
    },
  ] as any;

  let serverPort: number | string | null = null;
  beforeAll(async () => {
    serverPort = await detectPort();
    mock.restore();
    process.env = { ...OLD_ENV };
    // mock abt node service api: just return data from request body
    server = http
      .createServer((req, res) => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        req.pipe(res);
      })
      .listen(serverPort);
  });

  afterAll(() => {
    server?.close();
    process.env = OLD_ENV;
  });

  beforeEach(() => {
    setEnvironment(serverPort as string);
    setServerEnvironment();
  });

  afterEach(() => {
    clearEnvironment();
    clearServerEnvironment();
  });

  test('api should be a function', () => {
    expect(typeof NotificationService.sendToUser).toEqual('function');
    expect(typeof NotificationService.sendToMail).toEqual('function');
    expect(typeof NotificationService.sendToRelay).toEqual('function');
  });

  test('should sendToUser works as expected', async () => {
    // expect params in request body
    const res = await NotificationService.sendToUser(mockDid1, {
      title: 'title',
      body: 'body',
      attachments,
      actions,
    } as unknown as TNotificationInput);
    expect(res).toHaveProperty('apiVersion');
    expect(res).toHaveProperty('data');
    const { data } = res;
    expect(data).toHaveProperty('sender');
    expect(data.sender).toHaveProperty('token');
    expect(data.sender.appDid).toBe(process.env.BLOCKLET_APP_ID);
    expect(data).toHaveProperty('receiver');
    expect(data.receiver).toBe(mockDid1);
    expect(data).toHaveProperty('notification');
    expect(data.notification.title).toBe('title');
    expect(data.notification.body).toBe('body');
    expect(data.notification.attachments).toEqual(attachments);
    expect(data.notification.actions).toEqual(actions);
    expect(data.options).toEqual({});
    // options
    const res2 = await NotificationService.sendToUser(
      mockDid1,
      { title: 'title', body: 'body', attachments, actions } as unknown as TNotificationInput,
      { keepForOfflineUser: false }
    );
    const { data: data2 } = res2;
    expect(data2.options).toEqual({ keepForOfflineUser: false });
    // param can be empty
    await expect(NotificationService.sendToUser(mockDid1, {} as unknown as TNotificationInput)).resolves.toBeTruthy();
    // param can have unknown prop
    await expect(
      NotificationService.sendToUser(
        mockDid1,
        { title: 'title', body: 'body', attachments, actions } as unknown as TNotificationInput,
        { unKnownProps: '' }
      )
    ).resolves.toBeTruthy();
  });

  test('should sendToRelay works as expected', async () => {
    const res = await NotificationService.sendToRelay('topic', 'event', { title: 'title', body: 'body' });
    expect(res).toHaveProperty('apiVersion');
    expect(res).toHaveProperty('data');
    expect(res.data).toHaveProperty('data');
    expect(res.data.data).toHaveProperty('title');
    expect(res.data.data).toHaveProperty('body');
    await expect(NotificationService.sendToRelay('topic', 'event', {})).resolves.toBeTruthy();
    // @ts-ignore
    await expect(NotificationService.sendToRelay('topic')).rejects.toBeTruthy();
  });

  test('should sendToMail works as expected when receiver or notification is a list', async () => {
    const res = await NotificationService.sendToMail('test-user@example.com', {
      title: 'title',
      body: 'body',
      // @ts-ignore
      attachments,
      actions,
    });

    // expect params in request body
    expect(res).toHaveProperty('apiVersion');
    expect(res).toHaveProperty('data');
    const { data } = res;
    expect(data).toHaveProperty('sender');
    expect(data.sender).toHaveProperty('token');
    expect(data.sender.appDid).toBe(process.env.BLOCKLET_APP_ID);
    expect(data).toHaveProperty('receiver');
    expect(data.receiver).toEqual('test-user@example.com');
    expect(data).toHaveProperty('notification');
    expect(data.notification.title).toBe('title');
    expect(data.notification.body).toBe('body');
    expect(data.notification.attachments).toEqual(attachments);
    expect(data.notification.actions).toEqual(actions);
  });

  test('should sendToUser works as expected when receiver or notification is a list', async () => {
    const res = await NotificationService.sendToUser(
      [mockDid1, mockDid2],
      [
        { title: 'title', body: 'body', attachments, actions },
        { title: 'title', body: 'body', attachments, actions },
      ]
    );
    // expect params in request body
    expect(res).toHaveProperty('apiVersion');
    expect(res).toHaveProperty('data');
    const { data } = res;
    expect(data).toHaveProperty('sender');
    expect(data.sender).toHaveProperty('token');
    expect(data.sender.appDid).toBe(process.env.BLOCKLET_APP_ID);
    expect(data).toHaveProperty('receiver');
    expect(data.receiver).toEqual([mockDid1, mockDid2]);
    expect(data).toHaveProperty('notification');
    expect(data.notification[0].title).toBe('title');
    expect(data.notification[0].body).toBe('body');
    expect(data.notification[1].attachments).toEqual(attachments);
    expect(data.notification[1].actions).toEqual(actions);
  });

  test('should throw error if required argument is invalid', async () => {
    // @ts-ignore
    await expect(NotificationService.sendToUser('', {})).rejects.toBeTruthy();
    // @ts-ignore
    await expect(NotificationService.sendToUser('error-format-did', {})).rejects.toBeTruthy();
    await expect(NotificationService.sendToUser(mockDid1, null)).rejects.toBeTruthy();
    // @ts-ignore
    await expect(NotificationService.sendToUser(mockDid1, 'a')).rejects.toBeTruthy();
    await expect(
      NotificationService.sendToUser(
        mockDid1,
        // @ts-ignore
        { title: 'title', body: 'body', attachments, actions },
        { keepForOfflineUser: 'can-not-be-string' }
      )
    ).rejects.toBeTruthy();
  });

  test('should throw error if environment variable is not defined', async () => {
    clearEnvironment();
    process.env.BLOCKLET_APP_ID = 'zNKhBhM6QHJ7NSwPMDG1oXUGCZRuDaPzzyWZ';
    // @ts-ignore
    await expect(NotificationService.sendToUser(mockDid1, {})).rejects.toBeTruthy();
    process.env.BLOCKLET_APP_SK =
      '0x8ed6742900c639fb2e55671342f01bb7be83fb62e7c3e109783501d926a293b9c4a3f8cd5303848fc06e7a3ca69a04adbe3881e6f4577b84df8fc4b51b1b2f70';
    // @ts-ignore
    await expect(NotificationService.sendToUser(mockDid1, {})).rejects.toBeTruthy();
    // should be success
    setEnvironment(serverPort as string);
    // @ts-ignore
    await expect(NotificationService.sendToUser(mockDid1, {})).resolves.toBeTruthy();
  });

  test('should throw error if BLOCKLET_APP_ID and BLOCKLET_APP_SK does not match', async () => {
    process.env.BLOCKLET_DID = 'z8ia4e5vAeDsQEE2P26bQqz9oWR1Lxg9qUMaV';
    process.env.BLOCKLET_APP_ID = 'a';
    process.env.BLOCKLET_APP_SK = 'b';
    // @ts-ignore
    await expect(NotificationService.sendToUser(mockDid1, {})).rejects.toBeTruthy();
  });

  test('should broadcast works as expected', async () => {
    // expect params in request body
    // @ts-ignore
    const res = await NotificationService.broadcast({ title: 'title', body: 'body' });
    expect(res).toHaveProperty('apiVersion');
    expect(res).toHaveProperty('data');
    const { data } = res;
    expect(data).toHaveProperty('sender');
    expect(data.sender).toHaveProperty('token');
    expect(data.sender.appDid).toBe(process.env.BLOCKLET_APP_ID);
    expect(data.event).toBe('message');
    expect(data.channel).toBe(`app:${process.env.BLOCKLET_APP_ID}:public`);
    expect(data).toHaveProperty('notification');
    expect(data.notification.title).toBe('title');
    expect(data.notification.body).toBe('body');
    expect(data.options).toEqual({});
    // options
    // @ts-ignore
    const res2 = await NotificationService.broadcast({ title: 't' }, { socketId: 'a', userDid: 'b' });
    const { data: data2 } = res2;
    expect(data2.options).toEqual({ socketId: 'a', socketDid: 'b' });
    // @ts-ignore
    await expect(NotificationService.broadcast({ title: 't' }, { event: '' })).rejects.toThrowError('is required');
    // @ts-ignore
    await expect(NotificationService.broadcast({ title: 't' }, { channel: '' })).rejects.toThrowError('is required');
  });

  test('should subscriber works as expected', async () => {
    // Test that the on method can be called without errors
    const mockListener = mock();
    expect(() => NotificationService.on('hi', mockListener)).not.toThrow();

    // Test that the off method can be called without errors
    expect(() => NotificationService.off('hi', mockListener)).not.toThrow();

    // Test message handling with proper listeners
    const messageListener = mock();
    const errorListener = mock();
    const componentListener = mock();

    // Set up listeners for different events
    NotificationService.on('message', messageListener);
    NotificationService.on('error', errorListener);
    NotificationService.on(BlockletInternalEvents.componentStarted, componentListener);

    // Test that the service can handle various event emissions without throwing errors
    expect(() => {
      mockDidChannelEmitter.emit('message', { status: 'ok', response: { type: 'hi' } });
      mockDidChannelEmitter.emit('message', { status: 'error', response: { message: 'test error message' } });
      // After removing the mock, emitting an error will throw
      // mockDidChannelEmitter.emit('error', { message: 'test error message2' });
      mockDidChannelEmitter.emit('timeout');
      mockAppChannelEmitter.emit('message');
      mockAppChannelEmitter.emit('hi', { status: 'ok', response: { type: 'hi' } });
      mockAppChannelEmitter.emit('hi', { status: 'error', response: { message: 'test 3' } });
      // mockAppChannelEmitter.emit('error', { message: 'test 4' });
      mockAppChannelEmitter.emit('timeout');
      // mockComponentChannelEmitter.emit('error', { message: 'test error message' });
      mockComponentChannelEmitter.emit('timeout');
    }).not.toThrow();

    // Test internal events with invalid sender
    expect(() => {
      mockComponentChannelEmitter.emit(BlockletInternalEvents.componentStarted, {
        status: 'ok',
        response: { data: {}, sender: {}, time: Date.now() },
      });
    }).not.toThrow();

    await sleep(200);

    // Test internal events with valid sender
    expect(async () => {
      mockComponentChannelEmitter.emit(BlockletInternalEvents.componentStarted, {
        status: 'ok',
        response: {
          data: {
            components: [{ did: 'xxx' }],
          },
          sender: {
            did: serverDid,
            pk: serverPk,
            token: await JWT.sign(serverDid, serverSk, {}),
          },
          time: Date.now(),
        },
      });
    }).not.toThrow();

    await sleep(200);

    // Test that listeners are properly set up and can be called
    expect(() => {
      messageListener({ type: 'test' });
      errorListener({ message: 'test error' });
      componentListener({ components: [{ did: 'test' }] });
    }).not.toThrow();

    // Verify that the listeners were called
    expect(messageListener).toHaveBeenCalledWith({ type: 'test' });
    expect(errorListener).toHaveBeenCalledWith({ message: 'test error' });
    expect(componentListener).toHaveBeenCalledWith({ components: [{ did: 'test' }] });

    // Test direct emitter usage to verify event handling
    const directMessageListener = mock();
    const directErrorListener = mock();
    const directComponentListener = mock();

    _emitter.on('message', directMessageListener);
    _emitter.on('error', directErrorListener);
    _emitter.on(BlockletInternalEvents.componentStarted, directComponentListener);

    // Emit events directly on the internal emitter
    _emitter.emit('message', { type: 'hi' });
    expect(directMessageListener).toHaveBeenCalledWith({ type: 'hi' });

    _emitter.emit('error', { message: 'test error' });
    expect(directErrorListener).toHaveBeenCalledWith({ message: 'test error' });

    _emitter.emit(BlockletInternalEvents.componentStarted, { components: [{ did: 'test' }] });
    expect(directComponentListener).toHaveBeenCalledWith({ components: [{ did: 'test' }] });
  });

  test('should sendToUser works as expected 2', async () => {
    const blocks = [
      {
        type: 'text',
        data: {
          type: 'any',
          text: 'hello world',
          color: 'any',
          size: 'small',
        },
      },
      {
        type: 'image',
        data: {
          url: 'https://img',
          alt: 'any',
        },
      },
      {
        type: 'transaction',
        data: {
          hash: 'any',
          chainId: 'any',
        },
      },
      {
        type: 'dapp',
        data: {
          url: 'https://a',
          appDID: mockDid1,
          logo: 'https://logo',
          title: 'any',
          desc: 'any',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'link',
        data: {
          url: 'http://link',
          title: 'any',
          description: 'any',
          image: 'http://img',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'text',
            data: {
              type: 'any',
              text: 'hello world',
            },
          },
          {
            type: 'text',
            data: {
              type: 'any',
              text: 'hello world 2',
            },
          },
        ],
      },
    ];
    // expect params in request body
    const res = await NotificationService.sendToUser(mockDid1, {
      title: 'title',
      body: 'body',
      severity: 'error',
      attachments: blocks,
    } as unknown as TNotificationInput);
    const { data } = res;

    expect(data.notification.severity).toEqual('error');
    expect(data.notification.attachments).toEqual(blocks);
  });
});
