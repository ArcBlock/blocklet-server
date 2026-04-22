import { getChainHost } from '../_libs/chain';
import type { ChainId, Locale } from '../types';

function Transaction({
  locale,
  data,
}: {
  locale: Locale;
  data: {
    chainId: ChainId;
    hash: string;
  };
}) {
  const chainHost = getChainHost(data.chainId);
  const url = `https://${chainHost}/explorer/txs/${data.hash}`;

  const title = { zh: '交易详情', en: 'Transaction Details' }[locale] || 'Transaction Details';
  const subTitle = { zh: '交易哈希', en: 'Transaction Hash' }[locale] || 'Transaction Hash';

  return (
    <a
      href={url}
      target="_blank"
      style={{
        margin: '1em 0',
        textDecoration: 'none',
        color: 'initial',
        display: 'block',
      }}>
      <h6 style={{ color: '#a5a5a5', margin: 0 }}>{chainHost}</h6>
      <p style={{ color: '#4598fa', margin: '6px 0' }}>{title}</p>
      <div>
        {subTitle}: {data.hash}
      </div>
    </a>
  );
}

export default Transaction;
