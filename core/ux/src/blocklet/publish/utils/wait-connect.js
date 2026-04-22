import { get } from 'lodash';

const timers = {};

// 清理特定定时器的函数
export function clearTimerByKey(timerKey) {
  if (timers[timerKey]) {
    clearTimeout(timers[timerKey]);
    delete timers[timerKey];
  }
}

// 清理所有定时器的函数
export function clearAllTimers() {
  Object.keys(timers).forEach((key) => {
    clearTimeout(timers[key]);
    delete timers[key];
  });
}

// 导出 timers 对象以便外部访问
export { timers };

async function waitPromiseFunction(
  promiseFunction,
  { interval = 1000, maxDuration = 120 * 1000, intervalFirst = 4000, timerKey = '' }
) {
  if (timers[timerKey]) {
    clearTimeout(timers[timerKey]);
  }
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, intervalFirst));
  const start = Date.now();
  const poll = async (resolve, reject) => {
    try {
      const data = await promiseFunction();
      resolve(data);
    } catch (error) {
      if (Date.now() - start > maxDuration) {
        reject(error);
      } else if (timerKey) {
        timers[timerKey] = setTimeout(() => poll(resolve, reject), interval);
      } else {
        setTimeout(() => poll(resolve, reject), interval);
      }
    }
  };

  return new Promise(poll);
}

export function createMessageId() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + `${Date.now()}`.slice(-6);
}

export function waitGetConnectedByStudio(api, { did, projectId, messageId }) {
  return waitPromiseFunction(
    async () => {
      const res = await api.getProject({ input: { did, projectId, messageId } });
      if (!res?.project?.blockletDid) {
        throw new Error('Connected store not found');
      }
      return res.project.blockletDid;
    },
    { timerKey: 'connect-studio' }
  );
}

export function waitGetConnectedStore(api, { did, projectId, storeId }) {
  return waitPromiseFunction(
    async () => {
      const res = await api.getProject({ input: { did, projectId, messageId: '' } });
      if (!res?.project?.connectedStores?.length) {
        throw new Error('Connected store not found');
      }
      const newStore = res.project.connectedStores.find((x) => x.storeId === storeId);
      if (!newStore) {
        throw new Error('Connected store not found');
      }
    },
    { timerKey: `connect-store-${storeId}` }
  );
}

export function waitGetConnectedEndpoint(api, { did, projectId, endpointId }) {
  return waitPromiseFunction(
    async () => {
      const res = await api.getProject({ input: { did, projectId, messageId: '' } });
      if (!res?.project?.connectedEndpoints?.length) {
        throw new Error('Connected endpoint not found');
      }

      const newEndpoint = res.project.connectedEndpoints.find((x) => x.endpointId === endpointId);
      if (!newEndpoint) {
        throw new Error('Connected endpoint not found');
      }
    },
    { timerKey: `connect-store-${endpointId}` }
  );
}

export function waitGetConnectedAigne(api, { did, refresh, t, providerName, values, timerKey }) {
  return waitPromiseFunction(
    async () => {
      const { blocklet } = await api.getBlocklet({ input: { did } });
      // 获取 settings 中的 aigne 配置
      const settings = get(blocklet, 'settings.aigne', {});
      const { url, key, provider } = settings || {};
      const { key: oldKey } = values;

      // 处理 aigneHub provider 的情况
      if (provider === 'aigneHub') {
        if (!url || !key) {
          throw new Error(t('setting.aigne.connectTimeOut', { provider: providerName }));
        }
        // 如果有旧配置且key相同，说明连接超时
        if (oldKey && oldKey === key) {
          throw new Error(t('setting.aigne.connectTimeOut', { provider: providerName }));
        }
        // 配置有效，执行刷新
        await refresh();
        clearTimeout(timers[`connect-aigne-${did}`]);
      } else {
        // 非 aigneHub provider 的情况
        if (!oldKey || oldKey !== key) {
          throw new Error(t('setting.aigne.connectTimeOut', { provider: providerName }));
        }
        // 配置有效，执行刷新
        await refresh();
        clearTimeout(timers[`connect-aigne-${did}`]);
      }
    },
    { timerKey, maxDuration: 3 * 60 * 1000 } // 设置 3 分钟超时时间
  );
}
