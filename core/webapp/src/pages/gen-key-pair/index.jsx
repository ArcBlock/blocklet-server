import DidConnect from '@arcblock/did-connect-react/lib/Connect';
import { decodeConnectUrl, parseTokenFromConnectUrl } from '@arcblock/did-connect-react/lib/utils';
import Center from '@arcblock/ux/lib/Center';
import { LocaleContext } from '@arcblock/ux/lib/Locale/context';
import Result from '@arcblock/ux/lib/Result';
import { getMaster } from '@arcblock/ux/lib/Util/federated';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme, CircularProgress } from '@mui/material';
import { useMemoizedFn, useReactive } from 'ahooks';
import { useContext, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNodeContext } from '../../contexts/node';
import { useSessionContext } from '../../contexts/session';
import { getWebWalletUrl } from '../../libs/util';
import Fullpage from './full-page';

/**
 * 该页面用于配合 `blocklet connect|init` 命令, 以优化 accessToken/store/developerDid 配置流程
 */
export default function GenKeyPair() {
  const navigate = useNavigate();
  const { t, locale } = useContext(LocaleContext);
  const { api } = useSessionContext();
  const { info } = useNodeContext();
  const webWalletUrl = getWebWalletUrl(info);

  const theme = useTheme();
  const currentState = useReactive({
    ready: false,
    success: false,
    error: null,
    invalidSession: false,
  });

  const master = getMaster();

  // 检查会话状态, 任何导致会话无效的情况都会在 url 附加 invalid 作为 hash (将无效会话状态记录到 url 中)
  const checkSession = () => {
    try {
      const url = new URL(window.location.href);
      if (url.hash.includes('invalid')) {
        currentState.invalidSession = true;
        return;
      }
      const connectUrl = url.searchParams.get('__connect_url__');
      const decoded = decodeConnectUrl(connectUrl);
      const token = parseTokenFromConnectUrl(decoded);
      if (!token) {
        throw new Error();
      }
      currentState.ready = true;
    } catch (e) {
      currentState.invalidSession = true;
      navigate('#invalid', { replace: true });
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => checkSession(), []);

  const handleError = useMemoizedFn(err => {
    currentState.error = err.message;
    navigate('#invalid', { replace: true });
  });

  const handleSuccess = useMemoizedFn(() => {
    currentState.success = true;
  });

  if (currentState.invalidSession) {
    return (
      <Fullpage>
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="error"
          title={t('didConnect.common.invalidSession')}
          description={t('didConnect.common.invalidSessionDesc')}
        />
      </Fullpage>
    );
  }

  if (currentState.error) {
    const description = currentState.error;
    return (
      <Fullpage>
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="error"
          title={t('didConnect.common.connectionError')}
          description={description}
        />
      </Fullpage>
    );
  }

  if (currentState.success) {
    return (
      <Fullpage>
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="info"
          icon={<CheckCircleIcon style={{ color: theme.palette.success.main, fontSize: 72 }} />}
          title={t('didConnect.genKeyPair.success')}
          description={t('didConnect.genKeyPair.successDesc')}
        />
      </Fullpage>
    );
  }

  if (currentState.ready) {
    return (
      <Fullpage key="ready">
        <DidConnect
          className="connect"
          action="gen-key-pair"
          checkFn={api.get}
          checkTimeout={10 * 60 * 1000}
          extraParams={{
            sourceAppPid: master?.appPid,
            forceSwitch: true,
          }}
          saveConnect={false}
          forceConnected={false}
          webWalletUrl={webWalletUrl}
          onSuccess={handleSuccess}
          onError={handleError}
          locale={locale}
          messages={{
            title: t('didConnect.genKeyPair.title'),
            scan: t('didConnect.genKeyPair.scan'),
            confirm: t('auth.confirm'),
            success: t('didConnect.genKeyPair.success'),
          }}
          popup
          open
          hideCloseButton
        />
      </Fullpage>
    );
  }

  return (
    <Center>
      <CircularProgress />
    </Center>
  );
}
