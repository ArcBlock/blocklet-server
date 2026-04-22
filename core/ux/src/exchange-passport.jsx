/* eslint-disable react/prop-types */
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Spinner from '@mui/material/CircularProgress';
import Center from '@arcblock/ux/lib/Center';
import Toast from '@arcblock/ux/lib/Toast';
import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import Fullpage from '@arcblock/did-connect-react/lib/Connect/fullpage';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';

import wrapLocale from './wrap-locale';
import getSafeUrlWithToast from './util/get-safe-url';

function ExchangePassport({ SessionContext, webWalletUrl, onSuccess }) {
  const { api, session } = useContext(SessionContext);
  const { t, locale } = useLocaleContext();
  const navigate = useNavigate();

  const { searchParams } = new URL(window.location.href);
  const redirect = searchParams.get('redirect');

  const onDone = async (result, decrypt) => {
    onSuccess(result, decrypt);

    await session.refresh();
    Toast.success(t('exchangePassport.success'));

    setTimeout(() => {
      if (redirect) {
        const url = decodeURIComponent(redirect);
        if (url.startsWith(WELLKNOWN_SERVICE_PATH_PREFIX)) {
          navigate(url, { replace: true });
        } else {
          // 假定为内部值，严格限制 allowDomains
          window.location.href = getSafeUrlWithToast(url);
        }
      } else {
        window.location.href = window.env.pathPrefix || window.env.apiPrefix || '/';
      }
    }, 3000);
  };

  const onError = (err) => {
    Toast.error(err.message);
  };

  const extraParams = {};
  const componentId = searchParams.get('componentId');
  if (componentId) {
    extraParams.componentId = componentId;
  }

  if (session.loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  }

  return (
    <Fullpage did={window?.blocklet?.appPid || window?.env?.appPid}>
      <Box
        sx={{
          maxWidth: '100%',
          height: '100%',
        }}>
        <DidConnect
          popup
          open
          className="connect"
          action="exchange-passport"
          checkFn={api.get}
          checkTimeout={10 * 60 * 1000}
          webWalletUrl={webWalletUrl}
          onSuccess={onDone}
          onError={onError}
          locale={locale}
          messages={{
            title: t('exchangePassport.dialog.title'),
            scan: t('exchangePassport.dialog.scan'),
            confirm: t('exchangePassport.dialog.confirm'),
            success: t('exchangePassport.dialog.success'),
          }}
          extraParams={extraParams}
          extraContent={null}
          hideCloseButton
        />
      </Box>
    </Fullpage>
  );
}

export default wrapLocale(ExchangePassport);
