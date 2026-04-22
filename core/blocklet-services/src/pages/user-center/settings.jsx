import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useCreation, useMemoizedFn, useRequest } from 'ahooks';
import { Box, Typography } from '@mui/material';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import useBrowser from '@arcblock/react-hooks/lib/useBrowser';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import McpServers from '@abtnode/ux/lib/blocklet/mcp-servers';
import UserSessions from '@abtnode/ux/lib/team/user-session';

import useUserCenter from './use-user-center';
import { sdkClient } from '../../util';
import useMobile from '../../hook/use-mobile';
import ConfigProfile from './components/profile-config';
import Notification from './components/notification';
import ThirdPartyLogin from './components/third-party-login';
import Privacy from './components/privacy';
import DangerZone from './components/danger-zone';
import AccessKey from './components/access-key';

export default function Settings({ onDestroySelf = undefined, userCenterTabs = [] }) {
  const { t } = useLocaleContext();
  const { user, session, isMyself, isOwner } = useUserCenter();

  const browser = useBrowser();
  const isArcSphere = browser.arcSphere;

  const isMobile = useMobile({ key: 'md' });

  const privacyState = useRequest(
    async () => {
      if (user && isMyself) {
        const config = await sdkClient.user.getUserPrivacyConfig({ did: user.did });
        return config;
      }
      return null;
    },
    {
      refreshDeps: [user, isMyself],
      loadingDelay: 300,
    }
  );

  const privacyConfigList = useCreation(() => {
    return userCenterTabs
      .map((item) => ({
        key: item.value,
        name: item.label,
        value: item.protected,
        isPrivate: item.isPrivate,
        followersOnly: item.followersOnly,
      }))
      .filter((x) => !x.isPrivate);
  }, [userCenterTabs]);

  const onSave = useMemoizedFn(async (type) => {
    if (type === 'privacy') {
      await privacyState.runAsync();
      return privacyState.data;
    }
    if (type === 'profile') {
      await session.refresh();
    }
    return null;
  });

  // 支持 hash 锚点定位
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  const tabs = useCreation(() => {
    return [
      !isArcSphere
        ? {
            label: t('userCenter.commonSetting.title'),
            value: 'common',
            content: <ConfigProfile user={user} onSave={onSave} />,
          }
        : undefined,
      {
        label: t('userCenter.notificationManagement'),
        value: 'notification',
        content: <Notification user={user} isMobile={isMobile} />,
      },
      {
        label: t('userCenter.thirdPartyLogin.title'),
        value: 'thirdPartyLogin',
        content: <ThirdPartyLogin user={user} />,
      },
      {
        label: t('common.accessKeys'),
        value: 'accessKeys',
        content: <AccessKey isSelf />,
      },
      {
        label: t('common.mcpServers'),
        value: 'mcpServers',
        content: <McpServers />,
      },
      privacyConfigList.length > 0 && {
        label: t('userCenter.privacyManagement'),
        value: 'privacy',
        content: <Privacy configList={privacyConfigList} onSave={onSave} />,
      },
      {
        label: t('userCenter.sessionManagement'),
        value: 'session',
        content: (
          <UserSessions
            user={user}
            showUser={false}
            getUserSessions={(params) => {
              return sdkClient.userSession.getMyLoginSessions({}, params);
            }}
          />
        ),
      },
      !isOwner && onDestroySelf && typeof onDestroySelf === 'function'
        ? {
            label: t('userCenter.dangerZone.title'),
            value: 'dangerZone',
            content: <DangerZone onDestroySelf={onDestroySelf} />,
            sx: {
              borderColor: 'error.main',
            },
          }
        : null,
    ].filter(Boolean);
  }, [user, privacyConfigList, isMobile, isOwner, onDestroySelf]);

  // type: 'privacy' | 'profile'

  if (!isMyself) {
    return null;
  }

  return (
    <Box
      className="user-center-settings"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        minWidth: {
          md: 500,
        },
        '@media (min-width: 1200px) and (max-width: 1260px)': {
          maxWidth: 750,
        },
        '@media (min-width: 1100px) and (max-width: 1199px)': {
          maxWidth: 650, // 900px - 1199px 之间
        },
        '@media (min-width: 1000px) and (max-width: 1099px)': {
          maxWidth: 600, // 900px - 1199px 之间
        },
        '@media (max-width: 1049px)': {
          maxWidth: '100%', // 600px - 1049px 之间
        },
      }}>
      {tabs.map((tab) => {
        if (!tab) {
          return null;
        }
        return (
          <Box
            id={tab.value}
            key={tab.value}
            sx={mergeSx(
              {
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 2,
                '&:last-child': {
                  mb: 5,
                },
              },
              tab.sx
            )}>
            <Typography
              sx={{
                color: 'text.primary',
                fontWeight: 600,
              }}>
              {tab.label}
            </Typography>
            <Box
              sx={{
                mt: 2.5,
              }}>
              {tab.content}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

Settings.propTypes = {
  onDestroySelf: PropTypes.func,
  userCenterTabs: PropTypes.array,
};
