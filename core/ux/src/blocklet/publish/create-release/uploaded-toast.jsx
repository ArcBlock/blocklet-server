import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { Box, Button, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import getSafeUrlWithToast from '../../../util/get-safe-url';

function UploadedToast({ storeUrl, storeName, published, did = '', version = '' }) {
  const { t } = useLocaleContext();
  const handleOpenUrl = () => {
    window.open(
      getSafeUrlWithToast(
        `${joinURL(storeUrl, did && version ? `/blocklets/${did}/${version}` : '/search?menu=my-blocklets')}`,
        {
          allowDomains: null,
        }
      )
    );
  };
  return (
    <Box>
      <Typography variant="subtitle2">
        {t(published ? 'blocklet.publish.publishToStoreSuccess' : 'blocklet.publish.uploadToStoreSuccess', {
          name: storeName,
        })}
      </Typography>
      <Button size="small" sx={{ mt: 1 }} onClick={handleOpenUrl} variant="contained" color="success">
        {t('common.visitTarget', { name: storeName })}
      </Button>
    </Box>
  );
}

UploadedToast.propTypes = {
  storeName: PropTypes.string.isRequired,
  storeUrl: PropTypes.string.isRequired,
  published: PropTypes.bool.isRequired,
  did: PropTypes.string,
  version: PropTypes.string,
};

export default UploadedToast;
