import { joinURL } from 'ufo';
import { getConnectAppUrl } from '@blocklet/meta/lib/util';
import { getBlockletInfo } from '@blocklet/meta/lib/info';
import { WELLKNOWN_SERVICE_PATH_PREFIX } from '@abtnode/constant';
import pick from 'lodash/pick';

import { getSourceAppPid } from './login';
import Config from '../config';

export function getFederatedMasterAppInfo({
  blocklet,
  sourceAppPid,
  version,
  groupPathPrefix,
  nodeInfo,
}: {
  blocklet: any;
  sourceAppPid: string;
  version: string;
  groupPathPrefix: string;
  nodeInfo: any;
}) {
  const { federated } = blocklet.settings;
  if (!federated) {
    return null;
  }

  const master = federated.sites.find((x) => x.appPid === sourceAppPid);

  if (!master) {
    Config.logger.error('Federated master app not found', { sourceAppPid });
    // FIXME: Temporarily return null to prevent service crash
    return null;
    // throw new Error(`Federated master app not found: ${sourceAppPid}`);
  }

  return {
    name: master.appName,
    description: master.appDescription || `Connect to ${master.appName}`,
    icon: joinURL(master.appUrl, WELLKNOWN_SERVICE_PATH_PREFIX, `/blocklet/logo?v=${version}`),
    link: master.appUrl,
    updateSubEndpoint: true,
    subscriptionEndpoint: joinURL(groupPathPrefix, WELLKNOWN_SERVICE_PATH_PREFIX, 'websocket'),
    nodeDid: nodeInfo.did,
  };
}

export async function getBlockletInfoSimple(getBlocklet?: () => Promise<ABTNodeClient.BlockletState>) {
  // Used when fetching blocklet info from within a service
  if (getBlocklet && getBlocklet instanceof Function) {
    const blocklet = await getBlocklet();
    const blockletInfo = getBlockletInfo(blocklet, undefined, {
      returnWallet: false,
    });
    return {
      ...pick(blockletInfo, ['version', 'name', 'description']),
      federated: blocklet.settings?.federated || null,
      appPid: blocklet.appPid,
      blocklet,
    };
  }

  // Used when the app itself fetches its own blocklet info
  const blockletSettings = Config.getBlockletSettings();
  const federated = blockletSettings?.federated || null;
  return {
    version: Config.env.appVersion || process.env.BLOCKLET_APP_VERSION,
    name: Config.env.appName || process.env.BLOCKLET_APP_NAME,
    description: Config.env.appDescription || process.env.BLOCKLET_APP_DESCRIPTION,
    federated,
    appPid: Config.env.appPid || process.env.BLOCKLET_APP_PID,
    blocklet: {
      settings: {
        federated,
      },
    },
  };
}

export async function getAppInfo({
  request,
  baseUrl,
  getBlocklet,
  getNodeInfo,
}: {
  request: $TSFixMe;
  baseUrl: string;
  getBlocklet?: () => Promise<ABTNodeClient.BlockletState>;
  getNodeInfo: () => Promise<{ did: string }>;
}) {
  const groupPathPrefix = request.headers['x-group-path-prefix'] || '/';
  const { version, name, description, federated, blocklet } = await getBlockletInfoSimple(getBlocklet);

  const sourceAppPid = getSourceAppPid(request);
  const nodeInfo = await getNodeInfo();

  if (sourceAppPid && federated) {
    return getFederatedMasterAppInfo({
      blocklet,
      sourceAppPid,
      version,
      groupPathPrefix,
      nodeInfo,
    });
  }

  return {
    name,
    description: description || `Connect to ${name}`,
    icon: joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX, `/blocklet/logo?v=${version}`),
    link: getConnectAppUrl({ request, baseUrl }),
    updateSubEndpoint: true,
    subscriptionEndpoint: joinURL(groupPathPrefix, WELLKNOWN_SERVICE_PATH_PREFIX, 'websocket'),
    nodeDid: nodeInfo.did,
    // NOTE: publisher is auto-populated by WalletAuthenticator
  };
}

export async function getMemberAppInfo({
  request,
  baseUrl,
  getBlocklet,
  getNodeInfo,
}: {
  request: any;
  baseUrl: string;
  getBlocklet?: () => Promise<ABTNodeClient.BlockletState>;
  getNodeInfo: () => Promise<{ did: string }>;
}) {
  const groupPathPrefix = request.headers['x-group-path-prefix'] || '/';
  const sourceAppPid = getSourceAppPid(request);

  if (sourceAppPid) {
    const { version, name, description, federated, appPid } = await getBlockletInfoSimple(getBlocklet);
    if (federated) {
      const nodeInfo = await getNodeInfo();
      return {
        name,
        description: description || `Connect to ${name}`,
        icon: joinURL(baseUrl, WELLKNOWN_SERVICE_PATH_PREFIX, `/blocklet/logo?v=${version}`),
        link: getConnectAppUrl({ request, baseUrl }),
        updateSubEndpoint: true,
        subscriptionEndpoint: joinURL(groupPathPrefix, WELLKNOWN_SERVICE_PATH_PREFIX, 'websocket'),
        nodeDid: nodeInfo.did,
        // NOTICE: For member appInfo, publisher is not a delegator, so it must be set explicitly
        publisher: `did:abt:${appPid}`,
      };
    }
  }
  return null;
}
