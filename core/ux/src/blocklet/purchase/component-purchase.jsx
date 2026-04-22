/* eslint-disable react/jsx-one-expression-per-line */
import { useState, useEffect, useImperativeHandle } from 'react';
import { joinURL } from 'ufo';

import { getDisplayName } from '@blocklet/meta/lib/util';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import PropTypes from 'prop-types';
import pWaitFor from 'p-wait-for';

import Toast from '@arcblock/ux/lib/Toast';
import { useNodeContext } from '../../contexts/node';
import { getWebWalletUrl, extractStatusUrlFromNextWorkflow } from '../../util';
import { api as $api, axios } from '../../util/api';

import { commonProps, CustomSelect } from './common';

export function ComponentPurchase({ meta, onCancel, mode, handlePaySuccess = () => {} }) {
  const { t, locale } = useLocaleContext();
  const { info } = useNodeContext();
  const webWalletUrl = getWebWalletUrl(info);
  const [nw, setNw] = useState(null);

  const baseUrl = new URL(meta?.registryUrl).origin;

  const name = getDisplayName({ meta });

  const handleConnectSuccess = async (result, decrypt) => {
    const success = ({ downloadTokenList }) => {
      handlePaySuccess({ downloadTokenList });
    };

    const failure = (errorMessage) => {
      Toast.error(errorMessage);
      onCancel(errorMessage);
    };

    function handleConnectSessionStatus(url) {
      return pWaitFor(
        () => {
          return $api.get(url).then(async ({ data }) => {
            const downloadTokenList = data?.downloadTokenList;
            if (data.status === 'succeed') {
              if (downloadTokenList && downloadTokenList.length) {
                await success({
                  downloadTokenList,
                });
              } else {
                await failure(t('blocklet.component.missDownloadTokenTip'));
                return true;
              }

              return true;
            }

            if (data.status === 'error') {
              console.error('vc error: ', data);
              await failure(data?.error);
              return true;
            }
            return false;
          });
        },
        {
          interval: 1000,
        }
      );
    }

    if (mode === 'purchase' && nw) {
      const { statusUrl } = extractStatusUrlFromNextWorkflow(nw);
      // poll status url, to get download token
      await handleConnectSessionStatus(statusUrl);
    } else {
      await success({
        downloadTokenList: result.downloadTokenList && decrypt(result.downloadTokenList),
      });
    }
  };

  useEffect(() => {
    // only purchase mode has nw
    if (mode === 'purchase') {
      const nextWorkflowUrl = new URL(baseUrl);
      nextWorkflowUrl.pathname = '/api/did/verify-purchase-blocklet/token';
      nextWorkflowUrl.searchParams.set('serverDid', info.did);
      nextWorkflowUrl.searchParams.set('blockletDid', meta?.did);

      try {
        $api.get(nextWorkflowUrl.href).then(({ data }) => {
          const url = `${data.url}`;
          setNw(url);
        });
      } catch (error) {
        console.error('get next workflow url error: ', error);
      }
    }
    return () => {
      setNw(null);
    };
  }, [mode]); // eslint-disable-line

  // If nw does not exist, then connect should not be render
  if (mode === 'purchase' && !nw) {
    return '';
  }

  const modePropsMap = {
    verify: {
      action: 'verify-purchase-blocklet',
      checkFn: axios.create({ baseURL: baseUrl }).get,
      extraParams: {
        serverDid: info.did,
        blockletDid: meta?.did,
      },
      messages: {
        title: t('store.purchase.verify.auth.title', { name }),
        scan: t('store.purchase.verify.auth.scan'),
        confirm: t('store.purchase.verify.auth.confirm'),
        success: t('store.purchase.verify.auth.success'),
      },
    },
    purchase: {
      action: 'acquire-asset',
      checkFn: axios.create({ baseURL: joinURL(baseUrl, '/store') }).get,
      extraParams: {
        factory: meta.nftFactory,
        nw,
      },
      messages: {
        title: t('store.purchase.auth.title', { name }),
        scan: t('store.purchase.auth.scan'),
        confirm: t('store.purchase.auth.confirm'),
        success: (
          <>
            <p>{t('store.purchase.auth.success')}</p>
            <p>{t('blocklet.component.purchaseComponentSecondCheckTip')}</p>
          </>
        ),
      },
    },
  };

  return (
    <DidConnect
      open
      locale={locale}
      popup={false}
      saveConnect={false}
      className="connect"
      baseUrl={baseUrl}
      onSuccess={handleConnectSuccess}
      cancelWhenScanned={onCancel}
      onClose={onCancel}
      checkTimeout={60 * 5000}
      webWalletUrl={webWalletUrl}
      disableClose
      showDownload={false}
      {...modePropsMap[mode]}
    />
  );
}

ComponentPurchase.propTypes = {
  ...commonProps,
  handlePaySuccess: PropTypes.func,
  mode: PropTypes.oneOf(['verify', 'purchase']).isRequired,
};

export default function ComponentPurchaseSelect({ ref = null, mode, ...rest }) {
  const [action, setAction] = useState(mode !== 'both' ? mode : 'verify');
  const [step, setStep] = useState(mode !== 'both' ? 2 : 1);

  const onSelect = (act) => {
    if (act === action) {
      return;
    }

    setAction(act);
  };

  const onNext = () => {
    if (!action) {
      return;
    }
    if (step === 2) {
      return;
    }
    setStep(2);
  };

  // expose the func and activeStep
  useImperativeHandle(ref, () => ({
    onNext,
    getCurrentStep: () => {
      return step;
    },
  }));

  if (step === 1) {
    return (
      <div
        style={{
          maxWidth: 520,
        }}>
        <CustomSelect action={action} onNext={null} onSelect={onSelect} />
      </div>
    );
  }

  return <ComponentPurchase {...rest} mode={action} />;
}

ComponentPurchaseSelect.propTypes = {
  mode: PropTypes.oneOf(['both', 'verify', 'purchase']).isRequired,
  ref: PropTypes.any,
};
