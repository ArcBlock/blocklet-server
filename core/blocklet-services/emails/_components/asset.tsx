import { Column, Row, Text } from '@react-email/components';
import { Locale } from '../types';
import { getChainHost, getUrlHost } from '../_libs/chain';
import { assetStyle, remarkStyle, summaryStyle, titleStyle } from '../_libs/style';

function Asset({
  locale,
  data,
  type = 'vc',
}: {
  locale: Locale;
  data: {
    did: string;
    chainHost: string;
    chainId?: string;
  };
  type: 'asset' | 'vc';
}) {
  const title = { zh: '接收', en: 'Received' }[locale] || 'Received';
  const chainHost = getUrlHost(data.chainHost) || getChainHost(data.chainId);
  const url = `https://${chainHost}/explorer/assets/${data.did}`;
  return (
    <a
      href={url}
      target="_blank"
      style={{
        ...assetStyle,
        margin: '1em 0',
        textDecoration: 'none',
        color: 'initial',
        display: 'block',
      }}
      onClick={(e) => {
        if (type === 'vc') {
          e.preventDefault();
          return;
        }
      }}>
      <Row style={titleStyle}>
        <Column>{title}</Column>
        <Column align="right" style={summaryStyle}>
          +1 Asset
        </Column>
      </Row>
      <Text style={remarkStyle}>{data.did}</Text>
    </a>
  );
}

export default Asset;
