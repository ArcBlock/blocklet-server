import React, { lazy, useRef } from 'react';
import PropTypes from 'prop-types';
import { joinURL } from 'ufo';
import styled from '@emotion/styled';
import noop from 'lodash/noop';
import Box from '@mui/material/Box';
import classnames from 'classnames';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';

// eslint-disable-next-line import/no-unresolved
const Uploader = lazy(() => import('@blocklet/uploader').then((res) => ({ default: res.Uploader })));

const uploadPrefix = '/blocklet/logo/upload';

const allowedFileExts = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.ico'];

export default function LogoUploader({
  url,
  height = 80,
  width = 'auto',
  enabled = true,
  allowSVG = true,
  type,
  did,
  prefix,
  headers = noop,
  aspectRatio = 1,
  minWidth = 256,
  minHeight = 256,
  onUploaded = noop,
  children = null,
}) {
  const { t, locale } = useLocaleContext();
  const uploaderRef = useRef(null);

  const onOpen = () => {
    uploaderRef.current?.open();
  };

  const onFinish = () => {
    onUploaded();
    uploaderRef.current?.close();
  };

  const uploaderStyle = {
    cursor: enabled ? 'pointer' : 'default',
    '&::after': {
      content: `"${t('common.switch')}"`,
    },
  };

  return (
    <Div id={`uploader-${did}-${type}`} key={`uploader-${did}-${type}`}>
      <Uploader
        ref={uploaderRef}
        locale={locale}
        popup
        onUploadFinish={onFinish}
        plugins={['ImageEditor']}
        installerProps={{ disabled: true }}
        apiPathProps={{
          uploader: joinURL(prefix, uploadPrefix, type, did),
          disableMediaKitPrefix: true,
          disableMediaKitStatus: true,
        }}
        coreProps={{
          restrictions: {
            allowedFileExts: allowSVG ? [...allowedFileExts, '.svg'] : allowedFileExts,
            maxFileSize: 1024 * 1024 * 5,
            maxNumberOfFiles: 1,
          },
        }}
        dashboardProps={{
          autoOpen: 'imageEditor',
        }}
        imageEditorProps={{
          actions: {
            revert: true,
            rotate: true,
            granularRotate: true,
            flip: true,
            zoomIn: true,
            zoomOut: true,
            cropSquare: false,
            cropWidescreen: false,
            cropWidescreenVertical: false,
          },
          cropperOptions: {
            autoCrop: true,
            autoCropArea: 1,
            aspectRatio,
            initialAspectRatio: aspectRatio,
            croppedCanvasOptions: {
              minWidth,
              minHeight,
            },
          },
        }}
        tusProps={{
          headers,
        }}
      />
      {children ? (
        <Box onClick={onOpen}>{children}</Box>
      ) : (
        <Box className={classnames('uploader-wrapper', enabled && 'enabled')} sx={uploaderStyle} onClick={onOpen}>
          <img alt={type} src={url} style={{ width, height }} />
        </Box>
      )}
    </Div>
  );
}

// infer props for Uploader
LogoUploader.propTypes = {
  url: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['square', 'rect', 'favicon', 'splash-portrait', 'splash-landscape', 'og-image']).isRequired,
  did: PropTypes.string.isRequired,
  prefix: PropTypes.string.isRequired,
  headers: PropTypes.func,
  onUploaded: PropTypes.func,
  height: PropTypes.number,
  width: PropTypes.any,
  enabled: PropTypes.bool,
  allowSVG: PropTypes.bool,
  aspectRatio: PropTypes.number,
  minWidth: PropTypes.number,
  minHeight: PropTypes.number,
  children: PropTypes.node,
};

const Div = styled.div`
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
