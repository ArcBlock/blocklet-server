import { useRef, useLayoutEffect, useEffect, useState, useMemo, useCallback } from 'react';
import { decodeConnectUrl } from '@arcblock/did-connect-react/lib/utils';
import { joinURL } from 'ufo';
import { AuthApps } from '@arcblock/ux/lib/DIDConnect';
import { WELLKNOWN_BLOCKLET_USER_PATH } from '@abtnode/constant';
import { useReactive, useSessionStorageState, useMemoizedFn, useCountDown, useRequest } from 'ahooks';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { getFederatedEnabled } from '@arcblock/ux/lib/Util/federated';
import { Alert, AlertTitle, Box, Typography, useTheme, CircularProgress } from '@mui/material';
import axios from '@abtnode/util/lib/axios';
import Result from '@arcblock/ux/lib/Result';
import Center from '@arcblock/ux/lib/Center';
import { translate } from '@arcblock/ux/lib/Locale/util';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { uniq } from 'lodash';
import { Icon } from '@iconify/react';
import FlashOnOutlineRoundedIcon from '@iconify-icons/material-symbols/flash-on-outline-rounded';
import PersonOutlineRoundedIcon from '@iconify-icons/material-symbols/person-outline-rounded';
import SettingsOutlineRoundedIcon from '@iconify-icons/material-symbols/settings-outline-rounded';
import { useSessionContext } from '../../contexts/session';
import api from '../../libs/api';
import useWindowClose from './hooks/use-window-close';

const userSettingsUrl = joinURL(
  window.location.origin,
  WELLKNOWN_BLOCKLET_USER_PATH,
  'settings#user-center-access-key-setting'
);

const CLOSE_DELAY = 3000;
function GenSimpleAccessKey() {
  const ref = useRef(null);
  const [targetDate, setTargetDate] = useState();

  const [countdown] = useCountDown({ targetDate });
  const { session } = useSessionContext();
  const theme = useTheme();
  const currentState = useReactive({ ready: false, success: false, error: null, invalidSession: false, token: null });
  const [currentUserInfo, setCurrentUserInfo] = useSessionStorageState('currentUserInfo', { defaultValue: null });
  const navigate = useNavigate();
  const { t, locale } = useLocaleContext();
  const [searchParams] = useSearchParams();
  const windowClose = useWindowClose();
  const [, setLoading] = useState(true);
  const [requestAppInfo, setRequestAppInfo] = useState({
    appName: searchParams.get('cli') ? (searchParams.get('appName') ?? t('aigne.cli')) : '',
    appLogo: searchParams.get('cli') ? searchParams.get('appLogo') : '',
  });
  const configState = useRequest(() => {
    return fetch('/.well-known/config/gen-simple-access-key.json').then((res) => res.json());
  });
  const requiredRoles = searchParams.get('required_roles') || '';

  const filterPassports = useMemo(() => {
    const needRoles = requiredRoles.split(',') || [];
    if (needRoles.length === 0) {
      return needRoles;
    }

    const currentRoles = uniq(
      [session.user?.role, (session.user?.passports || []).map((p) => p.role)].flat().filter(Boolean)
    );
    if (currentRoles.length === 0) {
      return currentRoles;
    }

    return needRoles.filter((role) => currentRoles.includes(role.toLocaleLowerCase().trim()));
  }, [session.user, requiredRoles]);
  const filterPassportsStr = filterPassports.join(',');

  const enableActionAuthorizeButton = session.user && requiredRoles ? filterPassports.length > 0 : true;

  const fallbackLocale = 'en';
  const dynamicT = useCallback(
    (key, data) => {
      const result = translate(configState.data?.translations || {}, key, locale, fallbackLocale, data);
      if (result === key) {
        return t(`aigne.${key}`, data);
      }
      return result;
    },
    [locale, configState.data, t]
  );

  const getAppInfo = async () => {
    setLoading(true);

    try {
      const __url__ = searchParams.get('__url__');
      const decoded = __url__ ? decodeConnectUrl(__url__) : null;
      if (!decoded) {
        setLoading(false);
        return;
      }

      const BLOCKLET_JSON_PATH = '__blocklet__.js?type=json';
      const info = new URL(decoded);
      const appUrl = info.origin;

      const { data: blocklet } = await axios.get(joinURL(appUrl, BLOCKLET_JSON_PATH));
      setRequestAppInfo({
        appName: blocklet?.appName,
        appUrl: blocklet?.appUrl,
        appLogo: joinURL(blocklet?.appUrl, blocklet?.appLogo),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.user) {
      setCurrentUserInfo(session.user);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user]);

  const checkSession = () => {
    getAppInfo();

    if (session.user) {
      setCurrentUserInfo(session.user);
    }

    try {
      const url = new URL(window.location.href);
      if (url.hash.includes('invalid')) {
        currentState.invalidSession = true;
        return;
      }

      const __token__ = url.searchParams.get('__token__');
      const token = __token__ ? decodeConnectUrl(__token__) : null;

      // const connectUrl = url.searchParams.get('__connect_url__');
      // const decoded = decodeConnectUrl(connectUrl);
      // const token = parseTokenFromConnectUrl(decoded) || url.searchParams.get('token');

      if (!token) throw new Error('No token');

      currentState.token = token;
      currentState.ready = true;
    } catch (e) {
      currentState.invalidSession = true;
      currentState.error = e.message;
      window.opener?.postMessage({ type: 'connect-aigne-message', error: e.message }, '*');
      navigate('#invalid', { replace: true });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => checkSession(), []);

  const currentAppInfo = window.blocklet;
  const source = searchParams.get('source') || 'Generate Access Key';

  const handleAuthorize = useMemoizedFn(async (done) => {
    try {
      await api.post('/access-key/authorize', { source, sid: currentState.token, requiredRoles: filterPassportsStr });
      currentState.success = true;
      window.opener?.postMessage({ type: 'connect-aigne-message', success: true }, '*');

      if (searchParams.has('closeOnSuccess')) {
        setTargetDate(Date.now() + CLOSE_DELAY);
        setTimeout(() => windowClose(), CLOSE_DELAY);
      }
    } catch (error) {
      console.error(error);
    } finally {
      done();
    }
  });

  const handleConnect = useMemoizedFn(() => {
    session.login();
  });

  const handleCancel = useMemoizedFn(() => {
    window.close();
  });

  useEffect(() => {
    if (session.initialized && !session.user) {
      // 如果当前是站点群，则必须由用户点击后才能触发，不能自动触发
      if (!getFederatedEnabled()) {
        handleConnect();
      }
    }
  }, [session?.user, session?.initialized, handleConnect]);

  useEffect(() => {
    if (!session.open) {
      ref.current?.closeLoading?.();
    }
  }, [session.open]);

  const render = () => {
    if (currentState.error) {
      return (
        <Alert severity="error">
          <AlertTitle>{dynamicT('notAuthorized')}</AlertTitle>
          {currentState.error}
        </Alert>
      );
    }

    if (currentState.success) {
      return (
        <Result
          style={{ backgroundColor: 'transparent' }}
          status="info"
          icon={<CheckCircleIcon style={{ color: theme.palette.success.main, fontSize: 72 }} />}
          title={t('connectCli.success', { source })}
          description={`${t('connectCli.successDesc', { source })} ${searchParams.has('closeOnSuccess') ? t('connectCli.closeDelay', { seconds: Math.ceil(countdown / 1000) }) : ''}`}
        />
      );
    }

    return (
      <Alert severity="info">
        <AlertTitle>
          {dynamicT('accessTips.title', {
            appName: searchParams.get('tipsTitleApp') || currentAppInfo.appName,
          })}
        </AlertTitle>
        {requiredRoles && (
          <Typography component="li" variant="body2">
            {filterPassportsStr
              ? t('aigne.accessTips.switchPassport', { required_roles: filterPassportsStr })
              : t('aigne.accessTips.switchPassportRequired', { required_roles: requiredRoles })}
          </Typography>
        )}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
          }}>
          <Typography component="li" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              component={Icon}
              icon={FlashOnOutlineRoundedIcon}
              fontSize={18}
              sx={{
                color: () => theme.palette.info.main,
              }}
            />
            {dynamicT('accessTips.tips1', { appName: requestAppInfo.appName, accessAppName: currentAppInfo.appName })}
          </Typography>
          <Typography component="li" variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              component={Icon}
              icon={PersonOutlineRoundedIcon}
              fontSize={18}
              sx={{
                color: () => theme.palette.success.main,
              }}
            />
            {dynamicT('accessTips.tips2', { appName: requestAppInfo.appName })}
          </Typography>
          <Typography
            component="li"
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}>
            <Icon icon={SettingsOutlineRoundedIcon} fontSize={18} />
            <Box
              sx={{
                '&>a': {
                  color: 'inherit',
                  textDecoration: 'underline',
                },
              }}
              dangerouslySetInnerHTML={{
                __html: dynamicT('accessTips.tips3', { url: userSettingsUrl, accessAppName: currentAppInfo.appName }),
              }}
            />
          </Typography>
        </Box>
      </Alert>
    );
  };

  if (configState.loading) {
    return (
      <Center>
        <CircularProgress />
      </Center>
    );
  }

  return (
    <AuthApps
      ref={ref}
      session={session}
      requestAppInfo={requestAppInfo}
      currentAppInfo={currentAppInfo}
      userInfo={currentUserInfo}
      onAuthorize={handleAuthorize}
      onConnect={handleConnect}
      onSwitchConnect={session.switchDid}
      onCancel={handleCancel}
      hideAuthorize={!!currentState.error}
      hideSwitchConnect={currentState.success}
      hideButton={currentState.success}
      authorizeText={t('common.connect')}
      onSwitchPassport={session.switchDid}
      slotProps={{
        root: { sx: { width: 500 } },
        ...configState.data?.slotProps,
      }}
      titlePrefix={
        ['aigne.authTitlePrefix'].includes(dynamicT('authTitlePrefix')) ? undefined : dynamicT('authTitlePrefix')
      }
      disableAuthorizeButton={!enableActionAuthorizeButton}>
      {render()}
    </AuthApps>
  );
}

export default GenSimpleAccessKey;
