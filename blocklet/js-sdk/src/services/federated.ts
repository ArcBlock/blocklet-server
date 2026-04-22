import isEmpty from 'lodash/isEmpty';

import type { Axios } from 'axios';
import { BlockletService } from './blocklet';

type AppInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appLogo: string;
  appPid: string;
  appUrl: string;
  version: string;
  sourceAppPid: string;
  provider: string;
};
type ServerInfo = {
  appId: string;
  appName: string;
  appDescription: string;
  appUrl: string;
  sourceAppPid: string;
  provider: string;
  type: 'server';
};

export class FederatedService {
  private api: Axios;

  private blocklet: BlockletService;

  private blockletDataCache: Record<string, any> = {};

  constructor({ api, blocklet }: { api: Axios; blocklet?: BlockletService }) {
    this.api = api;
    this.blocklet = blocklet || new BlockletService();
  }

  async getTrustedDomains(): Promise<Array<string>> {
    const { data } = await this.api.get('/api/federated/getTrustedDomains');
    return data;
  }

  getMaster(blocklet = this.blocklet.getBlocklet()) {
    const federated = blocklet?.settings?.federated;
    return federated?.master;
  }

  getConfig(blocklet = this.blocklet.getBlocklet()) {
    const federated = blocklet?.settings?.federated;
    return federated?.config;
  }

  getFederatedEnabled(blocklet = this.blocklet.getBlocklet()) {
    const config = this.getConfig(blocklet);
    return config?.status === 'approved';
  }

  getSourceAppPid(blocklet = this.blocklet.getBlocklet()) {
    const master = this.getMaster(blocklet);
    return master?.appPid;
  }

  getFederatedApp(blocklet = this.blocklet.getBlocklet()): AppInfo | null {
    const master = this.getMaster(blocklet);
    const isFederatedMode = !isEmpty(master);
    if (!isFederatedMode) {
      return null;
    }
    return {
      appId: master.appId,
      appName: master.appName,
      appDescription: master.appDescription,
      appLogo: master.appLogo,
      appPid: master.appPid,
      appUrl: master.appUrl,
      version: master.version,
      sourceAppPid: master.appPid,
      provider: 'wallet',
    };
  }

  getCurrentApp(blocklet = this.blocklet.getBlocklet()): AppInfo | ServerInfo {
    // When running inside a blocklet project
    if (blocklet) {
      return {
        appId: blocklet.appId,
        appName: blocklet.appName,
        appDescription: blocklet.appDescription,
        appLogo: blocklet.appLogo,
        appPid: blocklet.appPid,
        appUrl: blocklet.appUrl,
        version: blocklet.version,
        // NOTICE: null explicitly clears the value
        sourceAppPid: null,
        provider: 'wallet',
      };
    }
    // HACK: Fallback for blocklet-server context
    if (window.env) {
      const server = window.env!;
      return {
        appId: server.appId,
        appName: server.appName,
        appDescription: server.appDescription,
        appUrl: server.baseUrl,
        // NOTICE: null explicitly clears the value
        sourceAppPid: null,
        provider: 'wallet',
        type: 'server',
      };
    }
    return null;
  }

  getApps(blocklet = this.blocklet.getBlocklet()) {
    const appList = [];

    const masterApp = this.getFederatedApp(blocklet);
    const currentApp = this.getCurrentApp(blocklet);
    const federatedEnabled = this.getFederatedEnabled(blocklet);

    if (currentApp) {
      appList.push(currentApp);
    }
    if (masterApp && masterApp?.appId !== currentApp?.appId && federatedEnabled) {
      appList.push(masterApp);
    }
    // NOTICE: masterApp should appear first in the list
    return appList.reverse();
  }

  async getBlockletData(appUrl: string, force = false) {
    if (!force && this.blockletDataCache[appUrl]) {
      return this.blockletDataCache[appUrl];
    }

    try {
      const url = new URL('__blocklet__.js', appUrl);
      url.searchParams.set('type', 'json');
      const res = await fetch(url.href);
      const jsonData = await res.json();
      this.blockletDataCache[appUrl] = jsonData;
      return jsonData;
    } catch (err) {
      console.error(`Failed to get blocklet data: ${appUrl}`, err);
      return null;
    }
  }
}
