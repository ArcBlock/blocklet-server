import { Heading, Section, Text } from '@react-email/components';
import { ReactNode } from 'react';

import Attachments from './attachments';
import Actions from './actions';
import Activity from './activity';
import { toClickableSpan } from '../_libs/highlight';
import { Locale } from '../types';
import { getH1Style } from '../_libs/style';

function Content({
  title,
  content,
  attachments = [],
  actions = [],
  style = {},
  locale,
  raw = false,
  severity = 'normal',
  body = null,
  activity = null,
  actor = null,
  siteDomain = '',
  userInfo,
  fontFamily,
  h1FontFamily,
}: {
  locale: Locale;
  title?: string;
  content?: string;
  body?: ReactNode;
  attachments?: any[];
  actions?: any[];
  style?: object;
  severity?: 'normal' | 'success' | 'error' | 'warning';
  raw?: boolean | string;
  activity?: any;
  actor?: any;
  siteDomain?: string;
  userInfo?: {
    did?: string;
    fullName?: string;
    email?: string;
  };
  fontFamily?: string;
  h1FontFamily?: string;
}) {
  return (
    <Section style={style}>
      {title ? <Heading style={getH1Style(h1FontFamily || fontFamily)}>{title}</Heading> : null}
      {activity ? (
        <Activity activity={activity} actor={actor} siteDomain={siteDomain} severity={severity} userInfo={userInfo} />
      ) : (
        <>
          {content ? (
            <Text
              className="content"
              style={{ whiteSpace: 'pre-line!important' as 'pre-line' }}
              dangerouslySetInnerHTML={{
                __html: typeof raw === 'string' ? raw : raw ? content : toClickableSpan(content),
              }}></Text>
          ) : null}
          {body}
          <Attachments severity={severity} attachments={attachments} locale={locale} />
        </>
      )}
      <Actions actions={actions} />
    </Section>
  );
}

export default Content;
