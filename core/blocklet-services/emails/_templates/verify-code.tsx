import { Preview } from '@react-email/components';
import Footer from '../_components/footer';
import Content from '../_components/content';
import Layout from '../_components/layout';
import Header from '../_components/header';
import { AppInfo, Locale, PoweredBy, SignatureConfig, EmailTheme } from '../types';
import VerifyCodeBody from './verify-code-body';
import { contentStyle } from '../_libs/style';

export const VerifyCodeEmail = ({
  code,
  magicLink,
  appInfo,
  locale = 'en',
  userInfo,
  poweredBy,
  signatureConfig,
  theme,
}: {
  code?: string;
  magicLink?: string;
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

  const translations = {
    en: {
      title: `Sign in to ${appInfo.title}`,
    },
    zh: {
      title: `登录 ${appInfo.title}`,
    },
  };

  const translation = translations[locale] || translations.en;

  const subject = `[${appInfo.title}] ${translation.title}`;

  return (
    <Layout mainStyle={main} subject={subject} theme={theme}>
      <Preview>{subject}</Preview>
      <Header appInfo={appInfo} />
      <Content
        style={contentStyle}
        locale={locale}
        title={translation.title}
        body={<VerifyCodeBody locale={locale} code={code} magicLink={magicLink} appName={appInfo.title} />}
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

export default VerifyCodeEmail;
