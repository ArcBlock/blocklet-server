// 获取blocklet在节点上的状态
import { useEffect, useRef } from 'react';
import { BlockletStatus, BlockletEvents } from '@blocklet/constant';
import useSetState from 'react-use/lib/useSetState';
import Debug from 'debug';

import getWsClient from '../libs/ws';
import { useNodeContext } from './node';

const debug = Debug('@abtnode/webapp:launch-blocklet:runtime-state');

/**
 *
 * @see: https://github.com/ArcBlock/blocklet-server/blob/cd80b9e1617a9b3ced64120e015912f63ffef805/blocklet/meta/lib/constants.js#L10-L26
 * @typedef {{
 *  meta: {
 *    did: string,
 *  },
 *  status: number,
 *  error?: {
 *    message: string
 *  },
 * }} RuntimeBlocklet
 * @returns
 */

const BlockletStatusKeys = Object.keys(BlockletStatus);
const BlockletStatusValues = Object.values(BlockletStatus);

const FilteredBlockletEvents = Object.values(BlockletEvents).filter(
  x => ![BlockletEvents.purchaseChange, BlockletEvents.domainStatus].includes(x)
);

const isCurrentBlocklet = (blocklet, did) => blocklet?.appDid === did || blocklet?.meta?.did === did;

const POLLING_DELAY = 8 * 1000;
const POLLING_INTERVAL = 2 * 1000;

/**
 * 请确保在登录状态下传入 appDid
 *
 * @return {{
 *  status: string
 *  eventName: string,
 * }}
 */
export default function useRuntimeBlockletState(appDid) {
  const { api } = useNodeContext();
  const wsClient = getWsClient();
  const timer = useRef(null);

  const startPolling = () => {
    if (appDid && !timer.current) {
      timer.current = setInterval(() => {
        if (appDid) {
          debug('polling blocklet state');
          // eslint-disable-next-line no-use-before-define
          getBlockletState();
        }
      }, POLLING_INTERVAL);
    }
  };

  const [blockletState, setBlockletState] = useSetState({
    status: null, // null代表没有查找到状态，空字符串代表未安装
    eventName: '',
    runtimeBlocklet: null,
    error: '', // 当触发 error 事件，才会有这个数据
    isGetBlocklet: false,
    startPolling,
    stopPolling: () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    },
  });

  const getBlockletState = () => {
    api
      .getBlocklet({ input: { did: appDid, attachRuntimeInfo: true } })
      .then(e => {
        setBlockletState({
          status: e.blocklet ? e.blocklet.status : '',
          eventName: '',
          runtimeBlocklet: e.blocklet,
          isGetBlocklet: true, // 证明是通过 getBlocklet 接口获取的数据
        });
      })
      .catch(err => {
        console.error('get blocklet failed', err);
      });
  };

  useEffect(() => {
    let t = null;
    if (appDid) {
      debug('schedule polling blocklet state');
      t = setTimeout(() => {
        startPolling();
      }, POLLING_DELAY);
    }

    return () => {
      if (t) {
        clearInterval(t);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appDid]);

  // 首次更新加载blocklet状态
  useEffect(() => {
    if (appDid) {
      // 没有初始状态就主动查询一次
      if (blockletState.status === null) {
        debug('polling blocklet state on start');
        getBlockletState();
      }
    } else {
      setBlockletState({
        status: '',
        eventName: '',
        runtimeBlocklet: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appDid, blockletState.status]);

  const defaultBlockletEventHandler = blockletEventName => {
    return blocklet => {
      if (isCurrentBlocklet(blocklet, appDid)) {
        const bState = {
          status: null,
          eventName: blockletEventName,
          runtimeBlocklet: blocklet,
          isGetBlocklet: false,
        };

        if (blocklet.error) {
          debug('blocklet error', { blockletEventName, error: blocklet.error });
          bState.status = 'error';
          bState.error = blocklet.error;
        } else {
          const status = BlockletStatusKeys[BlockletStatusValues.indexOf(blocklet.status)];
          debug('blocklet event', { blockletEventName, status });
          // 服务端添加安装的事件后，这里的 status 可能为空
          if (status) {
            bState.status = status;
          }
        }
        setBlockletState(bState);
      }
    };
  };

  for (const blockletEventName of FilteredBlockletEvents) {
    // eslint-disable-next-line
    useEffect(() => {
      const cb = defaultBlockletEventHandler(blockletEventName);
      if (appDid) {
        wsClient.on(blockletEventName, cb);
      }

      return () => {
        if (appDid) {
          wsClient.off(blockletEventName, cb);
        }
      };
    }, [appDid]); // eslint-disable-line
  }

  return blockletState;
}
