import { Preview, Section, Text, Heading, Button } from '@react-email/components';
// @ts-ignore
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
// @ts-ignore
import dayjs from '@abtnode/util/lib/dayjs';
import UAParser from 'ua-parser-js';
import Footer from '../_components/footer';
import Layout from '../_components/layout';
import Header from '../_components/header';
import { AppInfo, Locale, PoweredBy, UserSession, SignatureConfig, EmailTheme } from '../types';
import { getH1Style } from '../_libs/style';
import { joinURL } from 'ufo';

const contentWrapperStyle = {
  margin: '0 auto 20px auto',
  backgroundColor: '#ffffff',
  padding: '20px 16px',
};

const deviceCardStyle = {
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
  border: '1px solid #e5e7eb',
};

const deviceInfoRowStyle = {
  paddingBottom: '12px',
};

const deviceInfoLabelStyle = {
  color: '#6b7280',
  fontSize: '14px',
  marginBottom: '6px',
  display: 'block',
  margin: '0',
};

const deviceInfoValueStyle = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '500' as const,
  display: 'block',
  margin: '0',
  marginTop: '4px',
};

export const NewUserSessionEmail = ({
  userSession,
  appInfo,
  locale = 'en',
  userInfo,
  poweredBy,
  signatureConfig,
  theme,
}: {
  userSession: UserSession;
  appInfo: AppInfo;
  locale?: Locale;
  userInfo?: {
    did?: string;
    fullName?: string;
    email?: string;
  };
  poweredBy?: PoweredBy;
  signatureConfig?: SignatureConfig;
  theme?: EmailTheme;
}) => {
  const fontFamily = theme?.typography?.fontFamily || 'HelveticaNeue,Helvetica,Arial,sans-serif';
  const h1FontFamily = theme?.typography?.h1?.fontFamily || fontFamily;

  const main = {
    fontFamily,
  };

  const parser = new UAParser(userSession.ua);
  const device = parser.getDevice();
  const browser = parser.getBrowser();
  const os = parser.getOS();

  const deviceName = device.model || device.type || os.name || 'Unknown Device';
  const browserName = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown Browser';
  const locationInfo = userSession.lastLoginIp;

  const translations = {
    en: {
      title: 'You are logged in on a new device',
      greeting: `Hello, ${userInfo?.fullName || 'User'}`,
      description: 'We detected that your account was logged in on a new device:',
      device: 'Device',
      browser: 'Browser',
      location: 'Location',
      loginTime: 'Time',
      securityNote: 'Security Check:',
      securityTip1: 'If this was you, you can safely ignore this email.',
      securityTip2:
        'If you did not recognize this login activity, please immediately protect your account or contact us.',
      manageButton: 'Manage Sessions',
    },
    zh: {
      title: '你在一个新的设备上登录了',
      greeting: `您好，${userInfo?.fullName || '用户'}`,
      description: '我们检测到您的账户在一个新设备上登录：',
      device: '设备',
      browser: '浏览器',
      location: '位置',
      loginTime: '时间',
      securityNote: '安全提示：',
      securityTip1: '如果这是您本人的操作，您可以忽略此邮件。',
      securityTip2: '如果您不认识此登录活动，请立即保护您的账户或联系我们。',
      manageButton: '管理会话',
    },
  };

  const translation = translations[locale] || translations.en;
  const subject = `[${appInfo.title}] ${translation.title}`;

  const manageSessionUrl = joinURL(appInfo.url, WELLKNOWN_SERVICE_PATH_PREFIX, '/user/settings#session');

  const buttonColor = theme?.palette?.primary?.main || '#1976d2';

  const buttonStyle = {
    backgroundColor: buttonColor,
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500' as const,
    fontSize: '15px',
    display: 'inline-block',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
  };

  return (
    <Layout mainStyle={main} subject={subject} theme={theme}>
      <Preview>{subject}</Preview>
      <Header appInfo={appInfo} />

      <Section style={contentWrapperStyle}>
        {/* Title */}
        <Heading style={getH1Style(h1FontFamily)}>{translation.title}</Heading>

        {/* Greeting */}
        <Text style={{ fontSize: '16px', lineHeight: '24px', margin: '0 0 8px 0' }}>{translation.greeting}</Text>

        {/* Description */}
        <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#666', margin: '0 0 16px 0' }}>
          {translation.description}
        </Text>

        {/* Device Card */}
        <Section style={deviceCardStyle}>
          <table style={{ width: '100%' }}>
            <tbody>
              {/* Device */}
              <tr>
                <td style={deviceInfoRowStyle}>
                  <Text style={deviceInfoLabelStyle}>💻 {translation.device}</Text>
                  <Text style={deviceInfoValueStyle}>{deviceName}</Text>
                </td>
              </tr>

              {/* Browser */}
              <tr>
                <td style={deviceInfoRowStyle}>
                  <Text style={deviceInfoLabelStyle}>🌐 {translation.browser}</Text>
                  <Text style={deviceInfoValueStyle}>{browserName}</Text>
                </td>
              </tr>

              {/* Location */}
              <tr>
                <td style={deviceInfoRowStyle}>
                  <Text style={deviceInfoLabelStyle}>📍 {translation.location}</Text>
                  <Text style={deviceInfoValueStyle}>{locationInfo}</Text>
                </td>
              </tr>

              {/* Time */}
              <tr>
                <td>
                  <Text style={deviceInfoLabelStyle}>🕐 {translation.loginTime}</Text>
                  <Text style={deviceInfoValueStyle}>
                    {dayjs(userSession.updatedAt).utc().format('YYYY-MM-DD HH:mm:ss [UTC]')}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Manage Button */}
        <Section style={{ margin: '16px 0 0 0', textAlign: 'center' as const }}>
          <Button href={manageSessionUrl} style={buttonStyle}>
            {translation.manageButton}
          </Button>
        </Section>

        {/* Security Note */}
        <Text style={{ fontSize: '14px', lineHeight: '22px', color: '#333', margin: '16px 0 0 0' }}>
          <strong>{translation.securityNote}</strong>
          <br />
          {translation.securityTip1}
          <br />
          {translation.securityTip2}
        </Text>
      </Section>

      <Footer
        showCopyright={false}
        poweredBy={poweredBy}
        showBlocklet
        appInfo={appInfo}
        locale={locale}
        userInfo={userInfo}
        signatureConfig={signatureConfig}
        fontFamily={fontFamily}
      />
    </Layout>
  );
};

export default NewUserSessionEmail;
