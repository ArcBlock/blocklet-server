import { Hr, Img, Section, Text } from '@react-email/components';

import Token from './token';
import Asset from './asset';
import Compose from './compose';
import Transaction from './transaction';
import DAPP from './dapp';
import Article from './article';
import { Locale } from '../types';
import { attachmentsStyle, severityColorMap } from '../_libs/style';

function Attachments({
  locale,
  severity = 'normal',
  attachments = [],
}: {
  locale: Locale;
  severity?: 'normal' | 'success' | 'error' | 'warning';
  attachments?: any[];
}) {
  const attachmentList = attachments
    .map((item, index) => {
      switch (item.type) {
        case 'text':
          return item.data.type === 'plain' ? (
            <Text
              key={`${item.type}-${index}`}
              style={{
                color: item.data.color || 'initial',
                fontSize: { small: '12px', normal: '14px', large: '16px' }[(item.data.size as string) || 'normal'],
                whiteSpace: 'pre-line!important' as 'pre-line',
              }}>
              {item.data.text}
            </Text>
          ) : null;
        case 'image':
          return (
            <Img
              key={`${item.type}-${index}`}
              src={item.data.url}
              alt={item.data.alt}
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'contain',
                objectPosition: 'left center',
              }}
            />
          );
        case 'token':
          return <Token key={`${item.type}-${index}`} data={item.data} locale={locale} />;
        case 'transaction':
          return <Transaction key={`${item.type}-${index}`} data={item.data} locale={locale} />;
        case 'dapp':
          return <DAPP key={`${item.type}-${index}`} data={item.data} />;
        case 'link':
          return <Article key={`${item.type}-${index}`} data={item.data} />;
        case 'divider':
          return <Hr key={`${item.type}-${index}`} />;
        case 'vc':
        case 'asset':
          return <Asset type={item.type} key={`${item.type}-${index}`} data={item.data} locale={locale} />;
        case 'section':
          return <Compose key={`${item.type}-${index}`} data={item.fields} />;
        default:
          return null;
      }
    })
    .filter(Boolean);
  return attachmentList.length > 0 ? (
    <Section style={{ ...attachmentsStyle, borderColor: severityColorMap[severity] || severityColorMap.normal }}>
      {attachmentList}
    </Section>
  ) : null;
}

export default Attachments;
