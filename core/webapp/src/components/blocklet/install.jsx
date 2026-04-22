/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { isFreeBlocklet } from '@blocklet/meta/lib/util';
import { ActionButton } from '@arcblock/ux/lib/Blocklet';
import useLocalStorage from 'react-use/lib/useLocalStorage';

import { Tooltip } from '@mui/material';
import Spinner from '@mui/material/CircularProgress';
import Button from '@arcblock/ux/lib/Button';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { getLaunchAgreementUrl } from '@abtnode/ux/lib/blocklet/util';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import Toast from '@arcblock/ux/lib/Toast';

import { formatError, getBlockletMetaUrl } from '../../libs/util';
import useBlockletPurchase from '../../hooks/blocklet-purchase';
import Permission from '../permission';
import { LaunchPurchaseDialog } from './purchase';
import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';

export default function InstallButton({ meta, buttonText, storeUrl, isResource = false }) {
  const { t } = useLocaleContext();
  const navigate = useNavigate();
  const { info } = useNodeContext();
  const { api } = useSessionContext();

  const requirePurchase = isFreeBlocklet(meta) === false;

  const [loading, setLoading] = useState(false);
  const { hasPurchased } = useBlockletPurchase(meta.did);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [instantLaunch] = useLocalStorage('instant-blocklet-install', false);
  const [isConnectOpen, setConnectOpen] = useState(false);

  const loadingText = useMemo(() => {
    if (loading) {
      if (requirePurchase) {
        return t('blocklet.status.purchasing');
      }
      return t('blocklet.status.waiting');
    }
    return '';
  }, [loading, t, requirePurchase]);

  const btnTxt = useMemo(() => {
    if (isResource) return t('blocklet.status.resource');
    if (requirePurchase) return buttonText.purchase;
    return buttonText.launch;
  }, [requirePurchase, buttonText, isResource]); // eslint-disable-line

  const onAction = e => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setLoading(true);

      if (requirePurchase) {
        setShowPurchaseDialog(true);
        return;
      }

      if (instantLaunch) {
        setConnectOpen(true);
        return;
      }

      if (!requirePurchase) {
        const url = getLaunchAgreementUrl(meta, info, storeUrl);
        // 由 location.origin 拼接生成，可以信任
        window.location.href = getSafeUrlWithToast(url);
      }
    } catch (err) {
      Toast.error(formatError(err), { autoHideDuration: 5000 });
      console.error('Blocklet installed failed', err);
    } finally {
      setLoading(false);
    }
  };

  const onCancelPurchase = () => {
    setLoading(false);
    setShowPurchaseDialog(false);
  };

  const onEndInstall = result => {
    setLoading(false);
    setConnectOpen(false);

    navigate(`/blocklets/${result.appDid}/components`);
  };

  const onCancelInstall = () => {
    setLoading(false);
    setConnectOpen(false);
  };

  return (
    <>
      <ActionButton>
        <Permission permission="mutate_blocklets">
          {hasPermission => (
            <Tooltip title={isResource ? t('launchBlocklet.error.resourceBlocklet') : ''}>
              <Button
                key={meta.did}
                onClick={onAction}
                size="small"
                sx={{ cursor: isResource ? 'not-allowed' : 'pointer', overflow: 'hidden' }}
                disabled={Boolean(loadingText || !hasPermission)}
                variant="outlined"
                color="primary"
                data-cy="install-blocklet">
                {loadingText ? (
                  <>
                    <Spinner size={16} style={{ marginRight: 3 }} />
                    {loadingText}
                  </>
                ) : (
                  btnTxt
                )}
              </Button>
            </Tooltip>
          )}
        </Permission>
      </ActionButton>

      {(hasPurchased || showPurchaseDialog) && (
        <LaunchPurchaseDialog method="launch" meta={meta} mode="both" onCancel={onCancelPurchase} storeUrl={storeUrl} />
      )}

      {isConnectOpen && (
        <DidConnect
          popup
          open
          forceConnected={false}
          className="launch-from-url-auth"
          action="launch-free-blocklet-by-session"
          checkFn={api.get}
          checkTimeout={5 * 60 * 1000}
          onSuccess={onEndInstall}
          extraParams={{
            title: meta.title,
            blockletMetaUrl: decodeURIComponent(getBlockletMetaUrl(storeUrl, meta.did).trim()),
          }}
          messages={{
            title: t('setup.keyPair.title'),
            scan: t('setup.keyPair.scan'),
            confirm: t('setup.keyPair.confirm'),
            success: t('setup.keyPair.success'),
          }}
          onClose={onCancelInstall}
        />
      )}
    </>
  );
}

InstallButton.propTypes = {
  isResource: PropTypes.bool,
  meta: PropTypes.object.isRequired,
  buttonText: PropTypes.shape({
    purchase: PropTypes.string.isRequired,
    launch: PropTypes.string.isRequired,
  }).isRequired,
  storeUrl: PropTypes.string.isRequired,
};
