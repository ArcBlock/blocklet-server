import VerifyCodeEmail from './_templates/verify-code';

export default function VerifyCode() {
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
  };

  return (
    <VerifyCodeEmail
      code="123456"
      // magicLink="https://example.com"
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
