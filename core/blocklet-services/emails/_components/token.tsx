import { Column, Row, Text } from '@react-email/components';
import { fromUnitToToken } from '@ocap/util';
import { Locale } from '../types';
import { getChainHost, getUrlHost } from '../_libs/chain';
import { assetStyle, remarkStyle, summaryStyle, titleStyle } from '../_libs/style';

function Token({
  locale,
  data,
}: {
  locale: Locale;
  data: {
    address: string;
    amount: number;
    symbol: string;
    senderDid: string;
    chainHost: string;
    decimal: number;
    chainId?: string;
  };
}) {
  const showAddress = data.address.slice(0, 4) + '...' + data.address.slice(-4);
  const from = { zh: '来自', en: 'from' }[locale] || 'from';
  const title = { zh: '接收', en: 'Received' }[locale] || 'Received';
  const chainHost = getUrlHost(data.chainHost) || getChainHost(data.chainId);
  const url = `https://${chainHost}/explorer/tokens/${data.address}/tx`;
  const amountV = fromUnitToToken(data.amount, data.decimal);
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
      }}>
      <Row style={titleStyle}>
        <Column>{title}</Column>
        <Column align="right" style={summaryStyle}>
          +{amountV} {data.symbol}
        </Column>
      </Row>
      <Text style={remarkStyle}>
        {from} {showAddress}
      </Text>
    </a>
  );
}

export default Token;
