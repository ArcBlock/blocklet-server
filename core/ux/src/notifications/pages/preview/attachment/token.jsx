import PropTypes from 'prop-types';
import { Box, Typography, useTheme } from '@mui/material';
import { getChainHost, getUrlHost } from '@abtnode/util/lib/notification-preview/chain';
import { remarkStyle, summaryStyle } from '@abtnode/util/lib/notification-preview/style';
import DID from '@arcblock/ux/lib/DID';
import { useCreation } from 'ahooks';
import { mergeDarkStyle } from '../utils';

TokenPreview.propTypes = {
  locale: PropTypes.string,
  data: PropTypes.object.isRequired,
};

function TokenPreview({ locale = 'en', data }) {
  const from = { zh: '来自', en: 'from' }[locale] || 'from';
  const title = { zh: '接收', en: 'Received' }[locale] || 'Received';
  const chainHost = getUrlHost(data.chainHost) || getChainHost(data.chainId);
  const url = `https://${chainHost}/explorer/tokens/${data.address}/tx`;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  let v = data.amount;
  if (data.decimal) {
    v = data.amount / 10 ** data.decimal;
  }

  const sx = useCreation(() => ({
    display: 'flex',
    alignItems: 'center',
    rowGap: 2,
    columnGap: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }));

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => {
        e.customPreventRedirect = true;
      }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}>
        <Box sx={sx}>
          <Typography component="div" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            {title}
          </Typography>
          <Typography
            component="div"
            align="right"
            style={mergeDarkStyle(summaryStyle, isDark)}
            sx={{
              flex: 1,
            }}>
            +{v} {data.symbol}
          </Typography>
        </Box>
        <Box sx={sx}>
          <Typography component="div" style={mergeDarkStyle({ ...remarkStyle, fontSize: 14 }, isDark)}>
            {from}
          </Typography>
          <Box
            sx={{
              maxWidth: 260,
              fontSize: 14,
            }}>
            <DID did={data.address} showQrcode copyable compact responsive locale={locale} />
          </Box>
        </Box>
      </Box>
    </a>
  );
}

export default TokenPreview;
