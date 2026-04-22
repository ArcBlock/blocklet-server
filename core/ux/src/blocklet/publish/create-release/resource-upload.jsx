import PropTypes from 'prop-types';
import { UNOWNED_DID, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import React, { Suspense, useRef, lazy } from 'react';
import { Stack, Box, Button, Typography } from '@mui/material';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

import Toast from '@arcblock/ux/lib/Toast/index';
import EmptySpinner from '../../../empty-spinner';

const allowedFileExts = ['.zip', '.gz'];
const maxFileSize = 1024 * 1024 * 100; // 100 MB

// eslint-disable-next-line import/no-unresolved
const UploaderComponent = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

export default function ResourceUpload({ app, projectId, readOnly, params, setParams, setParamsErrTip, error }) {
  const { t, locale } = useLocaleContext();

  const uploaderRef = useRef(null);

  const checkCanUpload = () => {
    if (readOnly) {
      return false;
    }
    if (!projectId || projectId === UNOWNED_DID) {
      Toast.error(t('blocklet.publish.errorTip.noFirstDid'));
      return false;
    }
    return true;
  };

  const uploadPrefix = `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/project/${app.meta.did}/${projectId}/resource/upload`;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography gutterBottom>{t('blocklet.publish.resourceUpload')}</Typography>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          flex: 1,
          cursor: readOnly ? 'default' : 'pointer',
        }}>
        {!!params.uploadedResource && (
          <Typography component="a" href={`${uploadPrefix}/params.uploadedResource`}>
            {params.uploadedResource}
          </Typography>
        )}
        {!readOnly && (
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (!checkCanUpload()) {
                return;
              }
              uploaderRef.current?.open();
            }}>
            {params.uploadedResource ? t('common.change') : t('common.upload')}
          </Button>
        )}
      </Stack>
      <Suspense fallback={<EmptySpinner />}>
        <UploaderComponent
          key="uploader-resource"
          ref={uploaderRef}
          locale={locale}
          popup
          onUploadFinish={(result) => {
            setParams({ uploadedResource: result.data.filename });
            setParamsErrTip({ blockletResource: '' });
            uploaderRef.current?.close();
          }}
          plugins={['ImageEditor']}
          installerProps={{ disabled: true }}
          apiPathProps={{
            uploader: uploadPrefix,
            disableMediaKitPrefix: true,
            disableMediaKitStatus: true,
          }}
          coreProps={{
            restrictions: {
              allowedFileExts,
              maxFileSize,
              maxNumberOfFiles: 1,
            },
          }}
        />
      </Suspense>
      {!!error && (
        <Box
          sx={{
            color: 'error.main',
            mt: 1,
            fontSize: 14,
          }}>
          {error}
        </Box>
      )}
    </Box>
  );
}
ResourceUpload.propTypes = {
  app: PropTypes.object.isRequired,
  projectId: PropTypes.string.isRequired,
  readOnly: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired,
  setParams: PropTypes.func.isRequired,
  error: PropTypes.string.isRequired,
  setParamsErrTip: PropTypes.func.isRequired,
};
