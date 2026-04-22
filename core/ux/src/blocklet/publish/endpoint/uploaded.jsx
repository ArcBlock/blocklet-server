import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import getSafeUrlWithToast from '../../../util/get-safe-url';

function UploadedToast({ endpoint, published }) {
  const { t } = useLocaleContext();

  const handleOpenUrl = () => {
    window.open(getSafeUrlWithToast(`${joinURL(endpoint.url)}`, { allowDomains: null }));
  };

  return (
    <Box>
      <Typography variant="subtitle2">
        {t(
          published
            ? 'blocklet.publish.endpoint.publishToEndpointSuccess'
            : 'blocklet.publish.endpoint.uploadToEndpointSuccess',
          {
            name: endpoint.appName,
          }
        )}
      </Typography>
      <Button size="small" sx={{ mt: 1 }} onClick={handleOpenUrl} variant="contained" color="success">
        {t('common.visitTarget', { name: endpoint.appName })}
      </Button>
    </Box>
  );
}

UploadedToast.propTypes = {
  endpoint: PropTypes.object.isRequired,
  published: PropTypes.bool.isRequired,
};

export default UploadedToast;
