import { encodeEncryptionKey } from '@abtnode/util/lib/security';
import get from 'lodash/get';
import tweetnacl from 'tweetnacl';
import SealedBox from 'tweetnacl-sealedbox-js';
import { joinURL, withQuery } from 'ufo';
import { request } from './utils/request';
import { fetchConfigs } from './utils/fetch-configs';
import { baseWrapSpinner } from './utils/base-wrap-spinner';

interface CreateConnectOptions {
  connectUrl?: string;
  openPage?: (url: string) => void;
  fetchTimeout?: number;
  fetchInterval?: number;
  retry?: number;
  source?: string;
  connectAction?: string;
  enableEncrypt?: boolean;
  wrapSpinner?: typeof baseWrapSpinner;
  projectId?: string;
  monikers?: string;
  userDid?: string;
  prettyUrl?: (url: string) => string;
  closeOnSuccess?: boolean;
}

export async function createConnect({
  connectUrl = 'https://store.blocklet.dev',
  openPage,
  fetchTimeout = 30 * 1000,
  fetchInterval = 3 * 1000,
  retry = 1500,
  source = 'Blocklet CLI',
  connectAction = 'connect-cli',
  wrapSpinner = baseWrapSpinner,
  projectId,
  userDid,
  enableEncrypt = false,
  closeOnSuccess,
  monikers,
  prettyUrl,
  ...restParams
}: CreateConnectOptions = {}) {
  const ENDPOINT_CREATE_SESSION = `/api/did/${connectAction}/token`;
  const DID_CONNECT_URL = `/${connectAction}`;

  const keyPair = tweetnacl.box.keyPair();
  const decrypt = (value: string) => {
    const decrypted = SealedBox.open(
      Uint8Array.from(Buffer.from(value, 'base64')),
      keyPair.publicKey,
      keyPair.secretKey,
    );
    return JSON.parse(Buffer.from(decrypted).toString('utf8'));
  };
  const BLOCKLET_JSON_PATH = '__blocklet__.js?type=json';
  let masterSite;
  try {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const { data: blocklet } = await request({
      url: joinURL(connectUrl, BLOCKLET_JSON_PATH),
      method: 'GET',
      timeout: fetchTimeout,
    });

    if (blocklet?.settings?.federated?.config?.status === 'approved') {
      masterSite = blocklet?.settings?.federated?.master;
    }
  } catch {
    /* empty */
  }

  try {
    const mergeParams = {
      _ek_: encodeEncryptionKey(keyPair.publicKey),
      sourceAppPid: masterSite?.appPid || undefined,
      projectId,
      userDid,
      monikers,
      source,
      ...restParams,
    };

    // Create session, build the connect URL, and open the connect page
    const connectInfo = new URL(connectUrl);
    const res = await request({
      url: joinURL(connectUrl, ENDPOINT_CREATE_SESSION),
      params: mergeParams, // for sensitive info encryption
      method: 'GET',
      timeout: fetchTimeout,
      headers: {
        'x-real-port': connectInfo.port,
        'x-real-hostname': connectInfo.hostname,
        'x-real-protocol': connectInfo.protocol,
      },
    });
    const { url, token } = res.data;
    const pageUrl = withQuery(joinURL(connectUrl, DID_CONNECT_URL), {
      __connect_url__: encodeEncryptionKey(url),
      source,
      closeOnSuccess,
    });
    // NOTICE: This console.info intentionally prints the URL for CLI users; do not remove
    // eslint-disable-next-line no-console
    console.info(
      'If browser does not open automatically, please open the following link in your browser: ',
      prettyUrl?.(pageUrl) || pageUrl,
    );
    openPage?.(pageUrl);

    // Wait for authentication to complete and retrieve configuration
    return await wrapSpinner(`Waiting for connection: ${connectUrl}`, async () => {
      const fetchData = await fetchConfigs({
        connectUrl,
        sessionId: token,
        connectAction,
        fetchTimeout: retry * fetchInterval,
        fetchInterval: retry,
      });
      const decryptData = enableEncrypt && fetchData ? decrypt(fetchData) : fetchData;
      return decryptData;
    });
  } catch (e) {
    const err = e as Error;
    const response = get(err, 'response') as unknown as Record<string, string>;
    let errorMessage: string;
    if (response) {
      errorMessage = get(response, 'data.error', response.statusText) || '';
      errorMessage = `[${response.status}] ${errorMessage}`;
    } else {
      errorMessage = err.message;
    }
    throw new Error(`failed to connect to store (${errorMessage})`);
  }
}
