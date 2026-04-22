import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Dialog from '@arcblock/ux/lib/Dialog';
import Publish from '@abtnode/ux/lib/blocklet/publish';

const url = new URL(window.location.href);
const isDialog = url.searchParams.get('mode') === 'dialog';
const padding = isDialog ? '' : url.searchParams.get('padding') || '';

export default function PublishResource() {
  const { t } = useLocaleContext();
  const { componentDid } = useParams();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const onClose = (event) => {
    event.stopPropagation();
    window.parent.postMessage({ event: 'resourceDialog.close', componentDid }, '*');
  };

  useEffect(() => {
    window.parent.postMessage({ event: 'resourceDialog.loaded', componentDid }, '*');
  }, [componentDid]);

  const core = <Publish padding={padding} initUrl={url} />;

  if (isDialog) {
    return (
      <Dialog
        className="studio-dialog"
        title={t('blocklet.publish.blockletStudio')}
        maxWidth={false}
        fullWidth={false}
        PaperProps={{
          style: isMobile
            ? {
                width: '100%',
                height: window.innerHeight,
              }
            : {
                maxWidth: 1350,
                minWidth: 930,
                width: '80%',
              },
        }}
        onClose={onClose}
        showCloseButton
        disableEscapeKeyDown
        open>
        <Box sx={{ height: '72vh', overflow: 'auto', position: 'relative' }}>{core}</Box>
      </Dialog>
    );
  }

  return core;
}
