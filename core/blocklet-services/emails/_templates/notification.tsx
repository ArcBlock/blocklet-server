import { Preview } from '@react-email/components';
import Footer from '../_components/footer';
import Content from '../_components/content';
import Layout from '../_components/layout';
import Header from '../_components/header';
import { AppInfo, Locale, PoweredBy, SignatureConfig, EmailTheme } from '../types';
import { contentStyle } from '../_libs/style';

export const NotificationEmail = ({
  title,
  body = '',
  raw = false, // do not convert body to clickable span
  subject,
  attachments = [],
  actions = [],
  appInfo,
  locale = 'en',
  severity = 'normal',
  unsubscribeToken,
  userInfo,
  poweredBy,
  signatureConfig,
  theme,
}: {
  title: string;
  body?: string;
  raw?: boolean | string;
  subject: string;
  attachments?: any[];
  actions?: any[];
  appInfo: AppInfo;
  locale?: Locale;
  unsubscribeToken?: string;
  severity?: 'normal' | 'success' | 'error' | 'warning';
  userInfo?: {
    // avatar?: string;
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

  return (
    <Layout mainStyle={main} subject={subject} theme={theme}>
      <Preview>{subject}</Preview>
      <Header appInfo={appInfo} />
      <Content
        style={contentStyle}
        title={title}
        content={body}
        attachments={attachments}
        actions={actions}
        locale={locale}
        severity={severity}
        raw={raw}
        fontFamily={fontFamily}
        h1FontFamily={h1FontFamily}
      />
      <Footer
        showCopyright={false}
        poweredBy={poweredBy}
        showBlocklet
        appInfo={appInfo}
        locale={locale}
        unsubscribeToken={unsubscribeToken}
        userInfo={userInfo}
        signatureConfig={signatureConfig}
        fontFamily={fontFamily}
      />
    </Layout>
  );
};

export default NotificationEmail;
