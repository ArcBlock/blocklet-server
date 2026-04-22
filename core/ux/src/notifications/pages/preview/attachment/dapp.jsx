import PropTypes from 'prop-types';
import DID from '@arcblock/ux/lib/DID';
import Box from '@mui/material/Box';
import Img from '@arcblock/ux/lib/Img';
import { useTheme } from '@mui/material';
import { mergeDarkStyle, getProxyImageUrl } from '../utils';

DAPPPreview.propTypes = {
  data: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  locale: PropTypes.string,
};

function DAPPPreview({ data, locale = 'en' }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <a
      href={data.url}
      target="_blank"
      style={{
        display: 'flex',
        textDecoration: 'none',
        color: 'initial',
      }}
      onClick={(e) => {
        e.customPreventRedirect = true;
      }}
      rel="noreferrer">
      <Img className="image" src={data.logo} width={50} height={50} alt="" fallback={getProxyImageUrl(data.logo)} />
      <div style={{ flex: 1, marginLeft: '10px' }}>
        <div style={mergeDarkStyle({ marginBottom: '6px' }, isDark)}>{data.title}</div>
        <Box
          sx={{
            maxWidth: 260,
            fontSize: 10,
          }}>
          <DID did={data.appDID} showQrcode copyable compact responsive locale={locale} />
        </Box>
      </div>
    </a>
  );
}

export default DAPPPreview;
