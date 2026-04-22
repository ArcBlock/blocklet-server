/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/naming-convention */
import * as Jwt from '@arcblock/jwt';
import { WsClient } from '@arcblock/ws';
import { BlockletInternalEvents, TeamEvents } from '@blocklet/constant';
import { getAppPublicChannel, getComponentChannel, getEventBusChannel } from '@blocklet/meta/lib/channel';
import { nanoid } from '@blocklet/meta/lib/util';
import Debug from 'debug';
import debounce from 'lodash/debounce';
import { EventEmitter } from 'node:events';

import { TNotification, TNotificationInput, TSendOptions } from '../types/notification';
import { checkBlockletEnvironment } from '../util/check-blocklet-env';
import { SERVICE_PREFIX } from '../util/constants';
import { getServerHost } from '../util/parse-docker-endpoint';
import { sendToAppChannel, sendToRelay, sendToUser } from '../util/send-notification';
import { NOTIFICATION_TYPES } from '../validators/notification';
import { getAccessWallet, getWallet } from '../wallet';

// DID Wallet
//   appDid is always appPermanentId (appPid), not the current appDid of the application
// Channel in Notification Service
//   Both app messageChannel and app publicChannel use appPermanentId as the channel
//   Because appDid in DID Wallet is always appPermanentId
// APP (the code in this file)
//   Should join the channel with appPermanentId
//   For safety, when sending messages, still use appDid as sender

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type $TSFixMe = any;

const debug = Debug('@blocklet/sdk:notification');

let client: InstanceType<typeof WsClient> | null = null;
let connectionToken: string | null = null;
let connectionTokenTimer: NodeJS.Timeout | null = null;
let initPromise: Promise<void> | null = null; // Global Promise to ensure concurrent calls all await the same initialization

const refreshConnectionToken = async (force = false) => {
  // don't refresh token if client is closed
  if (!force && connectionToken === null && connectionTokenTimer === null) {
    return;
  }

  const accessWallet = getAccessWallet();
  connectionToken = await accessWallet.signJWT({});

  // refresh token in 12 hours
  if (connectionTokenTimer) {
    clearTimeout(connectionTokenTimer);
  }
  connectionTokenTimer = setTimeout(
    refreshConnectionToken,
    process.env.NODE_ENV === 'test' ? 1000 * 3 : 1000 * 60 * 60
  );

  console.log('refresh connection token', Jwt.decode(connectionToken));
};
const debouncedRefreshConnectionToken = debounce(refreshConnectionToken, 300);

export const getConnectionToken = () => connectionToken;

export const getSender = () => {
  const wallet = getWallet();
  const accessWallet = getAccessWallet();
  return {
    // appDid is used by the server to identify the blocklet
    appDid: wallet.address,
    // wallet is used for signing on the client side and verification on the server side
    wallet: accessWallet,
  };
};

/**
 *
 * @param {Notification} notification
 * @param {{
 *   keepForOfflineUser: Boolean
 * }} options
 * @returns
 */
// eslint-disable-next-line require-await
const doSendToUser = async (receiver: string | string[], notification: TNotificationInput, options?: TSendOptions) => {
  checkBlockletEnvironment();
  return sendToUser(receiver, notification, getSender(), options, 'send-to-user');
};

// eslint-disable-next-line require-await
const doSendToRelay = async (topic: string, event: string, data: any) => {
  checkBlockletEnvironment();
  return sendToRelay(topic, event, data, getSender());
};

// eslint-disable-next-line require-await
const doSendMail = async (receiver: string | string[], notification: TNotification, options?: TSendOptions) => {
  checkBlockletEnvironment();
  return sendToUser(receiver, notification, getSender(), options, 'send-to-mail');
};

/**
 *
 * @param {Notification} notification
 * @param {{
 *   channel: String
 *   event: String
 *   socketId: String
 *   socketDid: String
 * }} options
 * @returns
 */
// eslint-disable-next-line require-await
export const broadcast = async (notification: TNotificationInput, options: TSendOptions = {}) => {
  checkBlockletEnvironment();
  const sender = getSender();
  const { channel = getAppPublicChannel(sender.appDid) } = options;
  const { event = 'message' } = options;
  return sendToAppChannel(channel, event, notification, sender, options);
};

const noop = () => {};
const emitter = new EventEmitter();
emitter.setMaxListeners(0);
const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(0);
export const _eventBus = new EventEmitter(); // for event bus
_eventBus.setMaxListeners(0);
export const _emitter = emitter; // export internal emitter for testing

const emitError = (error: any) => {
  messageEmitter.emit('error', error);
  emitter.emit('error', error);
};

const ensureErrorListener = () => {
  emitter.on('error', noop);
  messageEmitter.on('error', noop);
  _eventBus.on('error', noop);
};

const joinChannelErrorHandler = (name: string, type: string, emitters?: EventEmitter[]) => async (err: Error) => {
  const msg = `join ${name || 'channel'} ${type || 'error'}${err?.message ? ': ' : ''}${err?.message || ''}`;
  console.error(msg);
  (emitters || [emitter]).forEach((x) => x.emit('error', { message: msg }));

  await debouncedRefreshConnectionToken();
};

const initClient = (): Promise<void> => {
  // If initialization is already in progress, return the same Promise
  if (initPromise) {
    return initPromise;
  }

  if (client) {
    return Promise.resolve();
  }

  initPromise = (async () => {
    try {
      ensureErrorListener();

      const accessWallet = getAccessWallet();
      const componentDid = process.env.BLOCKLET_COMPONENT_DID;
      const appDid = process.env.BLOCKLET_APP_PID;

      const { publicKey: pk } = accessWallet;

      await refreshConnectionToken(true);

      // Build URL with query parameters directly
      const baseUrl = `ws://${getServerHost()}:${process.env.ABT_NODE_SERVICE_PORT}${SERVICE_PREFIX}/websocket`;
      const url = `${baseUrl}?token=${encodeURIComponent(connectionToken)}&pk=${encodeURIComponent(pk)}`;

      client = new WsClient(url, {
        heartbeatIntervalMs: 10 * 1000,
      });
      client.connect();

      const messageChannel = client.channel(accessWallet.address, () => ({ token: connectionToken, pk }));
      const appPublicChannel = client.channel(getAppPublicChannel(appDid), () => ({ token: connectionToken, pk }));
      const componentChannel = client.channel(getComponentChannel(appDid, componentDid), () => ({
        token: connectionToken,
        pk,
        apiKey: process.env.BLOCKLET_COMPONENT_API_KEY,
      }));
      const eventBusChannel = client.channel(getEventBusChannel(appDid), () => ({ token: connectionToken, pk }));

      messageChannel
        .join()
        .receive('error', joinChannelErrorHandler('message channel', 'error', [messageEmitter, emitter]))
        .receive('timeout', joinChannelErrorHandler('message channel', 'timeout', [messageEmitter, emitter]));
      appPublicChannel
        .join()
        .receive('error', joinChannelErrorHandler('app public channel', 'error'))
        .receive('timeout', joinChannelErrorHandler('app public channel', 'timeout'));
      componentChannel
        .join()
        .receive('error', joinChannelErrorHandler('app component channel', 'error'))
        .receive('timeout', joinChannelErrorHandler('app component channel', 'timeout'));
      eventBusChannel
        .join()
        .receive('error', joinChannelErrorHandler('eventbus channel', 'error'))
        .receive('timeout', joinChannelErrorHandler('eventbus channel', 'timeout'));

      messageChannel.on('message', ({ status, response }: $TSFixMe = {}) => {
        debug('messageChannel.on', { status, response });
        if (status === 'ok') {
          messageEmitter.emit(response.type, response);
          if (response.type === NOTIFICATION_TYPES.HI) {
            emitter.emit(response.type, response);
          }
        } else {
          emitError(response);
          console.error('Message channel error', { status, response });
        }
      });

      eventBusChannel.on('event', ({ status, response }: $TSFixMe = {}) => {
        debug('eventBusChannel.on', { status, response });
        if (status === 'ok') {
          // ignore events from self
          if (response.source !== process.env.BLOCKLET_COMPONENT_DID) {
            _eventBus.emit('event', response);
          }
        } else {
          _eventBus.emit('error', response);
          console.error('Event channel error', { status, response });
        }
      });

      [...Object.keys(BlockletInternalEvents), ...Object.keys(TeamEvents)].forEach((key) => {
        const event = BlockletInternalEvents[key] || TeamEvents[key];

        const handler = debounce(async ({ status, response }: $TSFixMe = {}) => {
          debug('componentChannel.on', { event, status, response });
          if (status === 'ok') {
            const { data, sender, time } = response;

            if (!time || new Date(time).getTime() < new Date(process.env.BLOCKLET_START_AT).getTime()) {
              return;
            }

            // verify sender is server
            const tolerance = 600;
            if (!(await Jwt.verify(sender.token, process.env.ABT_NODE_PK, { tolerance }))) {
              const message = `verify sender failed in internal events. event: ${event}, sender: ${JSON.stringify({
                sender,
                decode: Jwt.decode(sender.token),
                now: Date.now(),
                ABT_NODE_PK: process.env.ABT_NODE_PK,
              })}`;
              emitError({ message });
              console.error(message);
              return;
            }

            emitter.emit(event, data);

            // Emit team events to event bus
            if (TeamEvents[key]) {
              _eventBus.emit('event', {
                id: nanoid(),
                time: new Date().toISOString(),
                type: `blocklet.${event}`,
                data: { object: data.user },
              });
            }
          } else {
            emitError(response);
            console.error('Component channel error', { status, response });
          }
        }, 3000);

        componentChannel.on(event, handler);
      });

      appPublicChannel.on(NOTIFICATION_TYPES.HI, ({ status, response }: $TSFixMe = {}) => {
        debug('appPublicChannel.on', { event: NOTIFICATION_TYPES.HI, status, response });
        if (status === 'ok') {
          emitter.emit(NOTIFICATION_TYPES.HI, response);
        } else {
          emitter.emit('error', response);
          console.error('App public channel error', { status, response });
        }
      });
    } catch (err) {
      initPromise = null; // Clear the promise so initialization can be retried
      console.warn('Failed to init notification service', err);
      throw err;
    }
  })();

  return initPromise;
};

export const cleanup = () => {
  try {
    if (connectionTokenTimer) {
      clearTimeout(connectionTokenTimer);
      connectionTokenTimer = null;
    }
    if (client) {
      client.disconnect();
      client = null;
    }
    connectionToken = null;
    initPromise = null;
  } catch (err) {
    console.warn('Failed to cleanup notification service', err);
  }
};

export const ensureClient = async () => {
  if (process.env.BLOCKLET_MODE === 'test') {
    return;
  }
  if (!client) {
    await initClient();
  }
};

export const on = async (event: string, cb?: $TSFixMe) => {
  try {
    await ensureClient();
  } catch (err) {
    console.warn(`Error when subscribing to event: ${event}`, err);
  }

  return emitter.on(event, cb);
};

export const off = emitter.off.bind(emitter);

export const _message = {
  on: async (event: string, cb: $TSFixMe) => {
    try {
      await ensureClient();
    } catch (err) {
      console.warn(`Error when subscribing to message event: ${event}`, err);
    }
    return messageEmitter.on(event, cb);
  },
  off: messageEmitter.off.bind(messageEmitter),
};

export { doSendMail as sendToMail, doSendToRelay as sendToRelay, doSendToUser as sendToUser };

export default {
  sendToUser: doSendToUser,
  sendToRelay: doSendToRelay,
  sendToMail: doSendMail,
  broadcast,
  on,
  off,
  _message,
  initClient,
};
