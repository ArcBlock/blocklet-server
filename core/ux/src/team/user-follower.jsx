import { useState, useRef, useEffect, useMemo } from 'react';
import { Box, Button, styled, alpha, Skeleton } from '@mui/material';

import { useInfiniteScroll, useInViewport, useRequest, useMemoizedFn } from 'ahooks';
import PropTypes from 'prop-types';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import UserCard from '@arcblock/ux/lib/UserCard';
import { CardType, InfoType } from '@arcblock/ux/lib/UserCard/types';
import { withQuery } from 'ufo';
import { WELLKNOWN_BLOCKLET_USER_PATH } from '@abtnode/constant';
import Empty from '@arcblock/ux/lib/Empty';
import Toast from '@arcblock/ux/lib/Toast';

import { useNodeContext } from '../contexts/node';
import { useSessionContext } from '../contexts/session';
import useMobile from '../hooks/use-mobile';
import { formatError } from '../util';

const PAGE_SIZE = 20;

// 共享的PropTypes定义
const commonProps = {
  currentTab: PropTypes.string.isRequired,
};

const userProps = {
  user: PropTypes.object.isRequired,
  column: PropTypes.number,
};

// 骨架屏用户卡片组件
function SkeletonUserCard() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={16} />
        </Box>
      </Box>
      <Skeleton variant="text" width="40%" height={14} />
    </Box>
  );
}

// 空状态组件
function EmptyState({ currentTab, errorMsg = '' }) {
  const { t } = useLocaleContext();

  const message = useMemo(() => {
    const map = {
      following: t('team.userFollowers.emptyFollowing'),
      followers: t('team.userFollowers.emptyFollowers'),
      invitees: t('team.userFollowers.emptyInvitees'),
    };
    return map[currentTab];
  }, [currentTab, t]);

  return <Empty>{errorMsg || message}</Empty>;
}

EmptyState.propTypes = {
  ...commonProps,
  errorMsg: PropTypes.string,
};

// 用户列表
function UserList({
  user,
  teamDid,
  currentTab,
  column = 2,
  refresh = () => {},
  followed = false,
  showSocialActions = true,
}) {
  const { t, locale } = useLocaleContext();
  const { api } = useNodeContext();
  const { session } = useSessionContext();
  const loadMoreRef = useRef(null);
  const [inViewport] = useInViewport(loadMoreRef);
  const isMobile = useMobile({ key: 'md' });

  const requestFn = {
    following: api.getUserFollowing,
    followers: api.getUserFollowers,
    invitees: api.getUserInvites,
  };

  const {
    data,
    loading,
    loadMore,
    loadingMore,
    reload,
    error: reqError,
  } = useInfiniteScroll(
    async (d) => {
      if (!user?.did) return { list: [], total: 0 };
      const page = d ? Math.ceil(d.list.length / PAGE_SIZE) + 1 : 1;
      const fn = requestFn[currentTab];
      if (!fn) return { list: [], total: 0 };
      const response = await fn({
        input: {
          teamDid,
          userDid: user.did,
          type: currentTab,
          paging: {
            page,
            pageSize: PAGE_SIZE,
          },
        },
      });
      const list = currentTab === 'invitees' ? response?.users : response?.data;
      return { list: list || [], total: response?.paging?.total || 0 };
    },
    {
      reloadDeps: [currentTab, user?.did, followed],
      isNoMore: (d) => {
        if (!d?.list.length) return true;
        return d.list.length >= d?.total;
      },
      onError(error) {
        Toast.error(formatError(error));
      },
    }
  );

  const onFollowCallback = () => {
    try {
      if (currentTab !== 'invitees') {
        reload();
      }
      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const { list: users = [], total = 0 } = data || {};

  const hasMore = users.length < total;

  const handleAvatarClick = useMemoizedFn((item) => {
    if (!item?.did) return;
    const userProfileLink = withQuery(WELLKNOWN_BLOCKLET_USER_PATH, { did: item.did, locale });
    window.open(userProfileLink, '_blank');
  });

  useEffect(() => {
    if (inViewport) {
      loadMore();
    }
  }, [inViewport, loadMore]);

  if (loading) {
    return (
      <Box sx={{ py: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: `repeat(${column}, 1fr)` }, gap: 2 }}>
        {Array.from({ length: 6 }, (_, index) => `skeleton-${currentTab}-${index}`).map((key) => (
          <SkeletonUserCard key={key} />
        ))}
      </Box>
    );
  }

  if (users.length === 0) {
    return <EmptyState currentTab={currentTab} errorMsg={reqError ? formatError(reqError) : ''} />;
  }

  return (
    <Box>
      <Box
        className="user-list"
        sx={{
          px: !isMobile ? 1 : 0,
          py: 2,
          display: 'grid',
          gridTemplateColumns: {
            md: '1fr',
            lg: `repeat(${column}, 1fr)`,
          },
          gap: 2,
        }}>
        {users.map((item) => {
          const _user = currentTab === 'invitees' ? item : item.user;
          if (!_user) return null;

          let did = currentTab === 'following' ? item.userDid : item.followerDid;
          if (currentTab === 'invitees') {
            did = _user.did;
          }
          return (
            <Box className="user-item" key={did}>
              <UserCard
                user={_user}
                showDid
                cardType={CardType.CARD}
                infoType={InfoType.INFO}
                session={session}
                showSocialActions={showSocialActions}
                onAvatarClick={handleAvatarClick}
                onFollowClick={onFollowCallback}
              />
            </Box>
          );
        })}
      </Box>
      {hasMore ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="text" color="primary" onClick={loadMore} ref={loadMoreRef}>
            {loadingMore ? t('common.loading') : t('webhookEndpoint.loadMore')}
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}

UserList.propTypes = {
  ...commonProps,
  ...userProps,
  followed: PropTypes.bool,
};

function Tabs({ data, currentTab, onTabChange, showInvitees = true }) {
  const { t } = useLocaleContext();

  const tabs = [
    {
      label: t('team.userFollowers.following'),
      value: 'following',
      count: data?.following || 0,
    },
    {
      label: t('team.userFollowers.followers'),
      value: 'followers',
      count: data?.followers || 0,
    },
    ...(showInvitees
      ? [
          {
            label: t('team.userFollowers.invitees'),
            value: 'invitees',
            count: data?.invitees || 0,
          },
        ]
      : []),
  ];

  return (
    <Box>
      {tabs.map((tab) => (
        <ButtonTab
          key={tab.value}
          className={currentTab === tab.value ? 'active' : ''}
          onClick={() => onTabChange(tab.value)}>
          {tab.label}
          {tab.count > 0 && (
            <span className="count" style={{ marginLeft: 4 }}>
              ({tab.count > 99 ? '99+' : tab.count})
            </span>
          )}
        </ButtonTab>
      ))}
    </Box>
  );
}

Tabs.propTypes = {
  ...commonProps,
  ...userProps,
  onTabChange: PropTypes.func.isRequired,
};

export default function UserFollowers({
  user,
  teamDid,
  column = 2,
  followed = false,
  showSocialActions = true,
  showInvitees = true,
}) {
  const [currentTab, setCurrentTab] = useState('following');

  const { api } = useNodeContext();

  const isInviteEnabled = useMemo(() => {
    const { settings = {} } = window?.blocklet || {};
    const { invite } = settings;
    return invite && invite.enabled;
  }, []);

  const { data, refresh } = useRequest(
    async () => {
      if (!user?.did) return { following: 0, followers: 0 };
      const response = await api.getUserFollowStats({
        input: {
          teamDid,
          userDids: [user.did],
          options: {
            includeInvitees: showInvitees && isInviteEnabled,
          },
        },
      });
      return response?.data?.[user.did] || { following: 0, followers: 0, invitees: 0 };
    },
    {
      refreshDeps: [user?.did, followed], // 当 followed 发生变化时，需要更新数据
    }
  );

  const onTabChange = (tab) => {
    setCurrentTab(tab);
  };

  return (
    <Box>
      <Tabs
        data={data}
        user={user}
        currentTab={currentTab}
        onTabChange={onTabChange}
        showInvitees={showInvitees && isInviteEnabled}
      />
      <UserList
        column={column}
        user={user}
        key={currentTab}
        currentTab={currentTab}
        teamDid={teamDid}
        followed={followed}
        refresh={refresh}
        showSocialActions={showSocialActions}
      />
    </Box>
  );
}

UserFollowers.propTypes = {
  ...userProps,
  teamDid: PropTypes.string.isRequired,
  followed: PropTypes.bool,
  showInvitees: PropTypes.bool,
};

const ButtonTab = styled(Button)`
  &.MuiButtonBase-root {
    border-radius: 9999px;
    margin-right: 2px;
    padding: 5px 12px;
    line-height: 22px;
    font-size: 13px;
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 400;
    border: 1px solid ${({ theme }) => theme.palette.divider} !important;
  }
  &.active.MuiButtonBase-root,
  &.active.MuiButtonBase-root:hover {
    color: ${({ theme }) => theme.palette.primary.main};
    font-weight: 600;
    background-color: ${({ theme }) => alpha(theme.palette.primary.main, 0.1)};
    border: 1px solid ${({ theme }) => alpha(theme.palette.primary.main, 0.24)} !important;
  }

  &.MuiButtonBase-root:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }
`;

export const ButtonWrapper = styled(Button)`
  color: ${({ theme }) => theme.palette.text.primary};
  font-weight: 500;
  border-color: ${({ theme }) => theme.palette.grey[300]};
  line-height: 1.5;
  &:hover {
    background-color: ${({ theme }) => alpha(theme.palette.primary.main, 0.1)};
  }
`;
