import { join } from 'path';
import type { AxiosRequestConfig, AxiosResponse, Method } from 'axios';
import { IncomingMessage } from 'http';
import get from 'lodash/get';
import noop from 'lodash/noop';
import { joinURL } from 'ufo';
import pRetry from 'p-retry';
import waitPort from 'wait-port';
import { BlockletStatus, PROJECT } from '@blocklet/constant';
import Debug from 'debug';

import Config, { getComponents, MountPoint, reduceNextLoadTime } from '../config';
import * as Util from './util';
import type { Resource } from './util';
import componentApi from '../util/component-api';
import { parseDockerComponentEndpoint, parseDockerComponentHost } from '../util/parse-docker-endpoint';

const debug = Debug('@blocklet/sdk:component');

type RetryOptions = {
  retries?: number;
  factor?: number;
  randomize?: boolean;
  minTimeout?: number;
  maxTimeout?: number;
  onFailedAttempt?: (error: any) => void | Promise<void>;
};

const getComponent = (name: string): MountPoint => {
  const item = getComponents().find((x) => [x.title, x.name, x.did].includes(name));
  return item;
};

const getComponentWebEndpoint = (keyword: string) => {
  const item = getComponent(keyword);
  const endpoint = item ? item.webEndpoint : '';
  return parseDockerComponentEndpoint(endpoint, item);
};

// eslint-disable-next-line require-await
const doCall = (
  {
    url,
    componentName,
    callPath,
    headers = {},
    ...options
  }: AxiosRequestConfig & { componentName?: string; callPath?: string },
  retryOptions: RetryOptions = {}
) =>
  pRetry(
    async () => {
      const startTime = Date.now();
      let realUrl = url;
      if (componentName && callPath) {
        const component = getComponent(componentName);
        if (!component) {
          throw new Error(`can not find component ${componentName}`);
        }
        const baseURL = parseDockerComponentEndpoint(component.webEndpoint, component);
        if (!baseURL) {
          throw new Error(`can not find web endpoint for ${componentName}`);
        }
        realUrl = joinURL(baseURL, callPath);
      }

      try {
        const res = await componentApi({
          url: realUrl,
          timeout: 60 * 1000,
          ...options,
          headers,
        });
        const duration = Date.now() - startTime;
        debug(`component.call to ${componentName} succeed in ${duration}ms: ${url} `);
        return res;
      } catch (error) {
        const duration = Date.now() - startTime;
        Config.logger.error(`component.call failed in ${duration}ms`, {
          url,
          componentName,
          responseStatus: get(error, 'response.status'),
          responseData: get(error, 'response.data'),
          error: get(error, 'message'),
        });

        // Do not retry if the response status indicates a client error
        if (error.response && error.response.status < 500 && error.response.status >= 400) {
          throw new pRetry.AbortError(error);
        }

        // Do not retry if getaddrinfo ENOTFOUND
        if (
          error.message &&
          (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('timeout of'))
        ) {
          // If the load timed out, reduce the next load interval to maxTime
          reduceNextLoadTime(1000);
          throw new pRetry.AbortError(error);
        }

        throw error;
      }
    },
    {
      retries: typeof retryOptions.retries === 'undefined' ? 3 : retryOptions.retries,
      factor: retryOptions.factor || 2,
      randomize: retryOptions.randomize || true,
      minTimeout: retryOptions.minTimeout || 500,
      maxTimeout: retryOptions.maxTimeout || 5000,
      onFailedAttempt: retryOptions.onFailedAttempt || noop,
    }
  );

type CallComponentOptions<D = any, P = any> = {
  name?: string;
  method?: Method;
  path: string;
  data?: D;
  params?: P;
  headers?: { [key: string]: any };
  timeout?: number;
};

type CallComponent = {
  (
    options: CallComponentOptions & { responseType: 'stream' },
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<IncomingMessage>>;
  <T = any, D = any, P = any>(
    options: CallComponentOptions<D, P>,
    retryOptions?: RetryOptions
  ): Promise<AxiosResponse<T, D>>;
};

const call: CallComponent = async (
  { name, method = 'POST', path: _path, ...options }: any,
  retryOptions: RetryOptions = {}
) => {
  if (!name) {
    throw new Error('component.call: name is required');
  }

  try {
    const resp = await doCall({ url: '', componentName: name, callPath: _path, method, ...options }, retryOptions);
    return resp;
  } catch (error) {
    const component = getComponent(name);
    if (component.status !== BlockletStatus.running) {
      throw new Error(`component ${name} is not running, status: ${component.status}`);
    }
    throw error;
  }
};

const getComponentMountPoint = (keyword: string) => {
  const item = getComponent(keyword);
  return item ? item.mountPoint : '';
};

const getUrl = (...parts: string[]): string => {
  const { BLOCKLET_COMPONENT_DID, BLOCKLET_APP_URL } = process.env;
  const mountPoint = getComponentMountPoint(BLOCKLET_COMPONENT_DID);
  return joinURL(BLOCKLET_APP_URL, mountPoint === '/' ? '' : mountPoint, ...parts);
};

const getRelativeUrl = (...parts: string[]): string => {
  const { BLOCKLET_COMPONENT_DID } = process.env;
  const mountPoint = getComponentMountPoint(BLOCKLET_COMPONENT_DID);
  return joinURL(mountPoint === '/' ? '' : mountPoint, ...parts);
};

const getResourceExportDir = (
  { projectId, releaseId }: { projectId: string; releaseId?: string } = { projectId: '' }
) => {
  if (!projectId) {
    throw new Error('projectId is required');
  }
  const dirArr = [process.env.BLOCKLET_APP_DATA_DIR!, PROJECT.DIR, projectId || '/'];
  if (releaseId) {
    dirArr.push(PROJECT.RELEASE_DIR, releaseId || '/');
  }
  dirArr.push(PROJECT.RESOURCE_DIR);
  const dir = join(...dirArr);
  return dir;
};

const getReleaseExportDir = ({ projectId, releaseId }: { projectId: string; releaseId?: string }) => {
  if (!projectId) {
    throw new Error('getReleaseExportDir: projectId is required');
  }
  const dirArr = [process.env.BLOCKLET_APP_DATA_DIR!, PROJECT.DIR, projectId];
  if (releaseId) {
    dirArr.push(PROJECT.RELEASE_DIR, releaseId || '/');
  }
  const dir = join(...dirArr);
  return dir;
};

const getResources = ({
  scope = 'all',
  types,
  skipRunningCheck,
}: {
  scope?: 'all' | 'pack' | 'excludePack';
  did?: string;
  types?: { did: string; type: string }[];
  skipRunningCheck?: boolean;
} = {}): Resource[] => {
  return Util.getResources({ components: getComponents(), scope, types, skipRunningCheck });
};

const getPackResources = ({
  types,
}: {
  types?: { did: string; type: string }[];
} = {}): Resource[] => {
  return Util.getResources({ components: getComponents(), scope: 'pack', types, ignorePublic: true });
};

const waitForComponentRunning = async (name: string, timeout: number = 30000, interval: number = 250) => {
  const component = getComponent(name);
  if (!component) {
    throw new Error(`can not find component ${name}`);
  }

  const { port } = component;
  if (!port) {
    throw new Error(`can not find port for component ${name}`);
  }

  const result = await waitPort({ host: parseDockerComponentHost(component), port, timeout, interval });
  if (typeof result === 'boolean' && result) {
    return true;
  }
  if (typeof result.open === 'boolean' && result.open) {
    return true;
  }

  throw new Error(`component ${name} is not running or unreachable`);
};

export { call };
export { getUrl };
export { getRelativeUrl };
export { getComponentMountPoint };
export { getComponentWebEndpoint };
export { waitForComponentRunning };
export { getResourceExportDir };
export { getReleaseExportDir };
export { getResources };
export { getPackResources };

export default {
  call,
  getUrl,
  getRelativeUrl,
  getComponentMountPoint,
  getComponentWebEndpoint,
  waitForComponentRunning,
  getResourceExportDir,
  getReleaseExportDir,
  getResources,
  getPackResources,
};
