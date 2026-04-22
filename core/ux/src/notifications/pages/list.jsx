/* eslint-disable react/require-default-props */
import { useContext, useMemo, useEffect, useRef, useState, useCallback } from 'react';
import styled from '@emotion/styled';
import PropTypes from 'prop-types';
import { useMemoizedFn, useMount } from 'ahooks';
import { useLocaleContext, LocaleContext } from '@arcblock/ux/lib/Locale/context';
import { useTheme, useMediaQuery, Box, IconButton, Typography } from '@mui/material';
import { ServerLogoNotext } from '@arcblock/icons';
import { CopyButton } from '@arcblock/ux/lib/ClickToCopy';
import BlockletBundleAvatar from '../../blocklet/bundle-avatar';
import BlockletAppAvatar from '../../blocklet/app-avatar';
import RelativeTime from '../../relative-time';
import NotificationContent from './content';
import SeverityAvatar from './avatars/severity';
import ActivityAvatar from './avatars/activity';
import Activity from './activity';
import { mergeAdjacentNotifications, isIncludeActivity, isUserActor } from './activity/utils';
import ActorAvatar from './avatars/actor';
import NotificationActions from './actions';
import {
  getNotificationLink,
  checkIfNotificationIsRead,
  getComponentMountPoint,
  getNotificationsInVisibleArea,
  getUnReadNotificationByIds,
  getAllNotifications,
} from './preview/utils';
import Empty from './empty';

NotificationList.propTypes = {
  data: PropTypes.array,
  blockletMap: PropTypes.object,
  onReadBatch: PropTypes.func,
  inDialog: PropTypes.bool,
  highlightId: PropTypes.string,
  highlight: PropTypes.bool,
  type: PropTypes.oneOf(['server', 'service']), // 类型，默认为 service
};

NotificationItem.propTypes = {
  notification: PropTypes.object,
  blocklet: PropTypes.object,
  onReadBatch: PropTypes.func,
  inDialog: PropTypes.bool,
  highlight: PropTypes.bool,
};

SendComponentAvatar.propTypes = {
  blocklet: PropTypes.object,
  size: PropTypes.number,
  showName: PropTypes.bool,
  hideDot: PropTypes.bool,
};

export function SendComponentAvatar({ blocklet, size = 40, showName = false, hideDot = false }) {
  const blockletDid = blocklet?.did || blocklet?.meta?.did || '';
  const applicationDids = (blocklet?.alsoKnownAs || []).concat(
    blocklet?.appId || blocklet?.appDid || blocklet?.appPid || ''
  );

  return (
    <Box
      className="component-avatar"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: hideDot ? '8px' : '4px',
      }}>
      {!hideDot && <span className="dot" />}
      {blocklet ? (
        <Box>
          {applicationDids.includes(blockletDid) ? (
            <BlockletAppAvatar blocklet={blocklet} size={size} style={{ borderRadius: 8 }} />
          ) : (
            <BlockletBundleAvatar
              blocklet={blocklet}
              ancestors={blocklet.ancestors ?? []}
              size={size}
              style={{ borderRadius: 8 }}
            />
          )}
        </Box>
      ) : (
        <ServerLogoNotext width={size} height={size} />
      )}
      {showName && <span className="component-name">{blocklet?.meta?.title}</span>}
    </Box>
  );
}

export function NotificationItem({ notification, blocklet, onReadBatch = () => {}, inDialog = false, highlight }) {
  const { locale } = useContext(LocaleContext);
  const theme = useTheme();
  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('md'));
  const notificationRef = useRef(null);

  const isRead = useMemo(() => {
    return checkIfNotificationIsRead(notification);
  }, [notification]);

  // 活动类型通知（包含 activity 字段）
  // 需要有单独的样式渲染
  const includeActivity = useMemo(() => {
    return isIncludeActivity(notification);
  }, [notification]);

  const isUserInitiatedNotification = useMemo(() => {
    return isUserActor(notification);
  }, [notification]);

  const notificationItems = useMemo(() => {
    return notification.items || [];
  }, [notification]);

  // 是否是多条消息的集合
  const isMultiple = useMemo(() => {
    return notificationItems.length > 0;
  }, [notificationItems]);

  const actors = useMemo(() => {
    if (!includeActivity) {
      return [];
    }
    if (isMultiple) {
      return notificationItems
        .map((item) => (isUserActor(item) ? item.actorInfo : { did: item.activity?.actor }))
        .filter(Boolean);
    }
    return notification.actorInfo ?? [];
  }, [notificationItems, notification.actorInfo, isMultiple, includeActivity]);

  const componentDid = useMemo(() => {
    return blocklet?.did || blocklet?.meta?.did || '';
  }, [blocklet]);

  const mountPoint = useMemo(() => {
    return getComponentMountPoint(componentDid, window.blocklet);
  }, [componentDid]);

  const onClickNotification = useMemoizedFn((n, event) => {
    // 如果事件有 customPreventRedirect 属性，说明子组件已经处理了导航
    const notifications = getAllNotifications(n);
    if (notifications.length) {
      onReadBatch(notifications.map((item) => item.id));
    }
    if (event && !event.customPreventRedirect) {
      const link = getNotificationLink(n, mountPoint);

      // 这里是一个相对路径，不应该使用URL判断
      if (link && typeof link === 'string') {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }
  });

  return (
    <StyledNotificationRow
      ref={notificationRef}
      className="notification-row"
      id={notification.id}
      isRead={isRead}
      inDialog={inDialog}
      highlight={highlight}
      isMd={isMd}
      onClick={(event) => onClickNotification(notification, event)}>
      {includeActivity ? (
        <ActivityAvatar activity={notification.activity.type} size={isMd ? 24 : 32} />
      ) : (
        <SeverityAvatar severity={notification.severity} size={isMd ? 24 : 32} />
      )}
      <Box
        className="notification"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'start',
        }}>
        <Box
          className="header"
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            mb: 1.5,
          }}>
          {includeActivity && isUserInitiatedNotification ? (
            <ActorAvatar
              actors={actors}
              teamDid={componentDid}
              size={isMd ? 24 : 32}
              avatarFallback={<SendComponentAvatar blocklet={blocklet} hideDot size={isMd ? 24 : 32} />}
            />
          ) : (
            <SendComponentAvatar blocklet={blocklet} hideDot size={isMd ? 24 : 32} />
          )}
          <RelativeTime
            value={notification.createdAt}
            locale={locale}
            shouldUpdate
            style={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              minWidth: '50px',
              whiteSpace: 'nowrap',
            }}
          />
        </Box>

        {includeActivity ? (
          <Activity
            notification={notification}
            isMultiple={isMultiple}
            blocklet={blocklet}
            mountPoint={mountPoint}
            avatarFallback={<SendComponentAvatar blocklet={blocklet} hideDot size={isMd ? 24 : 32} />}
          />
        ) : (
          <>
            <Typography
              variant="body1"
              className="title"
              sx={{
                color: 'rgba(24, 24, 27, 1)',
                mt: 0,
                mb: 0.5,
              }}>
              {notification.title}
            </Typography>
            <NotificationContent notification={notification} rows={inDialog ? 0 : 2} />
          </>
        )}
        <NotificationActions notification={notification} />
      </Box>
      {notification?.description && notification.severity === 'error' && (
        <Box className="copy-button">
          <IconButton size="small">
            <CopyButton sx={{ fontSize: 22 }} content={notification?.description || ''} />
          </IconButton>
        </Box>
      )}
    </StyledNotificationRow>
  );
}

export default function NotificationList({
  data,
  blockletMap,
  onReadBatch = () => {},
  inDialog = false,
  highlightId,
  highlight = false,
  type = 'service',
}) {
  const { t } = useLocaleContext();
  const listRef = useRef(null);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [_, setIsScrolling] = useState(false);
  const visibleNotificationsRef = useRef(new Set());
  const markedAsReadRef = useRef(new Set()); // 存储已标记为已读的通知ID
  const scrollTimerRef = useRef(null);
  const observerRef = useRef(null);
  const dataRefreshRef = useRef(false); // 跟踪数据是否发生变化，需要重新设置观察者
  const processTimerRef = useRef(null); // 用于节流处理可见通知的定时器

  const displayData = useMemo(() => {
    if (!inDialog) {
      return data;
    }
    return data?.slice(0, 5);
  }, [inDialog, data]);

  const mergedData = useMemo(() => {
    return mergeAdjacentNotifications(displayData);
  }, [displayData]);

  // 创建一个通知ID到通知对象的映射，优化查找效率
  const notificationMap = useMemo(() => {
    const map = new Map();
    if (mergedData && mergedData.length) {
      mergedData.forEach((notification) => {
        map.set(notification.id, notification);
      });
    }
    return map;
  }, [mergedData]);

  // 监听页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 处理可见的未读通知，将它们标记为已读
  const processVisibleNotifications = useCallback(() => {
    // 在对话框模式下不自动标记已读
    if (inDialog) return;

    // 滚动已经停止，处理可见的未读通知
    if (visibleNotificationsRef.current.size > 0) {
      const processedIds = []; // 收集本次处理的ID，用于批量处理

      visibleNotificationsRef.current.forEach((notificationId) => {
        // 已经标记过已读的通知，直接跳过
        if (markedAsReadRef.current.has(notificationId)) {
          return;
        }

        // 使用Map进行快速查找，避免遍历
        const notification = notificationMap.get(notificationId);

        if (notification) {
          const { receivers = [], items = [] } = notification;
          if (receivers.length && !receivers[0].read) {
            // 添加到已处理集合
            processedIds.push(notificationId);
            markedAsReadRef.current.add(notificationId);

            // 如果这是一个合并的通知，则处理其中的所有子通知
            if (items.length > 0) {
              items.forEach((item) => {
                const itemId = item.id;
                if (itemId && !markedAsReadRef.current.has(itemId)) {
                  processedIds.push(itemId);
                  markedAsReadRef.current.add(itemId);
                }
              });
            }

            // 如果有观察者且元素仍然存在，则停止观察
            if (observerRef.current) {
              const element = document.getElementById(notificationId);
              if (element) {
                observerRef.current.unobserve(element);
              }
            }
          }
        }
      });

      // 批量调用一次标记已读API
      if (processedIds.length > 0) {
        // 如果API支持批量处理
        onReadBatch(processedIds);
        setTimeout(() => {
          setHasScrolled(false);
        }, 300);
      }

      // 处理完后清空可见集合
      visibleNotificationsRef.current.clear();
    }
  }, [inDialog, notificationMap, onReadBatch]);

  // 节流处理可见通知的函数，避免过于频繁的API调用
  const throttledProcessVisibleNotifications = useCallback(() => {
    // 清除之前的定时器
    if (processTimerRef.current) {
      clearTimeout(processTimerRef.current);
    }

    // 设置新的定时器，100ms后执行
    processTimerRef.current = setTimeout(() => {
      processVisibleNotifications();
    }, 50);
  }, [processVisibleNotifications]);

  // 设置观察者的函数，抽取为独立函数以便重用
  const setupObserver = useCallback(() => {
    // 在对话框模式下不设置观察者来自动标记已读
    if (inDialog || !listRef.current || !isVisible) return;

    // 如果已有观察者，先断开连接
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 创建 observer 配置
    const options = {
      root: null, // 在非对话框模式下，使用视口作为根
      rootMargin: '0px',
      threshold: 0.5,
    };

    // 创建 observer 实例
    const observer = new IntersectionObserver((entries) => {
      // 只有当用户滚动过页面后，才执行收集可见元素的逻辑
      if (!hasScrolled) return;

      entries.forEach((entry) => {
        // 获取消息 ID
        const notificationId = entry.target.id;

        // 已标记为已读的通知不再处理
        if (markedAsReadRef.current.has(notificationId)) {
          return;
        }

        // 使用Map快速查找通知对象
        const notification = notificationMap.get(notificationId);

        // 检查消息是否未读
        if (notification) {
          const { receivers = [] } = notification;
          if (receivers.length && !receivers[0].read) {
            if (entry.isIntersecting) {
              // 添加到可见通知集合中
              visibleNotificationsRef.current.add(notificationId);

              // 无论是否在滚动状态，都使用节流处理可见通知
              // 这样可以确保快速滚动时也能及时标记消息为已读
              throttledProcessVisibleNotifications();
            } else {
              // 如果不再可见，从集合中移除
              visibleNotificationsRef.current.delete(notificationId);
            }
          }
        }
      });
    }, options);

    // 保存观察者实例以便后续使用
    observerRef.current = observer;

    // 获取所有未读消息元素并观察它们，不再过滤初始加载的消息
    const unreadNotifications = Array.from(listRef.current.querySelectorAll('.notification-row')).filter((el) => {
      const notificationId = el.id;

      // 已标记为已读的通知不再观察
      if (markedAsReadRef.current.has(notificationId)) {
        return false;
      }

      // 使用Map快速查找
      const notification = notificationMap.get(notificationId);
      if (notification) {
        const { receivers = [] } = notification;
        return receivers.length && !receivers[0].read;
      }
      return false;
    });

    unreadNotifications.forEach((el) => {
      observer.observe(el);
    });

    // 数据刷新标记重置
    dataRefreshRef.current = false;
  }, [hasScrolled, inDialog, isVisible, notificationMap, throttledProcessVisibleNotifications]);

  // 检测数据变化，需要重新设置观察者
  useEffect(() => {
    // 在对话框模式下不自动标记已读
    if (inDialog) return;

    // 标记数据已更新，需要重新设置观察者
    dataRefreshRef.current = true;

    // 如果观察者已存在且页面可见且用户已滚动，立即重新设置观察者
    if (observerRef.current && isVisible && hasScrolled) {
      // 短暂延迟确保DOM已更新
      setTimeout(() => {
        setupObserver();
      }, 0);
    }
  }, [displayData, hasScrolled, isVisible, setupObserver, inDialog]);

  // 添加滚动事件监听器，用于检测用户是否滚动了页面和滚动是否停止
  useEffect(() => {
    // 在对话框模式下不添加滚动监听来自动标记已读
    if (inDialog || !listRef.current || !isVisible) return undefined;

    let scrollContainer = window;
    if (type === 'server') {
      scrollContainer = document.getElementById('arc__dashboard-main');
    }

    // 兼容代码，如果 arc__dashboard-main id 不存在，则使用 className 为 dashboard-main 的div
    if (!scrollContainer) {
      const dashboardMain = document.getElementsByClassName('dashboard-main')[0];
      if (dashboardMain) {
        scrollContainer = dashboardMain;
      }
    }

    if (!scrollContainer) {
      return undefined;
    }

    const handleScroll = (e) => {
      if (!e.isTrusted) {
        return;
      }

      if (!hasScrolled) {
        setHasScrolled(true);
      }

      // 设置正在滚动状态
      setIsScrolling(true);

      // 清除之前的定时器
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }

      // 设置新的定时器，滚动停止后300ms触发
      scrollTimerRef.current = setTimeout(() => {
        setIsScrolling(false);
        // 滚动停止后再次处理可见通知作为兜底机制
        processVisibleNotifications();

        // 如果数据已刷新，重新设置观察者以包含新消息
        if (dataRefreshRef.current) {
          setupObserver();
        }
      }, 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      // 清理节流定时器
      if (processTimerRef.current) {
        clearTimeout(processTimerRef.current);
      }
    };
  }, [inDialog, hasScrolled, isVisible, processVisibleNotifications, setupObserver, type]);

  // 设置 Intersection Observer 来检测未读消息是否在可视区域内
  useEffect(() => {
    // 在对话框模式下不设置观察者
    if (!inDialog) {
      setupObserver();
    }

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [setupObserver, inDialog]);

  useMount(() => {
    // 2秒后将可视区域内的未读通知标记为已读
    setTimeout(() => {
      const notificationIds = getNotificationsInVisibleArea(listRef.current);
      const notifications = getUnReadNotificationByIds(notificationMap, notificationIds);
      onReadBatch(notifications.map((item) => item.id));
    }, 100);
  });

  if (!mergedData?.length) {
    return <Empty>{t('notification.allDone')}</Empty>;
  }

  return (
    <Box
      ref={listRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',

        ...(inDialog
          ? {
              maxHeight: 'calc(-200px + 100vh)',
              overflow: 'auto',
            }
          : {}),
      }}>
      {mergedData?.map((item) => {
        const senderBlocklet =
          item.source === 'system'
            ? blockletMap.get(item.entityId || item.sender)
            : blockletMap.get(item.componentDid || item.sender);

        return item?.type?.toLowerCase() === 'passthrough' ? null : (
          <NotificationItem
            highlight={highlight && highlightId === item.id}
            inDialog={inDialog}
            notification={item}
            key={item.id}
            blocklet={senderBlocklet}
            onReadBatch={onReadBatch}
          />
        );
      })}
    </Box>
  );
}
// TODO: 需要修改theme
export const StyledNotificationRow = styled(Box)`
  @keyframes flash-bg {
    0% {
      background-color: ${(props) => props.theme.palette.warning.light};
    }
    100% {
      background-color: unset;
    }
  }
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: ${(props) => (props.isMd ? props.theme.spacing(1) : props.theme.spacing(1.5))};
  padding: ${(props) => (props.isMd ? `${props.theme.spacing(2)} 0` : props.theme.spacing(3))};
  cursor: pointer;
  animation: ${(props) => (props.highlight ? 'flash-bg 3s ease-out 0s 1 normal none running' : 'none')};
  background-color: ${(props) => (props.isRead ? 'transparent' : props.theme.palette.grey[100])};
  border-bottom: 1px solid;
  border-color: ${({ theme }) => theme.palette.grey[200]};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background-color: ${(props) => props.theme.palette.action.hover};
  }

  .copy-button {
    position: absolute;
    right: ${(props) => (props.inDialog ? props.theme.spacing(2) : '0')};
    top: ${(props) => (props.inDialog ? props.theme.spacing(5) : props.theme.spacing(4))};
    display: none;
    background: ${(props) => props.theme.palette.action.disabledBackground};
    border-radius: 50%;
    svg {
      width: ${(props) => props.theme.spacing(2.25)};
      height: ${(props) => props.theme.spacing(2.25)};
    }
  }
  &:hover {
    .copy-button {
      display: block;
    }
  }

  .component-avatar {
    .dot {
      width: ${(props) => props.theme.spacing(1)};
      height: ${(props) => props.theme.spacing(1)};
      border-radius: 50%;
      background-color: ${(props) => props.theme.palette.primary.main};
      visibility: ${(props) => (props.isRead ? 'hidden' : 'visible')};
    }
  }

  .notification {
    width: calc(100% - ${(props) => props.theme.spacing(6.25)});

    > .header {
      width: 100%;
      @media (min-width: 900px) {
        .title {
          max-width: calc(100vw - ${(props) => props.theme.spacing(50)});
        }
      }
      @media (min-width: 1200px) {
        .title {
          max-width: ${(props) => props.theme.spacing(102.5)};
        }
      }
      @media (max-width: 900px) {
        .title {
          max-width: calc(100vw - ${(props) => props.theme.spacing(25)});
        }
      }
    }

    .title {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: ${(props) => props.theme.palette.text.primary};
      font-size: ${(props) => props.theme.typography.fontSize * 1.15}px;
    }
    .link {
      color: ${(props) => props.theme.palette.primary.main};
      font-size: ${(props) => props.theme.typography.fontSize}px;
      text-decoration: none;
    }
  }
`;
