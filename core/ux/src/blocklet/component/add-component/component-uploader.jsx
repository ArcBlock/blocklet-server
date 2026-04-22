import { lazy, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import noop from 'lodash/noop';
import { styled } from '@mui/material/styles';
import { joinURL } from 'ufo';
import Toast from '@arcblock/ux/lib/Toast';
import { MAX_UPLOAD_FILE_SIZE } from '@abtnode/constant';
import { Box } from '@mui/material';

// eslint-disable-next-line import/no-unresolved
const Uploader = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

const uploadPrefix = '/blocklet/component/upload';

const allowedFileTypes = ['.html', '.htm', '.tgz', '.zip'];
const uploadMaxFileSize = Number(window.env?.maxUploadFileSize) || MAX_UPLOAD_FILE_SIZE; // 500MB
const maxFileSize = uploadMaxFileSize * 1024 * 1024;

export default function ComponentUploader({
  did,
  prefix,
  headers = () => ({}),
  onUploaded = noop,
  open = false,
  onClose = noop,
}) {
  const { t, locale } = useLocaleContext();
  const uploaderRef = useRef(null);

  const onFinish = useCallback(
    (result) => {
      const { status, data } = result;
      if (status === 200) {
        onUploaded(data);
        return;
      }
      Toast.error(t('blocklet.component.addComponentTip.uploadFailed'));
    },
    [onUploaded, t]
  );

  useEffect(() => {
    if (open) {
      uploaderRef.current?.open();
    } else {
      uploaderRef.current?.close();
    }
  }, [open]);

  return (
    <Div id={`component-uploader-${did}`} key={`component-uploader-${did}`}>
      <Uploader
        ref={uploaderRef}
        locale={locale}
        popup
        disableXssAttack
        onUploadFinish={onFinish}
        plugins={[]}
        onClose={onClose}
        installerProps={{ disabled: true }}
        apiPathProps={{
          uploader: joinURL(prefix, uploadPrefix, did),
          disableMediaKitPrefix: true,
          disableMediaKitStatus: true,
        }}
        coreProps={{
          restrictions: {
            allowedFileTypes,
            maxFileSize,
            maxNumberOfFiles: 1,
          },
        }}
        tusProps={{
          headers,
        }}
        dashboardProps={{
          note: t('blocklet.component.addComponentTip.allowedFileTypes', {
            types: allowedFileTypes.map((type) => type.replace('.', '')).join(', '),
          }),
        }}
      />
    </Div>
  );
}

ComponentUploader.propTypes = {
  did: PropTypes.string.isRequired,
  prefix: PropTypes.string.isRequired,
  open: PropTypes.bool,
  headers: PropTypes.func,
  onUploaded: PropTypes.func,
  onClose: PropTypes.func,
};

const Div = styled(Box)`
  .uploader-wrapper {
    display: inline-flex;
    position: relative;
    font-size: 0px;
    overflow: hidden;
    &.enabled {
      cursor: pointer;
    }
    &::after {
      display: none;
    }
    &.enabled::after {
      display: block;
      opacity: 1;
      position: absolute;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      left: 0;
      right: 0;
      height: 2.2em;
      color: white;
      text-align: center;
      font-size: 12px;
      line-height: 2em;
      transition: opacity 0.3s ease;
    }
  }
`;
