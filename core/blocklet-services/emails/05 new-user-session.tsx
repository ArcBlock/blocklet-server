import { USER_SESSION_STATUS } from '@blocklet/constant';
import NewUserSessionEmail from './_templates/new-user-session';
import { UserSession } from './types';

export default function NewUserSession() {
  const locale = 'en';

  const appInfo = {
    title: 'ArcBlock Site',
    logo: 'https://www.arcblock.io/.well-known/service/blocklet/logo-rect?hash=11236bf',
    url: 'https://www.arcblock.io',
    description: 'This is a demo blocklet for email test only',
    version: '1.0.0',
  };

  const userInfo = {
    email: 'blocklet@arcblock.io',
    fullName: 'Test User',
  };

  const userSession: UserSession = {
    id: '650711d9-c0d2-4eb3-b45a-1c6b3b9f6fb1',
    appPid: 'zNKf2ZJqsZNYrCKUjTCqwVjiPtk8Axq8tqU9',
    userDid: 'z1msHR3wRRZaHQgBpcfb5swAtr7bt8dcsKd',
    visitorId: '8e11ce41-95de-4764-b7f7-12a6f27d584b',
    passportId: 'z2iTvMN7JQtYKKqx28fQxuBYmiGTbaeeQqpgK',
    createdAt: new Date('2025-01-07T01:05:44.943Z'),
    updatedAt: new Date('2025-04-16T08:52:38.901Z'),
    extra: {
      walletOS: 'android',
    },
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36 Edg/135.0.0.0',
    lastLoginIp: '34.96.131.141',
    status: USER_SESSION_STATUS.ONLINE,
    createdByAppPid: '',
  };

  return (
    <NewUserSessionEmail
      userSession={userSession}
      appInfo={appInfo}
      locale={locale}
      userInfo={userInfo}
      poweredBy={{
        name: 'ArcBlock',
        url: 'https://arcblock.io/',
      }}
    />
  );
}
