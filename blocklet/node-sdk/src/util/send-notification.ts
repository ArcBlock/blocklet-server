import Axios from 'axios';
import pick from 'lodash/pick';
import { NODE_MODES } from '@abtnode/constant';
import { getRelayChannel, getEventBusChannel } from '@blocklet/meta/lib/channel';
import { isEthereumDid, toAddress } from '@arcblock/did';
import { joinURL } from 'ufo';
import { formatError } from '@blocklet/error';
import { WalletObject, fromSecretKey, WalletType } from '@ocap/wallet';
import { types } from '@ocap/mcrypto';

import {
  validateNotification,
  validateReceiver,
  validateOption,
  validateChannelEvent,
  validateEmail,
} from '../validators/index';
import { SERVICE_PREFIX } from './constants';
import { version } from '../version';
import { TNotification, TNotificationInput, TSendOptions } from '../types/notification';
import { getServerHost } from './parse-docker-endpoint';

const axios = Axios.create({ proxy: false });
const VERSION = version; // version of notification sdk
const SERVER_MODE = process.env.ABT_NODE_MODE;
const getRequestHeaders = () => ({ 'User-Agent': `BlockletSDK/${VERSION}` });

export type TNotificationSender = {
  appDid: string;
  wallet?: WalletObject;
  appSk?: string;
  type?: 'server' | 'blocklet';
};

/**
 * Helper function to ensure we have a wallet object
 * If wallet is not provided but appSk is, create wallet from appSk
 */
const ensureWallet = (sender: TNotificationSender): WalletObject => {
  if (sender.wallet) {
    return sender.wallet;
  }

  if (sender.appSk) {
    try {
      let walletType;
      if (isEthereumDid(sender.appDid)) {
        walletType = WalletType({
          role: types.RoleType.ROLE_APPLICATION,
          pk: types.KeyType.ETHEREUM,
          hash: types.HashType.KECCAK,
          address: types.EncodingType.BASE16,
        });
      } else {
        walletType = WalletType({
          role: types.RoleType.ROLE_APPLICATION,
          pk: types.KeyType.ED25519,
          hash: types.HashType.SHA3,
        });
      }
      return fromSecretKey(sender.appSk, walletType);
    } catch {
      throw new Error('Invalid custom blocklet secret key');
    }
  }

  throw new Error('Either wallet or appSk must be provided in sender');
};

/**
 * @param {String|Array} receiver
 * @param {Object} notification
 * @param {{
 *   appDid: String
 *   wallet?: WalletObject
 *   appSk?: string
 * }} sender
 * @param {String|Number} port port of abtnode service endpoint
 * @param {Object} options
 * @returns
 */
const sendToUser = async (
  receiver: string | string[],
  notification: TNotification | TNotificationInput,
  sender: TNotificationSender,
  options: {
    keepForOfflineUser?: boolean;
    locale?: string;
    channels?: ('app' | 'email' | 'push' | 'webhook')[];
    raw?: boolean;
    ttl?: number; // Message TTL in minutes
  } = {},
  pathname: string = 'send-to-user',
  port: string = process.env.ABT_NODE_SERVICE_PORT
) => {
  if (['send-to-user', 'send-to-push-kit', 'send-to-wallet'].includes(pathname)) {
    await validateReceiver(receiver);
  }
  if (pathname === 'send-to-mail') {
    await validateEmail(receiver);
  }

  const opt = pick(options, ['keepForOfflineUser', 'locale', 'channels', 'raw', 'ttl', 'allowUnsubscribe']);
  await validateOption(opt);
  if (SERVER_MODE !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }
  try {
    const wallet = ensureWallet(sender);
    const token = await wallet.signJWT({});

    const { data: res } = await axios.post(
      joinURL(`http://${getServerHost()}:${port}`, SERVICE_PREFIX, 'api', pathname),
      {
        apiVersion: VERSION,
        data: {
          sender: {
            appDid: sender.appDid,
            type: sender.type,
            token,
            componentDid: process.env.BLOCKLET_COMPONENT_DID,
          },
          receiver: Array.isArray(receiver) ? receiver.map(toAddress) : toAddress(receiver),
          notification,
          options: opt,
        },
      },
      {
        timeout: 60 * 1000,
        headers: getRequestHeaders(),
      }
    );
    return res;
  } catch (err: any) {
    console.error(err.response ? err.response.data : err);
    throw new Error(formatError(err));
  }
};

const sendToAppChannel = async (
  channel: string,
  event: string,
  notification: TNotificationInput,
  sender: TNotificationSender,
  options: TSendOptions = {},
  port: string = process.env.ABT_NODE_SERVICE_PORT
) => {
  if (!channel) {
    throw new Error('channel is required');
  }
  if (!event) {
    throw new Error('event is required');
  }
  await validateChannelEvent(event);
  const opt = pick(options, ['socketId', 'userDid']);
  if (opt.userDid) {
    // @ts-expect-error TS(2551) FIXME: Property 'socketDid' does not exist on type 'Pick<... Remove this comment to see the full error message
    opt.socketDid = opt.userDid;
    delete opt.userDid;
  }
  if (SERVER_MODE !== NODE_MODES.DEBUG) {
    await validateNotification(notification);
  }
  try {
    const wallet = ensureWallet(sender);
    const token = await wallet.signJWT({});

    const { data: res } = await axios.post(
      `http://${getServerHost()}:${port}${SERVICE_PREFIX}/api/send-to-app-channel`,
      {
        apiVersion: VERSION,
        data: {
          sender: { appDid: sender.appDid, token },
          channel,
          event,
          notification,
          options: opt,
        },
      },
      {
        timeout: 60 * 1000,
        headers: getRequestHeaders(),
      }
    );
    return res;
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    throw new Error(formatError(err));
  }
};

const sendToRelay = async (
  topic: string,
  event: string,
  data: any,
  sender: TNotificationSender,
  port: string = process.env.ABT_NODE_SERVICE_PORT
) => {
  if (!topic) {
    throw new Error('topic is required');
  }
  if (!event) {
    throw new Error('event is required');
  }
  if (!data) {
    throw new Error('data is required');
  }

  try {
    const wallet = ensureWallet(sender);
    const token = await wallet.signJWT({});

    const { data: res } = await axios.post(
      `http://${getServerHost()}:${port}${SERVICE_PREFIX}/relay/api/send-to-relay-channel`,
      {
        apiVersion: VERSION,
        data: {
          sender: { appDid: sender.appDid, token },
          channel: getRelayChannel(sender.appDid, topic),
          event,
          data,
        },
      },
      {
        timeout: 60 * 1000,
        headers: getRequestHeaders(),
      }
    );
    return res;
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    throw new Error(formatError(err));
  }
};

const sendToEventBus = async (
  event: any,
  sender: TNotificationSender,
  port: string = process.env.ABT_NODE_SERVICE_PORT
) => {
  if (!event) {
    throw new Error('event is required');
  }

  try {
    const wallet = ensureWallet(sender);
    const token = await wallet.signJWT({});

    const { data: res } = await axios.post(
      `http://${getServerHost()}:${port}${SERVICE_PREFIX}/api/send-to-event-bus`,
      {
        apiVersion: VERSION,
        data: {
          sender: { appDid: sender.appDid, token },
          channel: getEventBusChannel(sender.appDid),
          event,
        },
      },
      {
        timeout: 60 * 1000,
        headers: getRequestHeaders(),
      }
    );
    return res;
  } catch (err) {
    console.error(err.response ? err.response.data : err);
    throw new Error(formatError(err));
  }
};

export { sendToUser, sendToAppChannel, sendToRelay, sendToEventBus };

export default {
  sendToUser,
  sendToAppChannel,
  sendToRelay,
  sendToEventBus,
};
