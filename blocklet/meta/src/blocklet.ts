import path from 'path';
import type { BlockletState, ComponentState } from '@blocklet/server-js';
import { BLOCKLET_RESOURCE_DIR, BlockletStatus } from '@blocklet/constant';

import { forEachComponentV2Sync, findWebInterfacePort, findWebInterface, findDockerInterface } from './util';

type TComponentInternalInfo = {
  title: string;
  did: string;
  name?: string;
  version: string;
  mountPoint: string;
  status?: number;
  port?: number;
  containerPort?: string;
  resources?: string[];
  resourcesV2?: { path: string; public?: boolean }[];
  group?: string;
  isGreen?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getComponentResourcesPath = (component: ComponentState): string[] => {
  return [];
};

const getComponentResourcesPathV2 = (component: ComponentState): { path: string; public?: boolean }[] => {
  const appDir = (component.environments || []).find((y) => y.key === 'BLOCKLET_APP_DIR')?.value;
  if (!appDir) {
    return [];
  }

  const resourceDir = path.join(appDir, BLOCKLET_RESOURCE_DIR);

  return (component.meta?.resource?.bundles || [])
    .map((y) => {
      const { did, type, public: isPublic } = y;
      const res = path.join(resourceDir, did, type);
      if (!res.startsWith(resourceDir)) {
        // Invalid resource path
        return null;
      }
      return { path: res, public: isPublic };
    })
    .filter(Boolean);
};

const getComponentsInternalInfo = (app: BlockletState): Array<TComponentInternalInfo> => {
  const components = [];

  if (!app) {
    return components;
  }

  forEachComponentV2Sync(app, (x: ComponentState) => {
    const component: TComponentInternalInfo = {
      title: x.meta.title,
      did: x.meta.did,
      name: x.meta.name,
      version: x.meta.version,
      mountPoint: x.mountPoint || '',
      status: x.status,
      port: findWebInterfacePort(x as unknown as BlockletState) || 0,
      containerPort: '',
      resources: getComponentResourcesPath(x),
      resourcesV2: getComponentResourcesPathV2(x),
      group: x.meta.group,
      isGreen: x.greenStatus === BlockletStatus.running,
    };

    if (x.greenStatus === BlockletStatus.running) {
      component.status = BlockletStatus.running;
    }

    const webInterface =
      findWebInterface(x as unknown as BlockletState) || findDockerInterface(x as unknown as BlockletState);
    component.containerPort = `${webInterface?.containerPort || ''}`;

    components.push(component);
  });

  return components;
};

export { getComponentsInternalInfo, TComponentInternalInfo };

export default {
  getComponentsInternalInfo,
};
