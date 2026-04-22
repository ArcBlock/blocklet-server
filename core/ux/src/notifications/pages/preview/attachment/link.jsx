import PropTypes from 'prop-types';
import { getImagePath } from '@abtnode/util/lib/notification-preview/util';
import { useTheme, Box, Link } from '@mui/material';
import Img from '@arcblock/ux/lib/Img';
import { getProxyImageUrl } from '../utils';

function LinkPreviewPage({ attachment }) {
  const { data } = attachment;
  const theme = useTheme();
  let host = '';
  try {
    const url = new URL(data.url);
    host = url.host;
  } catch (error) {
    host = data.url;
  }

  return (
    <Link
      target="_blank"
      rel="noopener noreferrer"
      href={data.url}
      className="link"
      style={{ wordBreak: 'break-all' }}
      onClick={(e) => {
        e.customPreventRedirect = true;
      }}>
      {!!host && <span className="url">{host}</span>}
      {!!data.title && (
        <Box className="title" style={{ whiteSpace: 'unset' }}>
          {data.title}
        </Box>
      )}
      {!!data.description && (
        <Box className="description" style={{ whiteSpace: 'unset', color: theme.palette.text.secondary }}>
          {data.description}
        </Box>
      )}
      {!!data.image && (
        <Img
          src={getImagePath(data.image)}
          alt={data.title || ''}
          height={128}
          style={{ borderRadius: '8px', maxWidth: '256px', objectFit: 'cover' }}
          fallback={getProxyImageUrl(getImagePath(data.image))}
        />
      )}
    </Link>
  );
}

LinkPreviewPage.propTypes = {
  attachment: PropTypes.object.isRequired,
};

export default LinkPreviewPage;
