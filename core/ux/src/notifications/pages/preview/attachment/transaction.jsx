import PropTypes from 'prop-types';
import { getChainHost } from '@abtnode/util/lib/notification-preview/chain';
import { useTheme } from '@mui/material';
import { mergeDarkStyle } from '../utils';

TransactionPreview.propTypes = {
  locale: PropTypes.string,
  data: PropTypes.object.isRequired,
};

function TransactionPreview({ locale = 'en', data }) {
  const chainHost = getChainHost(data.chainId);
  const url = `https://${chainHost}/explorer/txs/${data.hash}`;

  const title = { zh: '交易详情', en: 'Transaction Details' }[locale] || 'Transaction Details';
  const subTitle = { zh: '交易哈希', en: 'Transaction Hash' }[locale] || 'Transaction Hash';

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <a
      href={url}
      target="_blank"
      style={mergeDarkStyle(
        {
          textDecoration: 'none',
          color: 'initial',
          display: 'block',
          fontSize: 14,
        },
        isDark
      )}
      onClick={(e) => {
        e.customPreventRedirect = true;
      }}
      rel="noreferrer">
      <h6 style={{ color: theme.palette.text.secondary, margin: 0 }}>{chainHost}</h6>
      <p style={{ color: theme.palette.warning.main, margin: 0 }}>{title}</p>
      <div style={{ wordBreak: 'break-all' }}>
        {subTitle}: {data.hash}
      </div>
    </a>
  );
}

export default TransactionPreview;
