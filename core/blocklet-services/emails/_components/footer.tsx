import { resolveURL } from 'ufo';
import { Img, Link, Section, Text } from '@react-email/components';
// @ts-ignore
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import Copyright from './copyright';
import { AppInfo, SignatureConfig, Locale, PoweredBy as IPoweredBy } from '../types';
import PoweredBy from './powered-by';
import { getFooterStyle, getLinkStyle } from '../_libs/style';

function PointDivider() {
  return <span style={{ color: '#757575', fontSize: '12px', fontWeight: 'bold' }}>&nbsp;·&nbsp;</span>;
}

function ContactUs({ signatureConfig, fontFamily }: { signatureConfig: SignatureConfig; fontFamily?: string }) {
  const linkStyle = { ...getLinkStyle(fontFamily), color: '#898989', fontSize: '12px' };
  return (
    <Text style={getFooterStyle(fontFamily)}>
      {signatureConfig.companyName ? (
        <>
          {signatureConfig.companyLink ? (
            <Link href={signatureConfig.companyLink} target="_blank" style={linkStyle}>
              {signatureConfig.companyName}
            </Link>
          ) : (
            signatureConfig.companyName
          )}
          <PointDivider />
        </>
      ) : null}
      {signatureConfig.companyAddress ? (
        <>
          {signatureConfig.companyAddress}
          <PointDivider />
        </>
      ) : null}
      {signatureConfig.supportEmail ? (
        <Link href={`mailto:${signatureConfig.supportEmail}`} style={linkStyle}>
          {signatureConfig.supportEmail}
        </Link>
      ) : null}
    </Text>
  );
}

function Footer({
  showLogo = false,
  showCopyright = false,
  appInfo,
  locale = 'en',
  unsubscribeToken,
  userInfo,
  poweredBy,
  signatureConfig,
  fontFamily,
}: {
  showLogo?: boolean;
  showCopyright?: boolean;
  showBlocklet?: boolean;
  appInfo: AppInfo;
  locale: Locale;
  unsubscribeToken?: string;
  userInfo?: {
    // avatar?: string;
    did?: string;
    fullName?: string;
    email?: string;
  };
  poweredBy?: IPoweredBy;
  signatureConfig?: SignatureConfig;
  fontFamily?: string;
}) {
  const linkStyle = { ...getLinkStyle(fontFamily), color: '#898989', fontSize: '12px' };
  const footerStyle = getFooterStyle(fontFamily);

  const userInfoName = userInfo?.fullName || userInfo?.email;
  const userInfoDescription = userInfo?.did;

  let userInfoContent = userInfoName;
  if (userInfoDescription) {
    userInfoContent += ` <${userInfoDescription}>`;
  }

  const showContactUs =
    signatureConfig?.companyName || signatureConfig?.companyAddress || signatureConfig?.supportEmail;

  function UnsubscribeContent() {
    if (!userInfoContent) {
      return null;
    }
    // @note: Cannot use joinURL here because appInfo.url may contain query strings
    const unsubscribeTokenUrl = resolveURL(
      appInfo.url,
      WELLKNOWN_SERVICE_PATH_PREFIX,
      `/user/unsubscribe?token=${unsubscribeToken}`
    );

    if (locale === 'zh') {
      return (
        <>
          由于您是
          <Link href={appInfo.url} target="_blank" style={linkStyle}>
            {appInfo.title}
          </Link>
          的订阅者或用户，此电子邮件已发送到
          {userInfo?.email ? (
            <Link href={`mailto:${userInfo?.email}`} style={linkStyle}>
              {userInfo?.email}
            </Link>
          ) : (
            userInfoContent
          )}
          。
          {unsubscribeToken ? (
            <>
              如果您不想再收到此类邮件，您可以{' '}
              <Link href={unsubscribeTokenUrl} style={linkStyle} target="_blank">
                退订
              </Link>
              。
            </>
          ) : null}
        </>
      );
    }

    return (
      <>
        This email was sent to{' '}
        {userInfo?.email ? (
          <Link href={`mailto:${userInfo?.email}`} style={linkStyle}>
            {userInfo?.email}
          </Link>
        ) : (
          userInfoContent
        )}{' '}
        as you are a subscriber or a user of{' '}
        <Link href={appInfo.url} target="_blank" style={linkStyle}>
          {appInfo.title}
        </Link>
        .{' '}
        {unsubscribeToken ? (
          <>
            If you'd rather not receive this kind of email, you can{' '}
            <Link href={unsubscribeTokenUrl} style={linkStyle} target="_blank">
              unsubscribe
            </Link>
            .
          </>
        ) : null}
      </>
    );
  }

  return (
    <Section>
      {showLogo && <Img src={appInfo.logo} width="32" height="32" alt={appInfo.title} />}
      {!showContactUs ? null : <ContactUs signatureConfig={signatureConfig} fontFamily={fontFamily} />}
      <Text style={footerStyle}>
        <UnsubscribeContent />
      </Text>
      {poweredBy && <PoweredBy {...poweredBy} fontFamily={fontFamily} />}
      {showCopyright && <Copyright />}
    </Section>
  );
}

export default Footer;
