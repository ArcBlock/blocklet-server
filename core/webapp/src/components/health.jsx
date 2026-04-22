import { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Toast from '@arcblock/ux/lib/Toast';

import { useLocaleContext } from '@arcblock/ux/lib/Locale/context';
import { EVENTS } from '@abtnode/constant';

import getWsClient, { useSubscription } from '../libs/ws';
import { useNodeContext } from '../contexts/node';

const HealthStatus = {
  normal: 'success',
  warning: 'warning',
  error: 'error',
};

export default function Health() {
  /**
   * health: {
   *   status: HealthStatus
   *   message: String
   * }
   */
  const [health, setHealth] = useState({
    status: HealthStatus.normal,
    message: '',
  });
  const [open, setOpen] = useState(false);
  const { t } = useLocaleContext();
  const { info: nodeInfo = {} } = useNodeContext();

  // check access url
  useEffect(() => {
    if (Number(nodeInfo.port) === Number(window.location.port)) {
      const host = window.location.origin.replace(`:${window.location.port}`, '');
      const endpoint = `${host}${nodeInfo.routing.adminPath}`;
      Toast.error(`${t('health.wrongAccessUrlTip')} ${endpoint}`, {
        autoHideDuration: 1000 * 86400,
      });
    }
  }, [nodeInfo]); // eslint-disable-line

  // heartbeat
  useEffect(() => {
    const client = getWsClient();
    const maxTries = 4;
    const heartbeatIntervalMs = 2000;
    let tries = 0;
    let heartbeatTimer;
    const onConnectError = () => {
      setHealth({
        status: HealthStatus.error,
        message: t('health.connectionErrorTip'),
      });
    };
    const onConnectSuccess = () => {
      if (health.status !== HealthStatus.normal) {
        setHealth({
          status: HealthStatus.normal,
          message: t('health.connectionRecoveryTip'),
        });
      }
    };

    const startHeartBeat = () => {
      if (!client || !client.isConnected()) {
        if (tries === maxTries) {
          onConnectError();
        }
        tries = (tries + 1) % (maxTries + 1);
      } else {
        onConnectSuccess();
        tries = 0;
      }
      heartbeatTimer = setTimeout(startHeartBeat, heartbeatIntervalMs);
    };

    // 第一次轮训的时间是 heartbeatIntervalMs * 4, retry次数为0. 之后每次轮训的时间是 heartbeatIntervalMs, retry 次数是 maxTries
    // e.g
    //    收到 node.stopped 消息后(此时 node 并没有真正 stop), status 由 success 变为 error, 重新开始首次轮询
    //    较长的首次间隔时间确保第一次请求时 node 已经 stop 完成
    tries = maxTries;
    heartbeatTimer = setTimeout(startHeartBeat, heartbeatIntervalMs * 4);
    return () => {
      clearInterval(heartbeatTimer);
    };
  }, [health.status, t]); // eslint-disable-line

  // ui control(toast)
  useEffect(() => {
    let timer;
    const durning = 3000;
    if (health.status === HealthStatus.normal && open === true) {
      timer = setTimeout(() => {
        setOpen(false);
      }, durning);
    } else if (health.status !== HealthStatus.normal && open === false) {
      setOpen(true);
    }
    return () => {
      clearTimeout(timer);
    };
  }, [health.status, open]); // eslint-disable-line

  // receive server push health status
  useSubscription(
    EVENTS.NODE_STOPPED,
    () => {
      setHealth({
        status: 'error',
        message: t('health.connectionStoppedTip'),
      });
    },
    [t]
  );

  return (
    <Snackbar open={open} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert severity={health.status}>{health.message}</Alert>
    </Snackbar>
  );
}
