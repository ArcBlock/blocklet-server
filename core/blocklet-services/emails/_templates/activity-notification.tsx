import { Preview } from '@react-email/components';
import Footer from '../_components/footer';
import Content from '../_components/content';
import Layout from '../_components/layout';
import Header from '../_components/header';
import { AppInfo, Locale, PoweredBy, SignatureConfig, EmailTheme } from '../types';
import { contentStyle } from '../_libs/style';

export const ActivityNotificationEmail = ({
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
  activity,
  actor,
  siteDomain,
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
  activity?: any;
  actor?: any;
  siteDomain?: string;
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
        activity={activity}
        title={title}
        content={body}
        actor={actor}
        attachments={attachments}
        actions={actions}
        siteDomain={siteDomain}
        locale={locale}
        severity={severity}
        raw={raw}
        userInfo={userInfo}
        fontFamily={fontFamily}
        h1FontFamily={h1FontFamily}
      />
      <Footer
        showCopyright={false}
        poweredBy={poweredBy}
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

export default ActivityNotificationEmail;
