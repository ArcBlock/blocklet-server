/* eslint-disable react/require-default-props */
import { memo, useMemo, useState, useCallback, useEffect } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import { alpha } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useCreation, useMount } from 'ahooks';
import omit from 'lodash/omit';
import throttle from 'lodash/throttle';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSearchParams } from 'react-router-dom';
import NotificationTypes from './tabs';
import NotificationList from './list';
import NotificationPagination from './pagination';
import NotificationFilter from './filter';
import ScrollToTop from './scroll-to-top';
import { checkIfNotificationIsRead } from './preview/utils';

const NotificationContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${(props) => (props.inDialog ? 0 : '24px')};
  .MuiContainer-root {
    padding-right: 0;
  }

  .profile-button.MuiButtonBase-root {
    border-radius: 9999px;
    margin-right: 2px;
    padding: 5px 12px;
    line-height: 22px;
    font-size: 13px;
    border: 1px solid transparent;
    background-color: ${({ theme }) => theme.palette.background.default};
    color: ${({ theme }) => theme.palette.text.primary};
    font-weight: 400;
    border: 1px solid ${({ theme }) => theme.palette.divider} !important;
  }
  .profile-button.active.MuiButtonBase-root,
  .profile-button.active.MuiButtonBase-root:hover {
    color: ${({ theme }) => theme.palette.primary.main};
    font-weight: 600;
    background-color: ${({ theme }) => alpha(theme.palette.primary.main, 0.1)};
    border: 1px solid ${({ theme }) => alpha(theme.palette.primary.main, 0.24)} !important;
  }

  .profile-button.MuiButtonBase-root:hover {
    background-color: rgba(0, 0, 0, 0.04);
  }

  .profile-line-button.MuiButtonBase-root {
    margin-right: 2px;
    color: ${({ theme }) => theme.palette.text.secondary};
    padding: 5px 12px;
    line-height: 22px;
    font-size: 13px;
    border: none !important;
    border-radius: 0;
  }

  .profile-line-button.active.MuiButtonBase-root {
    color: ${({ theme }) => theme.palette.text.primary};
    border-bottom: 1px solid ${({ theme }) => theme.palette.text.primary} !important;
  }

  .profile-button.MuiButtonBase-root:last-of-type,
  .profile-line-button.MuiButtonBase-root {
    margin-right: 0;
  }

  .profile-line-button.MuiButtonBase-root:hover {
    color: ${({ theme }) => theme.palette.text.primary};
    background-color: unset;
  }

  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
`;

NotificationHome.propTypes = {
  blocklets: PropTypes.array,
  context: PropTypes.object, // Notification Context
  pagination: PropTypes.bool,
  inDialog: PropTypes.bool,
  filterType: PropTypes.oneOf(['component', 'entity']), // 过滤类型，如果是 server 过滤类型为 entity 如果是 service 过滤类型为 component
  toViewAll: PropTypes.func,
  type: PropTypes.oneOf(['server', 'service']), // 类型，默认为 service
};

function NotificationHome({
  blocklets = [],
  context,
  pagination = true,
  inDialog = false,
  filterType = 'component',
  toViewAll = () => {},
  type = 'service',
}) {
  const {
    data: notifications,
    paging,
    refresh,
    loading,
    params: queryParams,
    onReadNotification,
    componentDids,
    filterUnReadCount,
    initial,
  } = context;

  const onSelectType = (severity) => {
    const selected = !!severity && typeof severity === 'string' ? [severity] : severity || [];
    refresh({ ...queryParams, severity: selected, paging: { ...queryParams.paging, page: 1 } });
  };
  const [searchParams] = useSearchParams();
  const notificationId = useCreation(() => searchParams.get('id'), [searchParams]);
  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('md'));

  const [total, setTotal] = useState(0);

  // 避免分页导致 highlight 闪烁
  const [highlight, setHighlight] = useState(false);

  const readFilter = useMemo(() => {
    if (queryParams.read === false) {
      return 'unread';
    }
    return 'all';
  }, [queryParams.read]);

  // 创建一个 memoized 的 throttled 函数
  const throttledPaginationChange = useCreation(() => {
    return throttle((v) => {
      // 1. 如果筛选的是 未读 的消息，需要判断当前页是否还有未读的消息
      // 2. 如果当前页没有未读的消息，则翻页时需要查询当前页
      // 3. 如果当前页有未读的消息，但是小于每页的数据，则翻页时需要查询当前页
      // 4. 如果当前页有未读的消息，并且大于等于每页的数据，则翻页时需要查询下一页
      // 5. 如果是向前翻页，则翻页时需要查询下一页
      if (loading) {
        return;
      }
      const currentPageCount = notifications.length;
      const currentPageUnreadCount = notifications.filter((n) => !checkIfNotificationIsRead(n)).length;
      let params = {
        ...queryParams,
        append: true,
        paging: { ...queryParams.paging, ...v, currentPage: (paging.currentPage || 0) + 1 },
      };
      if (readFilter === 'unread' && currentPageUnreadCount < currentPageCount && v.page > queryParams.paging.page) {
        params = {
          ...queryParams,
          append: true,
          paging: {
            ...queryParams.paging,
            ...v,
            page: queryParams.paging.page || 1,
            currentPage: (paging.currentPage || 0) + 1,
          },
        };
      }
      refresh(params);
    }, 500);
  }, [notifications, queryParams, readFilter, paging, loading, refresh]);

  useMount(() => {
    if (initial && typeof initial === 'function') {
      initial();
    }
  });

  useEffect(() => {
    if (!paging.currentPage || paging.currentPage === 1) {
      setTotal(paging.total);
    }
  }, [paging.total, paging.currentPage]);

  useEffect(() => {
    setTimeout(() => {
      const dom = document.getElementById(notificationId);
      if (dom) {
        dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlight(true);
    }, 100);
    // 3s 后取消 highlight
    setTimeout(() => {
      setHighlight(false);
    }, 3000);
  }, [notificationId]);

  const hasNextPage = useCreation(() => {
    return notifications?.length > 0 && notifications.length < total;
  }, [notifications, total]);

  const isSendMessage = useCallback(
    (id) => {
      const { blocklet = {} } = window;
      const dids = [blocklet?.did, ...(blocklet?.ancestors || []).map((a) => a)];
      return componentDids?.includes(id) || dids.findIndex((d) => d === id) > -1;
    },
    [componentDids]
  );

  const blockletMap = useMemo(() => {
    const map = new Map();
    if (!blocklets.length) {
      return map;
    }

    blocklets.forEach((b) => {
      const did = b?.did || b.meta?.did;
      if (did && !map.has(did)) {
        b.ancestors = [];
        map.set(did, b);
        if (b?.alsoKnownAs?.length > 0) {
          b.alsoKnownAs.forEach((id) => {
            if (!map.has(id)) {
              map.set(id, b);
            }
          });
        }
      }
      if (b?.children?.length > 0) {
        b.children.forEach((item) => {
          const childDid = item?.did || item.meta?.did;
          if (childDid && !map.has(childDid) && isSendMessage(childDid)) {
            item.ancestors = [b];
            map.set(childDid, item);
          }
        });
      }
    });
    return map;
  }, [blocklets, isSendMessage]);

  const loadMore = useCallback(() => {
    if (loading) {
      return;
    }
    throttledPaginationChange({ page: paging.page + 1 });
  }, [paging.page, loading, throttledPaginationChange]);

  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
  });

  const onRead = (notification) => {
    if (!notification || checkIfNotificationIsRead(notification)) {
      return;
    }
    onReadNotification(notification.id).then(() => {
      if (inDialog) {
        toViewAll();
      }
    });
  };

  const handleComponentChange = ({ severity, id }) => {
    if (loading) {
      return;
    }
    let filterParams = {};
    if (filterType === 'component') {
      filterParams = {
        entityId: [],
        componentDid: id,
      };
    } else if (filterType === 'entity') {
      filterParams = {
        componentDid: [],
        entityId: id,
      };
    }
    refresh({
      ...queryParams,
      severity,
      ...filterParams,
      paging: { ...queryParams.paging, page: 1 },
    });
  };

  const onReadFilterChange = (readFilterType) => {
    if (loading) {
      return;
    }
    let params = {
      ...queryParams,
      paging: { ...queryParams.paging, page: 1 },
    };
    if (readFilterType === 'unread') {
      params.read = false;
      params.paging.currentPage = 1;
    } else {
      params = omit(params, 'read');
    }
    refresh(params);
  };

  const selectedId = useCreation(() => {
    if (filterType === 'component') {
      return Array.isArray(queryParams.componentDid) ? queryParams.componentDid : [];
    }
    if (filterType === 'entity') {
      return Array.isArray(queryParams.entityId) ? queryParams.entityId : [];
    }
    return [];
  }, [queryParams, filterType]);

  const severityInDialog = useCreation(() => {
    const selectedSeverities = Array.isArray(queryParams.severity) ? queryParams.severity : [];
    return selectedSeverities[0] || '';
  }, [queryParams.severity]);

  return (
    <NotificationContainer inDialog={!!inDialog}>
      {!inDialog ? (
        <NotificationFilter
          loading={loading}
          blockletMap={blockletMap}
          unReadCount={filterUnReadCount}
          filterType={filterType}
          type={type}
          selectedId={selectedId}
          onFilterChange={handleComponentChange}
          severity={queryParams.severity}
          onReadFilterChange={onReadFilterChange}
          currentReadFilter={readFilter}
        />
      ) : (
        <NotificationTypes currentTab={severityInDialog} type="line" theme="light" onSelectType={onSelectType} />
      )}

      {!isMd && loading ? (
        <Box sx={{ display: 'flex', width: '100%', minHeight: 400, justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : (
        <NotificationList
          data={notifications}
          blockletMap={blockletMap}
          onReadNotification={onRead}
          onReadBatch={onReadNotification}
          inDialog={inDialog}
          highlightId={notificationId}
          highlight={!inDialog && highlight}
          type={type}
        />
      )}

      {pagination && !isMd ? (
        <NotificationPagination loading={loading} paging={paging} onChange={throttledPaginationChange} />
      ) : null}

      {pagination && isMd && (loading || hasNextPage) ? (
        <Box
          ref={sentryRef}
          sx={{ display: 'flex', width: '100%', minHeight: 100, justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </Box>
      ) : null}

      {/* 仅在非对话框模式下显示回到顶部按钮 */}
      {!inDialog && isMd ? <ScrollToTop /> : null}
    </NotificationContainer>
  );
}

export default memo(NotificationHome);
