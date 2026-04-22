import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import SvgIcon from '@mui/material/SvgIcon';
import { joinURL, parseURL, withHttps, withQuery } from 'ufo';
import { useAsyncRetry } from 'react-use';
import NavAppsImg from './nav-apps.svg?react';
import { getLauncherBaseURL } from '../util';

const LAUNCHER_URL = 'https://launcher.arcblock.io';

export const getLauncherUrl = (url) => {
  if (!url) {
    return LAUNCHER_URL;
  }
  const { protocol, host } = parseURL(withHttps(url));
  return `${protocol}//${host}`;
};

/**
 * 如果有 userDid，则需要跳转到对应用户的 launcher 页面
 * 在URL中携带 __did-connect__ 强制使用 userDid 进行登录
 * doc: https://team.arcblock.io/comment/docs/c158aee4-accd-42f4-9ced-6a23f28c00e0/en/8Cdy5q3WfbpjbyXB1_FwfnYA
 * @returns
 */
export const getDidConnectParam = (userDid) => {
  if (!userDid) {
    return {};
  }
  return {
    '__did-connect__': Buffer.from(
      JSON.stringify({
        switchBehavior: 'auto',
        forceConnected: userDid,
        showClose: false,
      }),
      'utf8'
    ).toString('base64'),
  };
};

export default function useExtraNav(launchType, launchUrl = LAUNCHER_URL, userDid = '') {
  const { t } = useLocaleContext();
  const didConnectParam = getDidConnectParam(userDid);

  const { loading, value, error, retry } = useAsyncRetry(async () => {
    if (launchType !== 'serverless') {
      return null;
    }

    const baseUrl = getLauncherUrl(launchUrl);
    const launcherBaseUrl = await getLauncherBaseURL(baseUrl);
    const link = withQuery(joinURL(launcherBaseUrl, '/u/apps'), didConnectParam);

    return {
      text: t('launchBlocklet.nav.myApps'),
      appText: t('launchBlocklet.nav.viewMyApps'),
      link,
      buttonProps: {
        sx: {
          fontSize: '1rem',
        },
      },
      icon: <SvgIcon component={NavAppsImg} fontSize="small" viewBox="0 0 32 32" />,
    };
  }, [launchType, launchUrl, userDid, t]);

  if (launchType !== 'serverless' || value === null) {
    return {};
  }

  if (loading) {
    return { loading: true };
  }

  if (error) {
    return { error, retry };
  }

  return value || {};
}
