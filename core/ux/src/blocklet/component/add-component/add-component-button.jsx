/* eslint-disable react/no-unstable-nested-components */
import { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

import SplitButton from '@arcblock/ux/lib/SplitButton';
import AddIcon from '@mui/icons-material/Add';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import LinkIcon from '@mui/icons-material/Link';
import UploadIcon from '@mui/icons-material/Upload';

import ComponentUploader from './component-uploader';
import AddComponentDialog from './add-component-dialog';
import { useNodeContext } from '../../../contexts/node';

import InstallFromUrl from '../../install-from-url';

export default function AddComponentButton({ blocklet, children = null, disabled = false }) {
  const { t } = useLocaleContext();
  const [showDialog, setShowDialog] = useState(false);
  const [installFromUrlParams, setInstallFromUrlParams] = useState({
    show: false,
    params: null,
  });
  const [uploaderParams, setUploaderParams] = useState({
    show: false,
    params: null,
  });
  const { getSessionInHeader, prefix } = useNodeContext();

  const onMenuItemClick = (e) => {
    e.stopPropagation();
    // eslint-disable-next-line no-unused-expressions
    setShowDialog(true);
  };

  const openInstallFromUrl = useCallback(() => {
    setInstallFromUrlParams((x) => ({ ...x, show: true }));
  }, []);

  const handleInstallFromUrlClose = useCallback((clear = false) => {
    if (clear) {
      setInstallFromUrlParams({ params: null, show: false });
    } else {
      setInstallFromUrlParams((x) => ({ ...x, show: false }));
    }
  }, []);

  const openInstallFromUpload = useCallback(() => {
    setUploaderParams({ params: null, show: true });
  }, []);

  const handleUploaded = useCallback((data) => {
    setUploaderParams({ params: { ...data, inStore: false, isUpload: true }, show: false });
    if (data.meta) {
      setShowDialog(true);
    }
  }, []);

  const handleUploaderClose = useCallback((clear = false) => {
    if (clear) {
      setUploaderParams({ params: null, show: false });
    } else {
      setUploaderParams((x) => ({ ...x, show: false }));
    }
  }, []);

  const handleDialogChange = useCallback(
    (open) => {
      setShowDialog(open);
      if (!open) {
        handleInstallFromUrlClose(true);
        handleUploaderClose(true);
      }
    },
    [handleInstallFromUrlClose, handleUploaderClose]
  );

  const menus = useMemo(() => {
    return [
      <SplitButton.Item
        key="add-component-from-url"
        data-cy="add-component-from-url"
        onClick={openInstallFromUrl}
        style={{ fontSize: 14, color: 'primary.main' }}>
        <LinkIcon style={{ fontSize: 16, marginRight: 4 }} />
        {t('blocklet.component.addComponentTip.fromUrl')}
      </SplitButton.Item>,
      <SplitButton.Item
        key="add-component-from-upload"
        data-cy="add-component-from-upload"
        onClick={openInstallFromUpload}
        style={{ fontSize: 14, color: 'primary.main' }}>
        <UploadIcon style={{ fontSize: 16, marginRight: 4 }} />
        {t('blocklet.component.addComponentTip.fromUpload')}
      </SplitButton.Item>,
    ];
  }, [openInstallFromUpload, openInstallFromUrl, t]);

  return (
    <>
      {typeof children === 'function' ? (
        children({ open: onMenuItemClick })
      ) : (
        <SplitButton
          onClick={onMenuItemClick}
          disabled={disabled}
          size="small"
          menuButtonProps={{ 'data-cy': 'add-component-more' }}
          menu={menus}>
          <AddIcon style={{ fontSize: '1.3em', marginRight: 4 }} />
          {t('blocklet.component.add')}
        </SplitButton>
      )}

      <AddComponentDialog
        showDialog={showDialog}
        setShowDialog={handleDialogChange}
        blocklet={blocklet}
        selectedMeta={installFromUrlParams.params?.meta || uploaderParams.params?.meta || null}
        installFromUrlParams={installFromUrlParams.params || uploaderParams.params}
        showFromUrl={false}
      />
      {installFromUrlParams.show ? (
        <InstallFromUrl
          mode="component"
          onCancel={handleInstallFromUrlClose}
          // eslint-disable-next-line no-shadow
          onSuccess={({ meta, inputUrl, inStore, registryUrl }) => {
            setInstallFromUrlParams({
              show: false,
              params: {
                meta,
                inputUrl,
                inStore,
                registryUrl,
              },
            });
            setShowDialog(true);
            // onNext();
          }}
          handleText={{
            title: t('blocklet.component.addComponentTip.fromUrl'),
            confirm: t('blocklet.component.choose'),
          }}
        />
      ) : null}
      <ComponentUploader
        open={uploaderParams.show}
        did={blocklet.meta.did}
        prefix={prefix}
        headers={getSessionInHeader}
        onUploaded={handleUploaded}
        onClose={handleUploaderClose}
      />
    </>
  );
}

AddComponentButton.propTypes = {
  children: PropTypes.any,
  blocklet: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
};
