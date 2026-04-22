import KycCodeVerifyEmail from './_templates/kyc-code-verify';

export default function KysCode() {
  const locale = 'zh';

  const appInfo = {
    title: 'ArcBlock Site',
    logo: 'https://www.arcblock.io/.well-known/service/blocklet/logo-rect?hash=11236bf',
    url: 'https://www.arcblock.io',
    description: 'This is a demo blocklet for email test only',
    version: '1.0.0',
  };

  const userInfo = {
    email: 'blocklet@arcblock.io',
  };

  return (
    <KycCodeVerifyEmail
      code="123456"
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
