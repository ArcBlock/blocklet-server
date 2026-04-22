import { UNOWNED_DID } from '@abtnode/constant';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import IOSSwitch from '@arcblock/ux/lib/Switch';
import Toast from '@arcblock/ux/lib/Toast/index';
import { Icon } from '@iconify/react';
import { Box, Button, Typography } from '@mui/material';

import Spinner from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useNodeContext } from '../../../contexts/node';

function ProjectSetting({ did, params, setParams, projectId, open, onClose }) {
  const { t } = useLocaleContext();
  const [loading, setLoading] = useState(false);
  const { api } = useNodeContext();
  const [autoUpload, setAutoUpload] = useState(false);
  const [possibleSameStore, setPossibleSameStore] = useState(false);
  const handleClose = () => {
    setAutoUpload(params.autoUpload);
    setPossibleSameStore(params.possibleSameStore);
    setLoading(false);
    onClose(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.updateProject({
        input: {
          did,
          projectId,
          blockletTitle: params.blockletTitle || '',
          blockletDescription: params.blockletDescription || '',
          blockletIntroduction: params.blockletIntroduction || '',
          autoUpload: !!autoUpload,
          possibleSameStore: !!possibleSameStore,
        },
      });
      setParams({ autoUpload, possibleSameStore });
      onClose(false);
    } catch (err) {
      Toast.error(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    setAutoUpload(params.autoUpload);
    setPossibleSameStore(params.possibleSameStore);
  }, [params]);

  const hasProject = !!(projectId && projectId !== UNOWNED_DID);

  return (
    <Dialog
      title={t('blocklet.publish.projectSettings')}
      disableEscapeKeyDown
      disablePortal={false}
      fullWidth
      open={open}
      onClose={handleClose}
      actions={
        <>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            color="inherit">
            {t('common.cancel')}
          </Button>
          {hasProject && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              color="primary"
              data-cy="install-blocklet-next-step"
              disabled={loading}
              variant="contained"
              autoFocus>
              {loading && <Spinner size={16} />}
              {t('common.confirm')}
            </Button>
          )}
        </>
      }>
      {!hasProject ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box component={Icon} icon="ph:empty" sx={{ fontSize: 40, mb: 3, opacity: 0.6 }} />
          <Typography variant="body1" sx={{ flex: 1 }}>
            {t('blocklet.publish.needProjectId')}
          </Typography>
        </Box>
      ) : (
        <Box component="label" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Box component={Icon} icon="ph:upload" sx={{ fontSize: 24, mr: 2 }} />
            <Typography variant="body1" sx={{ flex: 1 }}>
              {t('blocklet.publish.autoUploadTip')}
            </Typography>
            <IOSSwitch checked={autoUpload} onChange={(_, x) => setAutoUpload(x)} />
          </Box>
          <Box component="label" sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <Box component={Icon} icon="fluent-mdl2:merge-duplicate" sx={{ fontSize: 24, mr: 2 }} />
            <Typography variant="body1" sx={{ flex: 1 }}>
              {t('blocklet.publish.possibleSameStoreTip')}
            </Typography>
            <IOSSwitch checked={possibleSameStore} onChange={(_, x) => setPossibleSameStore(x)} />
          </Box>
        </Box>
      )}
    </Dialog>
  );
}

ProjectSetting.propTypes = {
  did: PropTypes.string.isRequired,
  params: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  setParams: PropTypes.func.isRequired,
  projectId: PropTypes.string.isRequired,
};

export default ProjectSetting;
