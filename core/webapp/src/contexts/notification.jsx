import { createContext, useState, useContext, useEffect, useCallback } from 'react';

import Toast from '@arcblock/ux/lib/Toast';
import { EVENTS } from '@abtnode/constant';

import { useLocation, useSearchParams } from 'react-router-dom';
import {
  generateKey,
  getNotificationQueryParams,
  setNotificationQueryParams,
} from '@abtnode/util/lib/notification-preview/util';
import { useCreation } from 'ahooks';
import useMediaQuery from '@mui/material/useMediaQuery';
import omit from 'lodash/omit';
import { useSubscription } from '../libs/ws';
import { useNodeContext } from './node';
import { useSessionContext } from './session';
import { useBlockletsContext } from './blocklets';

const key = generateKey();
const NotificationContext = createContext({});
const { Provider, Consumer } = NotificationContext;

const parseParam = param => {
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
  const { api, info } = useNodeContext();
  const { session } = useSessionContext();
  const { data: internalData, externalData } = useBlockletsContext();

  const [notifications, setNotifications] = useState([]);
  const [params, setParams] = useState({ page: 1 });
  const [paging, setPaging] = useState({ total: 0, pageSize: 10, pageCount: 0, page: 1 });
  const [loading, setLoading] = useState(false);
  const [filterUnReadCount, setFilterUnReadCount] = useState(0);
  const { unReadCount = 0, setUnReadCount } = session || {};

  const userDid = useCreation(() => session.user?.did || '');

  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const inNotificationPage = pathname.includes('/notifications');

  const isMd = useMediaQuery(_theme => _theme.breakpoints.down('md'));

  const notificationSet = useCreation(() => {
    return new Set(notifications.map(item => item.id));
  }, [notifications]);

  const updateUnReadCount = useCallback(
    num => {
      if (setUnReadCount && typeof setUnReadCount === 'function') {
        if (typeof num === 'number') {
          setUnReadCount(num <= 0 ? 0 : num);
        } else if (typeof num === 'function') {
          setUnReadCount(num);
        }
      }
    },
    [setUnReadCount]
  );

  const updatePaging = total => {
    const pageCount = Math.ceil(total / paging.pageSize);
    setPaging(prev => ({ ...prev, total, pageCount: Math.max(0, pageCount) }));
  };

  const blocklets = useCreation(() => {
    return [].concat(internalData).concat(externalData);
  }, [internalData, externalData]);

  const updateSearchParams = queryParams => {
    if (inNotificationPage) {
      const { severity, entityId } = queryParams;
      if (severity !== searchParams.get('severity')) {
        if (severity) {
          searchParams.set('severity', severity);
        } else {
          searchParams.delete('severity');
        }
      }

      if (entityId !== searchParams.get('entityId')) {
        if (entityId) {
          searchParams.set('entityId', entityId);
        } else {
          searchParams.delete('entityId');
        }
      }

      setSearchParams(searchParams, { replace: true });
    }
  };

  const getData = async ({ paging: pagingParams = { page: 1, pageSize: 10 }, append = false, ...rest } = {}) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      // 查询指定用户的 notification
      const queryParams = {
        ...rest,
        severity: rest?.severity || [],
        teamDid: info.did,
        receiver: userDid,
        paging: omit(pagingParams, ['currentPage']),
        componentDid: [], // 兼容之前的内容，将 componentDid 设置为空数组
      };
      const { entityId = [], source = [] } = queryParams;

      // 兼容之前的内容，将 entityId 和 source 转换为数组
      if (typeof entityId === 'string') {
        queryParams.entityId = parseParam(entityId);
      }

      if (typeof source === 'string') {
        queryParams.source = parseParam(source);
      }

      if (entityId.includes('system')) {
        queryParams.source = (source || []).filter(item => item !== 'system').concat('system');
        queryParams.entityId = entityId.filter(item => item !== 'system');
      } else {
        queryParams.source = (source || []).filter(item => item !== 'system');
      }

      const res = await api.getNotifications({ input: { ...queryParams } });
      const storageParams = {
        ...queryParams,
        source: [],
        entityId: queryParams.source.includes('system')
          ? (entityId || []).filter(item => item !== 'system').concat('system')
          : entityId || [],
      };
      updateSearchParams(storageParams);
      setParams(storageParams);
      setNotificationQueryParams(key, omit(storageParams, 'paging.page'));
      setNotifications(prevList => {
        if (isMd && append) {
          const appendList = res.list.filter(item => !notificationSet.has(item.id));
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

  useEffect(() => {
    if (!inNotificationPage) {
      const queryParams = getNotificationQueryParams(key);

      // 兼容旧版本，之前存储的是一个字符串，现在要调整为数组。
      const paramsToProcess = ['severity', 'entityId', 'componentDid', 'source'];
      paramsToProcess.forEach(param => {
        if (queryParams?.[param] !== undefined && typeof queryParams[param] === 'string') {
          queryParams[param] = parseParam(queryParams[param]);
        }
      });
      getData(queryParams ?? {});
    }
  }, []); // eslint-disable-line

  /**
   * 更新当前 notification list 的状态。避免请求接口
   */
  const updateReadStatus = useCallback(
    (ids = []) => {
      const readNotifications = notifications.map(item => {
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
  const updateFilterUnReadCount = useCallback(count => {
    setFilterUnReadCount(prev => Math.max(prev - count, 0));
  }, []);

  useSubscription(
    EVENTS.NOTIFICATION_CREATE,
    notification => {
      const { severity = [], entityId = [] } = params ?? {};
      const { severity: notificationSeverity, entityId: notificationEntityId } = notification ?? {};

      if (
        (!severity.length || severity.includes(notificationSeverity)) &&
        (!entityId.length || entityId.includes(notificationEntityId))
      ) {
        const { pageSize = 10 } = paging ?? {};
        setFilterUnReadCount(count => count + 1);
        setNotifications(list => {
          const newList = [notification, ...(list || [])];
          return isMd ? newList : newList.slice(0, pageSize);
        });

        // 更新 paging.total
        updatePaging(paging.total + 1);
      }

      updateUnReadCount(x => x + 1);
    },
    [params, paging]
  );

  useSubscription(
    EVENTS.NOTIFICATION_READ,
    data => {
      const { receiver, readCount, notificationIds } = data;
      if (receiver === userDid) {
        updateUnReadCount(x => Math.max(x - readCount, 0));
        updateReadStatus(notificationIds);
        updateFilterUnReadCount(notificationIds.length);
      }
    },
    [updateUnReadCount, updateReadStatus, updateFilterUnReadCount]
  );

  /**
   * 将 notification 置为已读
   * @param {*} id
   */
  const onReadNotification = id => {
    if (!id) {
      return undefined;
    }
    const ids = Array.isArray(id) ? id : [id];
    if (!ids.length) {
      return undefined;
    }
    const response = api.readNotifications({
      input: { notificationIds: ids, receiver: userDid, teamDid: info.did },
    });
    return response;
  };

  const makeAllAsRead = useCallback(async () => {
    if (unReadCount > 0) {
      const response = await api.makeAllNotificationsAsRead({
        input: {
          receiver: userDid,
          teamDid: info.did,
        },
      });
      return response;
    }
    return undefined;
  }, [api, userDid, unReadCount, info.did]);

  const value = {
    loading,
    refresh: getData,
    data: notifications,
    filterUnReadCount,
    paging,
    api,
    params,
    onReadNotification,
    unReadCount,
    makeAllAsRead,
    blocklets,
  };

  return <Provider value={{ notifications: value }}>{children}</Provider>;
}

function useNotificationContext() {
  const { notifications } = useContext(NotificationContext);
  return notifications;
}

export { NotificationContext, NotificationProvider, Consumer as NotificationConsumer, useNotificationContext };
