import { Heading, Text, Preview } from '@react-email/components';
// @ts-ignore
import { VERIFY_CODE_TTL } from '@abtnode/constant';
import Footer from '../_components/footer';
import Content from '../_components/content';
import Layout from '../_components/layout';
import Header from '../_components/header';
import { AppInfo, Locale, PoweredBy, SignatureConfig, EmailTheme } from '../types';
import VerifyCodeBody from './verify-code-body';
import { contentStyle } from '../_libs/style';

export const KycCodeVerifyEmail = ({
  code,
  appInfo,
  locale = 'en',
  userInfo,
  poweredBy,
  signatureConfig,
  theme,
}: {
  code?: string;
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

  const appName = appInfo.title;
  const ttl = VERIFY_CODE_TTL / 60 / 1000;
  const translations = {
    en: {
      emailTitle: `Verify Your Email for ${appName}`,
      emailHeadline:
        'To ensure the security of your account and enhance your experience, you need to use following code to verify your email, and you will receive a NFT in your DID Wallet upon verification.',
      emailValidCode: `This code is valid for ${ttl} minutes. If you don't want to verify your email, you can ignore this message.`,
      emailWarning: `${appName} will never email you and ask you to disclose your password, credit card, or banking account number.`,
    },
    zh: {
      emailTitle: `验证您在 ${appName} 的邮箱`,
      emailHeadline:
        '为确保您的帐户安全并增强您的体验，您需要使用以下代码验证您的邮箱，并在验证后在您的 DID Wallet 中收到 NFT。',
      emailValidCode: `此代码有效期为 ${ttl} 分钟。如果您不想验证您的邮箱，您可以忽略此消息。`,
      emailWarning: `${appName} 永远不会向您发送电子邮件并要求您披露您的密码、信用卡或银行账户信息。`,
    },
  };
  const translation = translations[locale] || translations.en;

  const subject = `[${appInfo.title}] ${translation.emailTitle}`;

  return (
    <Layout mainStyle={main} subject={subject} theme={theme}>
      <Preview>{subject}</Preview>
      <Header appInfo={appInfo} />
      <Content
        style={contentStyle}
        locale={locale}
        title={translation.emailTitle}
        body={
          <VerifyCodeBody locale={locale} code={code} appName={appInfo.title}>
            <>
              <Text>{translation.emailHeadline}</Text>
              <Heading style={{ textAlign: 'center', margin: '1.1em 0' }}>{code}</Heading>
              <Text>{translation.emailValidCode}</Text>
              <Text>{translation.emailWarning}</Text>
            </>
          </VerifyCodeBody>
        }
        fontFamily={fontFamily}
        h1FontFamily={h1FontFamily}
      />
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

export default KycCodeVerifyEmail;
