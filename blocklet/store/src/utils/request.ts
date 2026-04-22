import axios from '@abtnode/util/lib/axios';

export function request(options: Record<string, unknown>) {
  return axios({
    maxContentLength: Number.POSITIVE_INFINITY,
    maxBodyLength: Number.POSITIVE_INFINITY,
    ...options,
  });
}
