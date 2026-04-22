import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, CircularProgress, GlobalStyles, useMediaQuery } from '@mui/material';
import isUrl from 'is-url';
import { useCreation, useMemoizedFn, useMount, useUnmount } from 'ahooks';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import Center from '@arcblock/ux/lib/Center';
import Toast from '@arcblock/ux/lib/Toast';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { decodeConnectUrl } from '@arcblock/did-connect-react/lib/utils';
import usePassportId from '@abtnode/ux/lib/hooks/use-passport-id';
import { useSecurity } from '@arcblock/did-connect-react/lib/Connect';
import { Helmet } from 'react-helmet';
import { joinURL, withHttp, withHttps, withQuery } from 'ufo';
import getSafeUrlWithToast from '@abtnode/ux/lib/util/get-safe-url';
import { mergeIgnoreEmpty } from '@arcblock/ux/lib/Util';
import { isUndefined, isNil, pick } from 'lodash';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { getBlockletData } from '@arcblock/ux/lib/Util/federated';
import { didConnectColors } from '@arcblock/ux/lib/Colors';
import { useTheme } from '@arcblock/ux/lib/Theme';
import LandingPage from '@arcblock/did-connect-react/lib/Connect/landing-page';
import { gaLoginSuccessHandler } from '@arcblock/did-connect-react/lib/Session/handler';

import { useSessionContext } from '../contexts/session';
import { parseRedirectUrl } from '../util';
import { debug } from '../libs/logger';
import { getBlockletSDK } from '../libs/blocklet-sdk';

const type = 'authorization_response';
const sdk = getBlockletSDK();
const CHANNEL_CODE = 'blocklet:onLogin';
const listenOnLoginChannel = new BroadcastChannel(CHANNEL_CODE);

// 在统一登录环境中，打开此页面时，此页面一定是 master 的域名
// 存在以下几种情况：
// 1. master 自身在登录，最终 master 是向 master 发出 postMessage 或 redirect
// 2. member 在登录，最终 master 可能是向该 member 的任意一个域名发出 postMessage 或 redirect
export default function Connect() {
  const { getPassportId } = usePassportId();
  const { session, connectApi } = useSessionContext();
  const { t, locale } = useLocaleContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { encrypt: _encrypt } = useSecurity();
  const theme = useTheme();

  const browser = useBrowser();

  let parsedParams = {};
  try {
    parsedParams = JSON.parse(decodeURIComponent(decodeConnectUrl(searchParams.get('params'))));
  } catch (err) {
    console.error('parse connect params failed', err);
  }
  const popup = !isNil(searchParams.get('popup'));

  const loginMessages = useCreation(() => {
    const loginConfig = globalThis.blocklet?.settings?.actionConfig?.login;

    return loginConfig?.[locale] || loginConfig?.en;
  }, [globalThis.blocklet?.settings?.actionConfig?.login, locale]);

  const {
    action = 'login',
    passkeyBehavior = 'both', // TODO: this should be decided by the blocklet settings
    // useLocaleContext 会自动读取 query 参数里的 locale 值，不需要自己再处理一次
    // locale,
    extraParams = {},
    messages,
    // FIXME: extraContent 的内容如何传递过来
    // extraContent,
    ...rest
  } = parsedParams;

  useEffect(() => {
    if (extraParams.inviter) {
      window.localStorage.setItem('inviter', extraParams.inviter);
    }
  }, [extraParams.inviter]);

  const redirect = searchParams.get('redirect');
  const openerUrl = searchParams.get('opener');
  const encryptKey = searchParams.get('_ek_');
  // const disableClose = searchParams.get('disableClose');
  extraParams.passportId = getPassportId();
  if (action === 'login' && isUndefined(rest.forceConnected)) {
    rest.forceConnected = false;
  }

  const encrypt = (value) => {
    if (!encryptKey) {
      return value;
    }
    return _encrypt(JSON.stringify(value), encryptKey);
  };

  const mode = useMemo(() => {
    if (redirect || !window.opener) {
      return 'redirect';
    }
    return 'popup';
  }, [redirect]);

  // 此处是要回传给调起 did-connect 的页面
  const sendMessageToOpener = async (data) => {
    const trustedDomains = await sdk.federated.getTrustedDomains();
    if (!openerUrl) {
      // NOTICE: 用于兼容旧版本的 did-connect，获取不到 openerUrl 的情况下只能向所有域名发送一次消息
      trustedDomains.forEach((domain) => {
        window.opener.postMessage(data, withHttps(domain));
        window.opener.postMessage(data, withHttp(domain));
      });
      return;
    }

    // 只需要判断 openerUrl 是不是在目标域名中即可
    const openerURL = new URL(openerUrl);
    if (!trustedDomains.includes(openerURL.hostname)) {
      Toast.error(t('login.invalidOpenerUrl'));
      throw new Error('Invalid login caller');
    }
    window.opener.postMessage(data, openerURL.origin);
  };

  const onSuccess = ({ encrypted = true, ...result }, decrypt, options) => {
    debug('connect page onSuccess', { encrypted, result, options });
    if (encrypted) {
      if (result.sessionToken) result.sessionToken = decrypt(result.sessionToken);
      if (result.csrfToken) result.csrfToken = decrypt(result.csrfToken);
      if (result.refreshToken) result.refreshToken = decrypt(result.refreshToken);
      if (result.visitorId) result.visitorId = decrypt(result.visitorId);
      debug('connect page onSuccess decrypt', { result });
    }

    if (result.visitorId) {
      localStorage.setItem('__visitor_id', result.visitorId);
    }

    const res = {
      type,
      response: result,
      options,
    };

    const fnMap = {
      /**
       * @description 处理登录成功后跳转的逻辑
       */
      redirect: () => {
        debug('connect page onSuccess redirect', result);
        setTimeout(() => {
          gaLoginSuccessHandler();
          if (redirect) {
            const url = decodeURIComponent(redirect);
            const urlInstance = parseRedirectUrl(url);

            // 需要更新的 token 信息
            if (encryptKey) urlInstance.searchParams.set('encrypted', true);
            if (result.sessionToken) urlInstance.searchParams.set('sessionToken', encrypt(result.sessionToken));
            if (result.csrfToken) urlInstance.searchParams.set('csrfToken', encrypt(result.csrfToken));
            if (result.refreshToken) urlInstance.searchParams.set('refreshToken', encrypt(result.refreshToken));
            if (result.visitorId) urlInstance.searchParams.set('visitorId', encrypt(result.visitorId));
            // 需要更新的 cookie 信息
            if (options?.connected_did) urlInstance.searchParams.set('connected_did', options.connected_did);
            if (options?.connected_pk) urlInstance.searchParams.set('connected_pk', options.connected_pk);
            if (options?.connected_app) urlInstance.searchParams.set('connected_app', options.connected_app);
            if (options?.connected_wallet_os)
              urlInstance.searchParams.set('connected_wallet_os', options.connected_wallet_os);
            if (options?.saveConnect) urlInstance.searchParams.set('saveConnect', options.saveConnect);

            listenOnLoginChannel.postMessage({
              // 仅需要通知其他同源页面 token 相关信息，不需要 options 中的信息
              ...pick(result, ['sessionToken', 'refreshToken', 'visitorId']),
            });
            if (isUrl(url)) {
              // 已在 checkRedirect 函数中进行了检查
              window.location.replace(getSafeUrlWithToast(urlInstance.href, { allowDomains: null }));
            } else {
              navigate(`${urlInstance.pathname}${urlInstance.search}`, { replace: true });
            }
          } else {
            window.location.replace(window.env.pathPrefix || '/');
          }
        }, 3_000);
      },
      popup: async () => {
        debug('connect page onSuccess popup', res);
        await sendMessageToOpener(res);
        gaLoginSuccessHandler();

        setTimeout(() => {
          // HACK: 部分手机浏览器在经过钱包客户端操作后，跳回浏览器后，tab 会变为无法使用 window.close() 关闭的状态，需要通过下述方式来关闭标签页
          window.open('about:blank', '_self');
          window.close();
        }, 2000);
      },
    };
    fnMap[mode]();
  };
  const onError = (err) => {
    const res = {
      type,
      error: err.message,
      errorDescription: err.message,
    };
    debug('connect page onError', { res });
    const fnMap = {
      redirect: () => {
        Toast.error(err.message);
      },
      popup: () => {
        sendMessageToOpener(res);
      },
    };
    fnMap[mode]();
  };

  const extraContent = useCreation(() => {
    if (action !== 'login') {
      return null;
    }
    const trustedFactories = window.blocklet?.trustedFactories || [];

    return trustedFactories?.length > 0 ? (
      <Box>
        {t('exchangePassport.tooltip1')}
        <Box
          component={Link}
          key="exchange-passport"
          reloadDocument
          to={withQuery(joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, '/exchange-passport'), {
            redirect: redirect || '/',
          })}
          sx={{
            color: didConnectColors.primary.light,
            '&:hover': {
              textDecoration: 'underline dashed',
            },
          }}>
          {t('exchangePassport.tooltip2')}
        </Box>
        <Box component="ul" sx={{ pl: 1.5 }}>
          {trustedFactories.map((item) => (
            <Box component="li" key={item}>
              {item}
            </Box>
          ))}
        </Box>
      </Box>
    ) : null;
  }, [action]);

  const checkRedirect = useMemoizedFn(async () => {
    if (!redirect) return true;

    let redirectUrlInstance;
    try {
      redirectUrlInstance = new URL(redirect);
    } catch {
      return false;
    }
    let urlInstance;
    try {
      urlInstance = new URL(parsedParams?.baseUrl);
    } catch {
      try {
        urlInstance = new URL(parsedParams?.prefix);
      } catch (err) {
        console.error('baseUrl and prefix are both invalid', err);
      }
    }
    if (urlInstance) {
      let domainAliases = [];
      if (urlInstance.origin === window.location.origin) {
        domainAliases = window.blocklet.domainAliases || [];
      } else {
        const blockletJson = await getBlockletData(urlInstance.origin);
        domainAliases = blockletJson?.domainAliases || [];
      }
      // HACK: 用于兼容非标准端口时的判断
      if (!domainAliases.includes(redirectUrlInstance.hostname)) {
        Toast.error(t('login.invalidRedirectUrl'));
        return false;
      }
    }
    return true;
  });

  const listenOnLogin = useMemoizedFn(() => {
    const url = decodeURIComponent(redirect);
    const urlInstance = parseRedirectUrl(url);

    window.location.replace(getSafeUrlWithToast(urlInstance.href, { allowDomains: null }));
  });

  // TODO: 通过后端控制，是否自动打开登录 modal
  const autoDidConnect = true;
  // const hideCloseButton = !isNil(disableClose);
  // FIXME: 暂时强制不显示关闭按钮
  const hideCloseButton = true;
  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('lg'));

  const handleLogin = useMemoizedFn(async () => {
    const validRedirect = await checkRedirect();
    if (validRedirect && (autoDidConnect || popup || browser.arcSphere)) {
      // HACK: 将登录成功的回调绑定到 window 上，以便 ArcSphere 主动触发登录成功后，进行回调
      // 由于 ArcSphere 的成功回调不会包含 options 信息，所以这里只会有两个参数
      window.temporaryDIDConnectOnSuccess = (result, decrypt) => {
        onSuccess(result, decrypt, {
          // 传递此参数，让后续的步骤通过 session.refresh 获取正确的 connected_xxx 数据，再更新 cookie
          saveConnect: true,
        });
      };
      const mergeMessage = mergeIgnoreEmpty(
        {
          title: t('login.connect.title'),
          scan: t('login.connect.scan'),
          confirm: t('login.connect.confirm'),
          success: t('login.connect.success'),
        },
        loginMessages || {},
        messages || {}
      );
      setTimeout(() => {
        connectApi.open({
          locale,
          action,
          passkeyBehavior,
          extraParams,
          // 以上参数可被 rest 参数覆盖
          ...rest,
          className: 'connect',
          popup: true,
          messages: mergeMessage,
          extraContent,
          useSocket: true,
          allowWallet: ['1', 'true', undefined, null].includes(globalThis.blocklet?.DID_CONNECT_ALLOW_WALLET),
          onSuccess,
          onError,
          hideCloseButton,
        });
      });
    }
  });

  useMount(() => {
    if (autoDidConnect) {
      handleLogin();
    }
    listenOnLoginChannel.addEventListener('message', listenOnLogin);
  }, []);

  useUnmount(() => {
    delete window.temporaryDIDConnectOnSuccess;
    listenOnLoginChannel.removeEventListener('message', listenOnLogin);
    listenOnLoginChannel.close();
  });

  if (session.loading) {
    return (
      <>
        <Helmet>
          <title>DID Connect</title>
        </Helmet>
        <Center>
          <CircularProgress />
        </Center>
      </>
    );
  }

  const titleText = globalThis.blocklet.appName;
  const bodyText = globalThis.blocklet.appDescription;

  return (
    <>
      <Helmet>
        <title>{globalThis.blocklet.appName} | DID Connect</title>
      </Helmet>
      {isMd && !browser.arcSphere ? (
        <GlobalStyles
          styles={{
            '& .did-connect__container-dialog > .MuiBackdrop-root': {
              backgroundColor: `${theme.palette.background.default} !important`,
            },
          }}
        />
      ) : (
        <LandingPage
          did={globalThis.blocklet.appPid}
          title={titleText}
          description={bodyText}
          actions={
            browser.arcSphere ? null : (
              <Button variant="contained" disableElevation color="primary" size="large" onClick={handleLogin}>
                {t('login.login')}
              </Button>
            )
          }
          // TODO: 应用的 termsOfUse 应该放自己的，这里先不配置
        />
      )}
    </>
  );
}
