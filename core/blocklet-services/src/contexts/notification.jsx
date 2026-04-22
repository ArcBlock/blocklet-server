import { createContext, useState, useContext, useCallback } from 'react';

import Toast from '@arcblock/ux/lib/Toast';
import { EVENTS, WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import { joinURL } from 'ufo';
import {
  generateKey,
  getNotificationQueryParams,
  setNotificationQueryParams,
} from '@abtnode/util/lib/notification-preview/util';
import { useCreation, useMemoizedFn } from 'ahooks';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useLocation, useSearchParams } from 'react-router-dom';
import { BlockletAdminRoles } from '@abtnode/ux/lib/util';
import omit from 'lodash/omit';
import { useSubscription } from '../libs/ws';
import { useNodeContext } from './node';
import { useSessionContext } from './session';

const notificationUrl = joinURL(WELLKNOWN_SERVICE_PATH_PREFIX, 'user', 'notifications');

const key = generateKey();
const NotificationContext = createContext({});
const { Provider, Consumer } = NotificationContext;

const parseParam = (param) => {
  if (Array.isArray(param)) {
    return param;
  }
  if (typeof param === 'string') {
    return param.trim() ? param.split(',') : [];
  }
  return [];
};

// eslint-disable-next-line react/prop-types
function NotificationProvider({ children }) {
  const { did } = window.env;
  const { api: client } = useNodeContext();
  const [notifications, setNotifications] = useState([]);
  const [params, setParams] = useState({ page: 1 });
  const { session } = useSessionContext();
  const [paging, setPaging] = useState({ total: 0, pageSize: 10, pageCount: 0, page: 1 });
  const [loading, setLoading] = useState(false);
  const [filterUnReadCount, setFilterUnReadCount] = useState(0);
  const [componentDids, setComponentDids] = useState([]);
  const { unReadCount = 0 } = session || {};
  const userDid = useCreation(() => session?.user?.did, [session]);
  const isAdmin = useCreation(() => {
    return session?.user?.role && BlockletAdminRoles.includes(session?.user?.role);
  }, [session]);
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inNotificationPage = pathname === notificationUrl;

  const isMd = useMediaQuery((_theme) => _theme.breakpoints.down('md'));

  const notificationSet = useCreation(() => {
    return new Set(notifications.map((item) => item.id));
  }, [notifications]);

  const updateSearchParams = (queryParams) => {
    if (inNotificationPage) {
      const { severity, componentDid, read } = queryParams;
      if (severity !== searchParams.get('severity')) {
        if (severity) {
          searchParams.set('severity', severity);
        } else {
          searchParams.delete('severity');
        }
      }

      if (componentDid !== searchParams.get('componentDid')) {
        if (componentDid) {
          searchParams.set('componentDid', componentDid);
        } else {
          searchParams.delete('componentDid');
        }
      }

      if (read !== searchParams.get('read')) {
        if ([false, 'false'].includes(read)) {
          searchParams.set('read', read);
        } else {
          searchParams.delete('read');
        }
      }

      setSearchParams(searchParams, { replace: true });
    }
  };

  const updatePaging = (total) => {
    const pageCount = Math.ceil(total / paging.pageSize);
    setPaging((prev) => ({ ...prev, total, pageCount: Math.max(0, pageCount) }));
  };

  const getData = async ({ paging: pagingParams = { page: 1, pageSize: 10 }, append = false, ...rest } = {}) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const queryParams = {
        ...rest,
        severity: rest?.severity || [],
        teamDid: did,
        paging: omit(pagingParams, ['currentPage']),
        receiver: userDid,
        entityId: [], // 兼容之前的内容，将 entityId 设置为空数组
      };

      const { componentDid = [], source = [] } = queryParams;

      // 兼容之前的版本
      if (typeof componentDid === 'string') {
        queryParams.componentDid = parseParam(componentDid);
      }

      if (typeof source === 'string') {
        queryParams.source = parseParam(source);
      }

      if (componentDid.includes('system')) {
        queryParams.source = (source || []).filter((item) => item !== 'system').concat('system');
        queryParams.componentDid = componentDid.filter((item) => item !== 'system');
      } else {
        queryParams.source = (source || []).filter((item) => item !== 'system');
      }

      const res = await client.getNotifications({ input: { ...queryParams } });
      const storageParams = {
        ...queryParams,
        source: [],
        componentDid: queryParams?.source?.includes('system')
          ? (componentDid || []).filter((item) => item !== 'system').concat('system')
          : componentDid || [],
      };
      updateSearchParams(storageParams);
      setParams(storageParams);
      setNotificationQueryParams(key, omit(storageParams, 'paging.page'));
      setNotifications((prevList) => {
        if (isMd && append) {
          const appendList = res.list.filter((item) => !notificationSet.has(item.id));
          return prevList.concat(appendList);
        }
        return res.list;
      });

      setPaging({
        ...res.paging,
        currentPage: pagingParams.currentPage || 1,
      });
      setFilterUnReadCount(res.unreadCount);
      setLoading(false);
    } catch (err) {
      Toast.error(err.message);
      setLoading(false);
    }
  };

  const getComponentDids = async () => {
    const res = await client.getNotificationComponents({ input: { teamDid: did, receiver: userDid } });
    setComponentDids(res.componentDids);
  };

  const initial = useMemoizedFn(async () => {
    try {
      const storageParams = getNotificationQueryParams(key);

      // 兼容旧版本，之前存储的是一个字符串，现在要调整为数组。
      // service 端不应该会有 entityId 这个参数，这里是为了兼容旧版本 localstorage 的存储
      const paramsToProcess = ['severity', 'entityId', 'componentDid', 'source'];
      paramsToProcess.forEach((param) => {
        if (storageParams?.[param] !== undefined && typeof storageParams[param] === 'string') {
          storageParams[param] = parseParam(storageParams[param]);
        }
      });

      const severity = searchParams.get('severity');
      const componentDid = searchParams.get('componentDid');
      const read = searchParams.get('read');
      const queryParams = {
        ...storageParams,
        ...(severity
          ? { severity: severity === 'all' ? [] : parseParam(severity), paging: { ...storageParams.paging, page: 1 } }
          : {}),
        ...(componentDid ? { componentDid: componentDid === 'all' ? [] : parseParam(componentDid) } : {}),
      };
      if ([false, 'false'].includes(read)) {
        queryParams.read = false;
      } else {
        delete queryParams.read;
      }
      await Promise.all([getData(queryParams ?? {}), getComponentDids()]);
    } catch (err) {
      console.error(err);
    }
  });

  useSubscription(
    `${userDid}/${EVENTS.NOTIFICATION_BLOCKLET_CREATE}`,
    (notification) => {
      const { severity = [], componentDid = [] } = params ?? {};
      const {
        severity: notificationSeverity,
        componentDid: notificationComponentDid,
        receivers,
        source,
      } = notification ?? {};

      const { receiver: notificationReceiver } = receivers[0] ?? {};
      const shouldUpdate = isAdmin || source !== 'system';

      // 更新列表
      if (notificationReceiver === userDid && shouldUpdate) {
        // 更新列表，更新未读数量，要进行条件筛选
        // 筛选条件有，severity 和 componentDid
        if (
          (!severity.length || severity.includes(notificationSeverity)) &&
          (!componentDid.length || componentDid.includes(notificationComponentDid))
        ) {
          const { pageSize = 10 } = paging ?? {};
          setFilterUnReadCount((count) => count + 1);
          setNotifications((list) => {
            const newList = [notification, ...(list || [])];
            return isMd ? newList : newList.slice(0, pageSize);
          });
          // 更新 paging.total
          updatePaging(paging.total + 1);
        }
        // 更新筛选内容
        if (notificationComponentDid && !componentDids.includes(notificationComponentDid)) {
          setComponentDids((list) => [...(list || []), notificationComponentDid]);
        }
      }
    },
    [params, paging],
    'user'
  );

  /**
   * 更新当前 notification list 的状态。避免请求接口
   */
  const updateReadStatus = useCallback(
    (ids = []) => {
      const readNotifications = notifications.map((item) => {
        if (ids.includes(item.id)) {
          return {
            ...item,
            receivers: [
              {
                ...item.receivers[0],
                read: true,
              },
            ],
          };
        }
        return item;
      });
      setNotifications(readNotifications);
    },
    [notifications]
  );

  /**
   * 更新通过筛选条件的未读数量
   */
  const updateFilterUnReadCount = useCallback((count) => {
    setFilterUnReadCount((prev) => Math.max(prev - count, 0));
  }, []);

  useSubscription(
    `${userDid}/${EVENTS.NOTIFICATION_BLOCKLET_READ}`,
    (data) => {
      const { notificationIds, receiver, effectRows } = data;
      let effectNotificationId = notificationIds;

      if (!isAdmin) {
        effectNotificationId = notificationIds.filter((id) => effectRows[id]?.source !== 'system');
      }

      if (receiver === userDid && effectNotificationId.length) {
        // 更新状态
        updateReadStatus(effectNotificationId);
        // 更新通过筛选条件的未读数量
        updateFilterUnReadCount(effectNotificationId.length);
      }
    },
    [updateReadStatus, updateFilterUnReadCount],
    'user'
  );

  /**
   * 将 notification 置为已读
   * @param {*} id
   */
  const onReadNotification = (id) => {
    if (!id) {
      return undefined;
    }
    const ids = Array.isArray(id) ? id : [id];
    if (!ids.length) {
      return undefined;
    }
    const response = client.readNotifications({
      input: { notificationIds: ids, teamDid: did, receiver: userDid },
    });
    return response;
  };

  const makeAllAsRead = useCallback(async () => {
    if (unReadCount > 0) {
      const response = await client.makeAllNotificationsAsRead({
        input: {
          teamDid: did,
          receiver: userDid,
        },
      });
      return response;
    }
    return undefined;
  }, [unReadCount, userDid, did, client]);

  const value = {
    loading,
    refresh: getData,
    initial,
    data: notifications || [],
    filterUnReadCount,
    paging,
    api: client,
    params,
    unReadCount,
    onReadNotification,
    makeAllAsRead,
    componentDids,
  };

  return <Provider value={{ notifications: value }}>{children}</Provider>;
}

function useNotificationContext() {
  const { notifications } = useContext(NotificationContext);
  return notifications;
}

export { NotificationContext, NotificationProvider, Consumer as NotificationConsumer, useNotificationContext };
