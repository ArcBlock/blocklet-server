import PropTypes from 'prop-types';
import { getImagePath } from '@abtnode/util/lib/notification-preview/util';
import Img from '@arcblock/ux/lib/Img';
import { getProxyImageUrl } from '../utils';

function ImagePreviewPage({ attachment }) {
  const { data } = attachment;
  return (
    <Img
      src={getImagePath(data.url)}
      alt={data.title || ''}
      height={128}
      style={{
        borderRadius: '8px',
        maxWidth: '256px',
        objectFit: 'cover',
      }}
      sx={{
        '.Img-root': {
          height: 256,
        },
      }}
      fallback={getProxyImageUrl(getImagePath(data.url))}
    />
  );
}

ImagePreviewPage.propTypes = {
  attachment: PropTypes.object.isRequired,
};

export default ImagePreviewPage;
