import get from 'lodash/get';
import { WalletHandlers as Handler } from '@arcblock/did-connect-js';
import Notification, { sendToUser, sendToRelay } from './service/notification';

const noop = () => ({});
const CONNECTED_DID_KEY = 'headers[x-connected-did]';

// whether app web page is in mobile DID wallet
const inMobileWallet = (didwallet: $TSFixMe) => {
  return didwallet && ['ios', 'android'].includes(didwallet.os);
};

class WalletHandlers extends Handler {
  enableConnect: boolean;

  sendNotificationFn: Function;

  sendToRelayFn: Function;

  /**
   * @param {boolean} params.autoConnect enable auto connect to wallet (wallet does not need to scan qr code)
   * @param {boolean} params.connectedDidOnly only current login did or connected did can connect
   * @param {function} [params.sendNotificationFn] use in a non-blocklet environment
   * @param {function} [params.sendToRelayFn]
   */
  constructor({
    autoConnect = true,
    connectedDidOnly = false,
    sendNotificationFn = null,
    sendToRelayFn = null,
    options = {},
    ...opts
  }: any) {
    super({
      options: {
        ...options,
        ...{
          sessionDidKey: autoConnect && connectedDidOnly ? CONNECTED_DID_KEY : options?.sessionDidKey,
        },
      },
      ...opts,
    });
    this.enableConnect = !!autoConnect;
    this.sendNotificationFn = sendNotificationFn || sendToUser.bind(Notification);
    this.sendToRelayFn = sendToRelayFn || sendToRelay.bind(Notification);

    // @ts-ignore
    this.on('updated', (session) => {
      this.sendToRelayFn(session.token, 'updated', session).catch(console.error);
      // NOTICE: If this DID Connect session is linked to another session, broadcast the message to the associated channel as well
      if (session.sourceToken) {
        this.sendToRelayFn(session.sourceToken, 'updated', session).catch(console.error);
      }
    });
  }

  getConnectedDid = ({ req, didwallet, extraParams }: $TSFixMe) => {
    if (['false', false].includes(extraParams?.autoConnect)) {
      return null;
    }
    if (!this.enableConnect) {
      return null;
    }
    if (inMobileWallet(didwallet)) {
      return null;
    }
    return get(req, CONNECTED_DID_KEY);
  };

  attach({ onStart = noop, ...opts }) {
    const realOnStart = async (params: $TSFixMe) => {
      // @ts-expect-error TS(2554) FIXME: Expected 0 arguments, but got 1.
      const extra: any = (await onStart(params)) || {};
      const connectedDid = this.getConnectedDid(params);

      // fill extra
      extra.connectedDid = connectedDid || '';
      extra.saveConnect = this.enableConnect;

      // send notification to wallet to trigger wallet to auto connect
      if (connectedDid) {
        // wallet use check url to check status of the session
        let checkUrl;
        try {
          checkUrl = new URL(decodeURIComponent(new URL(params.deepLink).searchParams.get('url')));
          checkUrl.pathname = checkUrl.pathname.replace(/auth$/, 'status');
        } catch (e) {
          checkUrl = '';
          console.error(e);
        }
        const message: any = {
          type: 'connect',
          url: params.deepLink,
        };
        if (checkUrl) {
          message.checkUrl = checkUrl.href;
        }
        // sendNotificationFn maybe custom function so we need params
        this.sendNotificationFn(connectedDid, message, params).catch((err: any) => {
          console.error(err);
          if (typeof opts.onError === 'function') {
            opts.onError(err);
          }
        });
      }
      return extra;
    };

    // @ts-expect-error TS(2345) FIXME: Argument of type '{ onStart: (params: any) => Prom... Remove this comment to see the full error message
    return super.attach({
      onStart: realOnStart,
      ...opts,
    });
  }
}
export { WalletHandlers };
