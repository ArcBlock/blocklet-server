import { joinURL, withQuery } from 'ufo';
import pWaitFor from 'p-wait-for';
import { request } from './request';

export const fetchConfigs = async ({
  connectUrl,
  sessionId,
  fetchInterval,
  fetchTimeout,
  connectAction,
}: {
  connectUrl: string;
  sessionId: string;
  fetchInterval: number;
  fetchTimeout: number;
  connectAction: string;
}) => {
  const ENDPOINT_CHECK_SESSION = `/api/did/${connectAction}/status`;
  const ENDPOINT_INVALIDATE_SESSION = `/api/did/${connectAction}/timeout`;

  const fetchSessionStatus = async () => {
    const url = withQuery(joinURL(connectUrl, ENDPOINT_CHECK_SESSION), { _t_: sessionId });

    const { data } = await request({
      url,
      method: 'GET',
      timeout: fetchTimeout,
    });
    return data;
  };

  const condition = async () => {
    const { status, error } = await fetchSessionStatus();
    if (status === 'error' || !!error) {
      throw new Error(error);
    }
    return status === 'succeed';
  };

  try {
    await pWaitFor(condition, { interval: fetchInterval, timeout: fetchTimeout });
    const { config } = await fetchSessionStatus();
    return config;
  } catch (e) {
    const err = e as Error;
    // On CLI timeout, invalidate the sessionId to keep CLI and store states in sync
    if (err.name === 'TimeoutError') {
      await request({
        url: withQuery(joinURL(connectUrl, ENDPOINT_INVALIDATE_SESSION), {
          _t_: sessionId,
        }),
        method: 'GET',
        timeout: fetchTimeout,
      });
    }
    throw err;
  }
};
