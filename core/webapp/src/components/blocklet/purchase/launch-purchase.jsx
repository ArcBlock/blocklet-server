/* eslint-disable react/jsx-one-expression-per-line */
import { useState } from 'react';
import { joinURL } from 'ufo';
import axios from 'axios';
import { getDisplayName } from '@blocklet/meta/lib/util';
import Dialog from '@arcblock/ux/lib/Dialog';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';

import { getLaunchAgreementUrl } from '@abtnode/ux/lib/blocklet/util';
import { commonProps, CustomSelect } from '@abtnode/ux/lib/blocklet/purchase/common';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';

import { useNodeContext } from '../../../contexts/node';
import { getWebWalletUrl } from '../../../libs/util';

function defaultHandlePaySuccess(url) {
  setTimeout(() => {
    // 由 did-connect 后端返回，可以信任
    window.location.href = getSafeUrlWithToast(url, { allowDomains: null });
  }, 1000);
}

function LaunchPurchaseDialog({
  meta,
  onCancel,
  handlePaySuccess: handlePaySuccessFn = defaultHandlePaySuccess,
  storeUrl,
}) {
  const { t } = useLocaleContext();
  const { info } = useNodeContext();

  const [action, setAction] = useState('both');
  const [step, setStep] = useState(1);
  const webWalletUrl = getWebWalletUrl(info);
  const launchAddress = getLaunchAgreementUrl(meta, info, storeUrl);

  const onSelect = act => {
    if (act === action) {
      return;
    }

    setAction(act);
  };

  const onNext = () => {
    if (!action) {
      return;
    }
    setStep(2);
    if (action === 'verify') {
      // 由 location.origin 拼接生成，可以信任
      window.location.href = getSafeUrlWithToast(launchAddress);
    }
  };

  const handleClose = (e, reason) => {
    if (reason === 'backdropClick') return;
    onCancel();
  };

  const handlePaySuccess = () => {
    handlePaySuccessFn(launchAddress);
  };

  const name = getDisplayName({ meta });

  if (action === 'purchase' && step === 2) {
    return (
      <DidConnect
        open
        popup
        baseUrl={storeUrl}
        action="acquire-asset"
        checkFn={axios.create({ baseURL: joinURL(storeUrl, '/store') }).get}
        onSuccess={handlePaySuccess}
        onClose={onCancel}
        checkTimeout={60 * 5000}
        extraParams={{ factory: meta.nftFactory }}
        webWalletUrl={webWalletUrl}
        disableClose
        saveConnect={false}
        showDownload={false}
        messages={{
          title: t('store.purchase.auth.title', { name }),
          scan: t('store.purchase.auth.scan'),
          confirm: t('store.purchase.auth.confirm'),
          success: (
            <>
              <Typography gutterBottom>{t('store.purchase.auth.success')}</Typography>
              <Typography variant="subtitle2"> {t('store.purchase.autoLaunch', { name })}</Typography>
            </>
          ),
        }}
      />
    );
  }

  const Wrapper = Dialog;

  return (
    <Wrapper title={t('store.purchase.title', { name })} disableEscapeKeyDown open fullWidth onClose={handleClose}>
      <div style={{ marginBottom: 16 }}>
        <CustomSelect action={action} onNext={onNext} onSelect={onSelect} />
      </div>
    </Wrapper>
  );
}
LaunchPurchaseDialog.propTypes = {
  ...commonProps,
  storeUrl: PropTypes.string.isRequired,
  handlePaySuccess: PropTypes.func,
};

export default LaunchPurchaseDialog;
