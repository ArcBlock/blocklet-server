import { Box, Typography, useTheme } from '@mui/material';
import PropTypes from 'prop-types';
import { getChainHost, getUrlHost } from '@abtnode/util/lib/notification-preview/chain';
import { remarkStyle, summaryStyle } from '@abtnode/util/lib/notification-preview/style';
import DID from '@arcblock/ux/lib/DID';
import { useCreation } from 'ahooks';
import { mergeDarkStyle } from '../utils';

AssetPreview.propTypes = {
  locale: PropTypes.string,
  data: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['asset', 'vc']),
};

function AssetPreview({ locale = 'en', data, type = 'asset' }) {
  const title = { zh: '接收', en: 'Received' }[locale] || 'Received';
  const from = { zh: '来自', en: 'from' }[locale] || 'from';
  const chainHost = getUrlHost(data.chainHost) || getChainHost(data.chainId);
  const did = data.did || data?.credential?.issuer?.id || ''; // asset || vc
  const url = `https://${chainHost}/explorer/assets/${did}`;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const sx = useCreation(() => ({
    display: 'flex',
    alignItems: 'center',
    rowGap: 2,
    columnGap: 4,
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  }));

  return (
    <Box sx={{ pr: 1 }}>
      <a
        href={url}
        target="_blank"
        style={{
          textDecoration: 'none',
          color: 'initial',
          display: 'block',
        }}
        onClick={(e) => {
          if (type === 'vc') {
            e.preventDefault();
            return;
          }
          e.customPreventRedirect = true;
        }}
        rel="noreferrer">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}>
          <Box sx={sx}>
            <Typography component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {title}
            </Typography>
            <Typography component="div" align="right" style={mergeDarkStyle(summaryStyle, isDark)}>
              +1 Asset
            </Typography>
          </Box>
          {did ? (
            <Box sx={sx}>
              <Typography component="div" style={mergeDarkStyle({ ...remarkStyle, fontSize: 14 }, isDark)}>
                {from}
              </Typography>
              <Box
                sx={{
                  maxWidth: 260,
                  fontSize: 14,
                }}>
                <DID did={did} showQrcode copyable compact responsive locale={locale} />
              </Box>
            </Box>
          ) : null}
        </Box>
      </a>
    </Box>
  );
}

export default AssetPreview;
