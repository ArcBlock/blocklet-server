/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-unstable-nested-components */
import Datatable from '@arcblock/ux/lib/Datatable';
import PropTypes from 'prop-types';
import { useCreation, useMemoizedFn, useMount, useReactive, useRequest } from 'ahooks';
import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import RelativeTime from '@arcblock/ux/lib/RelativeTime';
import { UAParser } from 'ua-parser-js';
import { getVisitorId } from '@arcblock/ux/lib/Util';
import { useConfirm } from '@arcblock/ux/lib/Dialog';
import PQueue from 'p-queue';
import Address from '@arcblock/ux/lib/Address';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { memo, useEffect } from 'react';
import { mergeSx } from '@arcblock/ux/lib/Util/style';
import { USER_SESSION_STATUS } from '@blocklet/constant';

import useMobile from '../../hooks/use-mobile';
import UserSessionInfo from './user-session-info';
import blockletSdk from '../../util/sdk';
// import { ip2Region } from '../../../util'; // 暂时注释掉，待创建后使用

// 临时的 ip2Region 函数，待真实函数创建后替换
const ip2Region = () => {
  // 临时实现，返回空字符串
  return Promise.resolve('');
};

const parseUa = (ua) => {
  const parser = new UAParser(ua, {
    // eslint-disable-next-line no-useless-escape
    browser: [[/(ArcWallet)\/([\w\.]+)/i], [UAParser.BROWSER.NAME, UAParser.BROWSER.VERSION]],
  });
  const result = parser.getResult();
  return result;
};

const textRightStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  textAlign: 'right',
};

const queue = new PQueue({ concurrency: 1 });

const UserSessionIp = memo(({ userSession, isMobile = false }) => {
  const currentState = useReactive({
    loading: true,
    ipRegion: '',
  });

  const { t, locale } = useLocaleContext();

  useEffect(() => {
    queue.add(async () => {
      try {
        currentState.ipRegion = await ip2Region(userSession.lastLoginIp);
      } finally {
        currentState.loading = false;
      }
    });
  }, [currentState, userSession.lastLoginIp]);

  const ipStyle = useCreation(() => {
    return isMobile
      ? {
          display: 'flex',
          justifyContent: 'flex-end',
        }
      : {};
  }, [isMobile]);

  return (
    <Box
      {...(isMobile && {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
        flexWrap: 'wrap',
      })}>
      {currentState.ipRegion ? (
        <>
          <Typography variant="body2">{currentState.ipRegion}</Typography>
          <Address size={16} className="ip-address" style={ipStyle} locale={locale}>
            {userSession.lastLoginIp || t('userCenter.unknown')}
          </Address>
        </>
      ) : (
        <>
          <Address size={16} className="ip-address" style={ipStyle} locale={locale}>
            {userSession.lastLoginIp || t('userCenter.unknown')}
          </Address>
          {currentState.loading ? (
            <Typography variant="body2" color="grey" sx={{ textAlign: 'center' }}>
              <CircularProgress size={12} color="inherit" />
            </Typography>
          ) : null}
        </>
      )}
    </Box>
  );
});

UserSessionIp.propTypes = {
  userSession: PropTypes.object.isRequired,
  isMobile: PropTypes.bool,
};

UserSessionIp.defaultProps = {
  isMobile: false,
};

function UserSessions({ user, showAction = true, showUser = true, getUserSessions, showOffline = false }) {
  const filterParams = useReactive({
    status: USER_SESSION_STATUS.ONLINE,
    page: 1,
    pageSize: 10,
  });
  const userSessionsCountMap = useReactive({
    [USER_SESSION_STATUS.ONLINE]: 0,
    [USER_SESSION_STATUS.EXPIRED]: 0,
    [USER_SESSION_STATUS.OFFLINE]: 0,
  });
  const currentVisitorId = getVisitorId();
  const { t, locale } = useLocaleContext();
  const isMobile = useMobile({ key: 'md' });
  const isLg = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { confirmApi, confirmHolder } = useConfirm();

  const getData = useMemoizedFn(async () => {
    const result = await getUserSessions({
      page: filterParams.page,
      pageSize: filterParams.pageSize,
      status: filterParams.status,
    });

    const total = result?.paging?.total || 0;
    userSessionsCountMap[filterParams.status] = total;

    return {
      total,
      list: result?.list || [],
    };
  });

  useMount(async () => {
    const expiredResult = await getUserSessions({
      page: 1,
      pageSize: 1,
      status: USER_SESSION_STATUS.EXPIRED,
    });
    userSessionsCountMap[USER_SESSION_STATUS.EXPIRED] = expiredResult?.paging?.total || 0;

    const offlineResult = await getUserSessions({
      page: 1,
      pageSize: 1,
      status: USER_SESSION_STATUS.OFFLINE,
    });
    userSessionsCountMap[USER_SESSION_STATUS.OFFLINE] = offlineResult?.paging?.total || 0;
  });

  const pageState = useRequest(getData, {
    refreshDeps: [filterParams.status, filterParams.page, filterParams.pageSize],
  });

  const safeData = useCreation(() => {
    return pageState.data?.list || [];
  }, [pageState.data?.list]);

  const disableLogout = useCreation(() => {
    const { status } = filterParams;
    if (status === USER_SESSION_STATUS.ONLINE) {
      // HACK: 这里只能假设会话列表包含了当前登录的会话，所以只有大于 1 的时候才能够去注销其他会话
      return userSessionsCountMap[status] <= 1;
    }
    return userSessionsCountMap[status] === 0;
  }, [safeData, currentVisitorId]);

  const mergeStyle = useCreation(() => {
    return mergeSx({}, isMobile ? textRightStyle : {});
  }, [isMobile]);

  const logout = useMemoizedFn(({ visitorId }) => {
    confirmApi.open({
      title: t('userCenter.logoutThisSession'),
      content: t('userCenter.logoutThisSessionConfirm'),
      confirmButtonText: t('userCenter.confirm'),
      confirmButtonProps: {
        color: 'error',
      },
      cancelButtonText: t('userCenter.cancel'),
      onConfirm: async () => {
        await blockletSdk.user.logout({
          visitorId,
          includeFederated: true,
        });
        // 如果当前页没有数据需要向前翻页
        const { page = 0 } = filterParams;
        const { list = [] } = pageState.data || {};
        const currentPageLength = list.length || 0;
        if (page > 1 && currentPageLength === 1) {
          filterParams.page = Math.max(page - 1, 1);
        }
        pageState.refresh();
        confirmApi.close();
      },
    });
  });
  const logoutAll = useMemoizedFn(() => {
    confirmApi.open({
      title: t('userCenter.logoutAllSession', {
        type: t(filterParams.status),
      }),
      content: t('userCenter.logoutAllSessionConfirm', {
        type: t(filterParams.status),
      }),
      confirmButtonText: t('userCenter.confirm'),
      confirmButtonProps: {
        color: 'error',
      },
      cancelButtonText: t('userCenter.cancel'),
      onConfirm: async () => {
        await blockletSdk.user.logout({
          status: filterParams.status,
          visitorId: currentVisitorId,
          includeFederated: true,
        });
        // 重置至第一页
        filterParams.page = 1;
        pageState.refresh();
        confirmApi.close();
      },
    });
  });
  const customButtons = [];
  if (showAction) {
    customButtons.push(
      <Tooltip
        key="logoutAll"
        title={t('userCenter.logoutAllTips', {
          type: t(filterParams.status),
        })}>
        <Button
          sx={{ ml: 0.5 }}
          size="small"
          variant="contained"
          color="error"
          onClick={logoutAll}
          disabled={disableLogout}>
          {t('userCenter.logoutAll', {
            type: t(filterParams.status),
          })}
        </Button>
      </Tooltip>
    );
  }
  const tableOptions = useCreation(() => {
    return {
      // viewColumns: false,
      search: false,
      sort: false,
      download: false,
      filter: false,
      print: false,
      expandableRowsOnClick: false,
      searchDebounceTime: 600,
      page: filterParams.page - 1,
      rowsPerPage: filterParams.pageSize,
      count: pageState.data?.total || 0,
    };
  }, [pageState.data?.total, filterParams.page, filterParams.pageSize]);
  const columns = [
    {
      label: t('userCenter.platform'),
      name: 'platform',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          const result = parseUa(x?.ua);
          return (
            <Box sx={mergeStyle}>
              {[result.os?.name, result.os?.version].filter(Boolean).join('/') || t('userCenter.unknown')}
            </Box>
          );
        },
      },
    },
    {
      label: t('userCenter.deviceType'),
      name: 'deviceType',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          const result = parseUa(x?.ua);
          return (
            <Box sx={mergeStyle}>
              {[result.browser?.name, result.browser?.version].filter(Boolean).join('/') || t('userCenter.unknown')}
            </Box>
          );
        },
      },
    },
    {
      label: t('userCenter.walletOS'),
      name: 'walletOS',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return (
            <Box sx={mergeStyle}>{x.extra?.walletOS ? x.extra.walletOS.toUpperCase() : t('userCenter.unknown')}</Box>
          );
        },
      },
    },
    showUser && {
      label: t('userCenter.user'),
      name: 'user',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return (
            <Box sx={mergeSx({ minWidth: 150, maxWidth: 250 }, isMobile ? textRightStyle : {})}>
              <UserSessionInfo sessionUser={x.user} user={user} />
            </Box>
          );
        },
      },
    },
    {
      label: t('userCenter.createdAt'),
      name: 'createdAt',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return (
            <Box sx={mergeStyle}>
              {x.createdAt ? (
                <RelativeTime value={x.createdAt} relativeRange={3 * 86400 * 1000} />
              ) : (
                t('userCenter.unknown')
              )}
            </Box>
          );
        },
      },
    },
    !showOffline && {
      label: t('userCenter.updatedAt'),
      name: 'updatedAt',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return (
            <Box sx={mergeStyle}>
              {x.status === USER_SESSION_STATUS.EXPIRED ? (
                t('userCenter.expired')
              ) : (
                <RelativeTime value={x.updatedAt} relativeRange={3 * 86400 * 1000} />
              )}
            </Box>
          );
        },
      },
    },
    {
      label: t('userCenter.lastLoginIp'),
      name: 'lastLoginIp',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return <UserSessionIp userSession={x} isMobile={isMobile} />;
        },
      },
    },
    showAction && {
      label: t('userCenter.actions'),
      name: 'actions',
      options: {
        customBodyRenderLite: (rawIndex) => {
          const x = safeData[rawIndex];
          return (
            <Box sx={mergeStyle}>
              <Button
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: '12px !important',
                  lineHeight: '1.25',
                  px: 1,
                }}
                disabled={currentVisitorId === x.visitorId}
                variant="outlined"
                size="small"
                color="error"
                onClick={() => logout({ visitorId: x.visitorId })}>
                {x.status === USER_SESSION_STATUS.EXPIRED
                  ? t('userCenter.remove')
                  : currentVisitorId === x.visitorId
                    ? t('userCenter.currentSession')
                    : t('userCenter.logout')}
              </Button>
            </Box>
          );
        },
      },
    },
  ].filter(Boolean);

  return (
    <Box
      className="pc-user-sessions"
      sx={{
        maxWidth: isMobile ? 'unset' : isLg ? 'calc(100vw - 300px)' : '100%',
        '.pc-user-sessions-table': {
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          gap: 1,
        },
        ...(isMobile && {
          '.pc-user-sessions-table > div:nth-child(2)': {
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
          },
        }),
        '.MuiTableCell-head': {
          whiteSpace: 'nowrap',
          fontWeight: 'bold',
        },
        '.MuiTableRow-root': {
          border: 'unset',
          '&:nth-child(even)': {
            backgroundColor: 'grey.50',
            '&:hover': {
              backgroundColor: (theme) => `${theme.palette.grey[50]} !important`,
            },
          },
        },
        '.MuiTableRow-hover': {
          '&:hover': {
            backgroundColor: 'inherit !important',
          },
        },
        '.MuiTableCell-root': {
          paddingRight: '8px',
          paddingLeft: '8px',
          color: 'text.secondary',
          ...(isMobile && {
            padding: '8px !important',
            '&:first-child': {
              paddingTop: '20px!important',
            },
            '&:last-child': {
              paddingBottom: '20px!important',
            },
          }),
        },
      }}>
      {confirmHolder}
      <Datatable
        count={pageState.data?.total || 0}
        data={safeData}
        columns={columns}
        customButtons={customButtons}
        options={tableOptions}
        locale={locale}
        loading={pageState.loading}
        className="pc-user-sessions-table"
        title={
          <RadioGroup
            row
            sx={{ lineHeight: 1, ml: 1 }}
            onChange={(e) => {
              filterParams.status = e.target.value;
            }}>
            <FormControlLabel
              value={USER_SESSION_STATUS.ONLINE}
              control={
                <Radio
                  size="small"
                  sx={{ lineHeight: 1, fontSize: 0 }}
                  checked={filterParams.status === USER_SESSION_STATUS.ONLINE}
                />
              }
              label={
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  {t('userCenter.online')}
                  <Typography component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>
                    ({userSessionsCountMap[USER_SESSION_STATUS.ONLINE]})
                  </Typography>
                </Typography>
              }
            />
            <FormControlLabel
              value={USER_SESSION_STATUS.EXPIRED}
              control={
                <Radio
                  size="small"
                  sx={{ lineHeight: 1, fontSize: 0 }}
                  checked={filterParams.status === USER_SESSION_STATUS.EXPIRED}
                />
              }
              label={
                <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                  {t('userCenter.expired')}
                  <Typography component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>
                    ({userSessionsCountMap[USER_SESSION_STATUS.EXPIRED]})
                  </Typography>
                </Typography>
              }
            />
            {showOffline ? (
              <FormControlLabel
                value={USER_SESSION_STATUS.OFFLINE}
                control={
                  <Radio
                    size="small"
                    sx={{ lineHeight: 1, fontSize: 0 }}
                    checked={filterParams.status === USER_SESSION_STATUS.OFFLINE}
                  />
                }
                label={
                  <Typography sx={{ display: 'flex', alignItems: 'center' }}>
                    {t('userCenter.offline')}
                    <Typography component="span" sx={{ ml: 0.5, color: 'text.secondary' }}>
                      ({userSessionsCountMap[USER_SESSION_STATUS.OFFLINE]})
                    </Typography>
                  </Typography>
                }
              />
            ) : null}
          </RadioGroup>
        }
        onChange={(state) => {
          filterParams.page = state.page + 1;
          filterParams.pageSize = state.rowsPerPage;
        }}
      />
    </Box>
  );
}

UserSessions.propTypes = {
  user: PropTypes.object.isRequired,
  showAction: PropTypes.bool,
  showUser: PropTypes.bool,
  showOffline: PropTypes.bool,
  getUserSessions: PropTypes.func.isRequired,
};

export default UserSessions;
