import get from 'lodash/get';
import { createHandlers } from '@did-connect/handler';
import Notification, { sendToUser } from '../service/notification';
import Config from '../config';

// whether app web page is in mobile DID wallet
const inMobileWallet = (didwallet: $TSFixMe) => {
  return didwallet && ['ios', 'android'].includes(didwallet.os);
};
const getConnectedDid = (session: $TSFixMe): string => {
  if (session.autoConnect === false) {
    return '';
  }
  if (inMobileWallet(session.didwallet)) {
    return '';
  }
  return get(session, 'previousConnected.userDid', '');
};

const createConnectHandlers = ({
  authenticator,
  storage,
  logger = Config.logger,
  socketPathname,
  sendNotificationFn,
}: $TSFixMe) => {
  const handlers = createHandlers({
    storage,
    authenticator,
    logger,
    socketPathname,
  });
  const originCreateHandler = handlers.handleSessionCreate;
  handlers.handleSessionCreate = async (context) => {
    const session = await originCreateHandler(context);
    const connectedDid = getConnectedDid(session);

    // send notification to wallet to trigger wallet to auto connect
    if (connectedDid) {
      // wallet use check url to check status of the session
      let checkUrl = '';
      try {
        // @ts-expect-error TS(2322) FIXME: Type 'URL' is not assignable to type 'string'.
        checkUrl = new URL((session as $TSFixMe).authUrl);
        (checkUrl as $TSFixMe).pathname = (checkUrl as $TSFixMe).pathname.replace(/\/auth/, '/session');
      } catch (e) {
        checkUrl = '';
        console.error(e);
      }
      const deepLink = new URL('https://abtwallet.io/i/');
      deepLink.searchParams.set('action', 'requestAuth');
      deepLink.searchParams.set('url', encodeURIComponent((session as $TSFixMe).authUrl));
      const message = {
        type: 'connect',
        url: deepLink.href,
      };
      if (checkUrl) {
        (message as $TSFixMe).checkUrl = (checkUrl as $TSFixMe).href;
      }
      // sendNotificationFn maybe custom function so we need params
      const sendFn = sendNotificationFn || sendToUser.bind(Notification);
      sendFn(connectedDid, message, { ...context, session }).catch((err: $TSFixMe) => {
        console.error(err);
      });
    }
    return session;
  };
  return handlers;
};

export { createConnectHandlers };
