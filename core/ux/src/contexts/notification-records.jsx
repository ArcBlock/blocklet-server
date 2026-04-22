import Toast from '@arcblock/ux/lib/Toast';
import { useContext, createContext, useState, useCallback, useEffect } from 'react';
import { useCreation } from 'ahooks';
import dayjs from '@abtnode/util/lib/dayjs';
import { NOTIFICATION_SEND_CHANNEL, EVENTS } from '@abtnode/constant';
import { useNodeContext } from './node';

const NotificationRecordsContext = createContext({});
const { Provider, Consumer } = NotificationRecordsContext;

// eslint-disable-next-line react/prop-types
function NotificationRecordsProvider({ children, blocklet = '' }) {
  const {
    api: client,
    inService,
    ws: { useSubscription },
  } = useNodeContext();

  const [records, setRecords] = useState([]);
  const [paging, setPaging] = useState({ total: 0, pageSize: 20, pageCount: 0, page: 1 });
  const teamDid = useCreation(() => blocklet.meta?.did, [blocklet]);
  const [componentDids, setComponentDids] = useState([]);
  const [params, setParams] = useState({});

  const recordIdsSet = useCreation(() => {
    if (!records.length) {
      return new Set();
    }
    return new Set(records.map((x) => x.id));
  }, [records]);

  const fetchRecords = async ({ page = 1, pageSize = 20, ...rest } = {}) => {
    if (!teamDid) {
      return [];
    }
    try {
      const queryParams = {
        paging: {
          page,
          pageSize,
        },
        ...rest,
        teamDid,
        dateRange: rest.dateRange
          ? [dayjs(rest.dateRange[0]).toISOString(), dayjs(rest.dateRange[1]).toISOString()]
          : undefined,
      };
      const { dids, ...otherParams } = queryParams;
      let source = '';
      if (dids && dids.includes('system')) {
        source = 'system';
      }
      const components = dids ? dids.filter((x) => x !== 'system') : [];
      const payload = {
        ...otherParams,
        source,
        componentDids: components,
      };
      const res = await client.getNotificationSendLog({ input: payload });

      setParams(payload);
      setRecords(res.list);
      setPaging(res.paging);
      return res.list;
    } catch (err) {
      Toast.error(err.message);
      return [];
    }
  };

  const getComponentDids = async () => {
    const res = await client.getNotificationComponents({ input: { teamDid } });
    setComponentDids(res.componentDids);
  };

  const getComponent = useCallback(
    (componentDid) => {
      const target = blocklet.children.find((x) => x.meta?.did === componentDid);
      if (target) {
        target.ancestors = [blocklet];
        return target;
      }
      return undefined;
    },
    [blocklet]
  );

  const resendNotification = async ({ notificationId, receivers, channels, ...rest }) => {
    await client.resendNotification({
      input: {
        teamDid,
        notificationId,
        receivers,
        channels: channels.map((x) => {
          if (x === 'wallet') {
            return NOTIFICATION_SEND_CHANNEL.WALLET;
          }
          if (x === 'pushKit') {
            return NOTIFICATION_SEND_CHANNEL.PUSH;
          }
          return x;
        }),
        ...rest,
      },
    });
  };

  const getUser = useCallback(
    async (did) => {
      const response = await client.getUser({
        input: { teamDid, user: { did }, options: { enableConnectedAccount: true } },
      });
      return response.user;
    },
    [client, teamDid]
  );

  /**
   * 获取通知接收者列表
   */
  const getReceivers = useCallback(
    async ({ page = 1, pageSize = 20, ...rest } = {}) => {
      try {
        const queryParams = {
          paging: {
            page,
            pageSize,
          },
          ...rest,
          userName: rest.searchText || '',
          teamDid,
          dateRange: rest.dateRange
            ? [dayjs(rest.dateRange[0]).toISOString(), dayjs(rest.dateRange[1]).toISOString()]
            : undefined,
        };
        const response = await client.getReceivers({ input: queryParams });
        return response;
      } catch (err) {
        Toast.error(err.message);
        throw err;
      }
    },
    [client, teamDid]
  );

  useEffect(() => {
    if (teamDid) {
      getComponentDids();
    }
  }, [teamDid]); // eslint-disable-line

  // 更新通知时，更新记录
  useSubscription(
    EVENTS.NOTIFICATION_BLOCKLET_UPDATE,
    (data) => {
      if (recordIdsSet.has(data.notificationId)) {
        fetchRecords(params);
      }
    },
    [recordIdsSet, params]
  );

  // 创建通知时，更新记录
  useSubscription(
    EVENTS.NOTIFICATION_BLOCKLET_CREATE,
    (data) => {
      if (!recordIdsSet.has(data.id)) {
        fetchRecords(params);
      }
    },
    [recordIdsSet, params]
  ); // eslint-disable-line

  const value = {
    fetch: fetchRecords,
    data: records,
    paging,
    blocklet,
    getComponent,
    resendNotification,
    getUser,
    componentDids,
    getReceivers,
    inService,
    teamDid,
  };

  return <Provider value={{ notificationRecords: value }}>{children}</Provider>;
}

function useNotificationRecordsContext() {
  const { notificationRecords } = useContext(NotificationRecordsContext);
  return notificationRecords;
}

export {
  NotificationRecordsContext,
  NotificationRecordsProvider,
  Consumer as NotificationRecordsConsumer,
  useNotificationRecordsContext,
};
