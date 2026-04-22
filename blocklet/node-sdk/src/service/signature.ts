import Axios from 'axios';
import { blockletEnv } from '@blocklet/env';
import { SerializedWallet } from '@ocap/wallet';
import Debug from 'debug';
import omit from 'lodash/omit';
import { DIDTypeArg } from '@arcblock/did';
import { EncodingType } from '@ocap/util';
import { formatError } from '@blocklet/error';
import { SERVICE_PREFIX } from '../util/constants';
import { getServerHost } from '../util/parse-docker-endpoint';

const debug = Debug('@blocklet/sdk:remote-sign');

const { serverVersion } = blockletEnv;

const signClient = Axios.create({
  proxy: false,
  baseURL: `http://${getServerHost()}:${process.env.ABT_NODE_SERVICE_PORT}${SERVICE_PREFIX}`,
  timeout: 30 * 1000,
  headers: {
    'User-Agent': `BlockletSDK/${serverVersion}`,
    'x-blocklet-server-version': serverVersion,
    'x-blocklet-did': process.env.BLOCKLET_DID,
    'x-component-did': process.env.BLOCKLET_COMPONENT_DID,
  },
});

export interface RemoteSignResponse {
  signature: string;
  publicKey?: string;
}

export interface RemoteSignJWTResponse {
  token: string;
  publicKey?: string;
}

export interface RemoteSignETHResponse {
  signature: string;
  publicKey?: string;
}

export interface RemoteSignOptions {
  keyType?: 'sk' | 'psk';
  type?: DIDTypeArg;
  doSign?: boolean;
  version?: string;
  encoding?: EncodingType;
  hashBeforeSign?: boolean;
}

const ensureRemoteContext = () => {
  const { BLOCKLET_DID, BLOCKLET_REAL_DID, BLOCKLET_COMPONENT_API_KEY } = process.env;

  if (!BLOCKLET_DID || !BLOCKLET_REAL_DID) {
    throw new Error('Missing blocklet runtime context for remote signing: require BLOCKLET_DID and BLOCKLET_REAL_DID');
  }

  if (!BLOCKLET_COMPONENT_API_KEY) {
    throw new Error('Missing BLOCKLET_COMPONENT_API_KEY for remote signing');
  }

  return { apiKey: BLOCKLET_COMPONENT_API_KEY, did: BLOCKLET_DID, realDid: BLOCKLET_REAL_DID };
};

const normalizePayload = (payload: unknown): unknown => {
  if (Buffer.isBuffer(payload)) {
    return {
      __type: 'buffer',
      data: payload.toString('hex'),
    };
  }

  return payload;
};

const getPayloadInfo = (payload): { payloadPreview?: string; payloadType?: string } => {
  if (payload !== undefined) {
    if (typeof payload === 'string') {
      return { payloadPreview: payload.substring(0, 100), payloadType: 'string' };
    }
    if (Buffer.isBuffer(payload)) {
      return { payloadPreview: `Buffer(${payload.length} bytes)`, payloadType: 'Buffer' };
    }
    if (typeof payload === 'object') {
      const preview = JSON.stringify(payload).substring(0, 100);
      return { payloadPreview: preview, payloadType: 'object' };
    }
  }
  return {};
};

/**
 * Generic remote signing API caller
 * @param endpoint - API endpoint (e.g., '/api/sign', '/api/sign/jwt')
 * @param requestBody - Request body to send
 * @returns API response data
 */
async function callRemoteSignAPI<T>(endpoint: string, requestBody: Record<string, any>): Promise<T> {
  const { apiKey } = ensureRemoteContext();
  const startTime = Date.now();

  // Prepare payload preview for logging (avoid logging sensitive data)
  const payloadInfo = getPayloadInfo(requestBody.payload);

  debug(`Remote Sign API call started: ${endpoint}`, {
    ...payloadInfo,
    body: omit(requestBody, 'payload'),
  });

  try {
    const { data } = await signClient.post(endpoint, {
      ...requestBody,
      apiKey,
    });

    const duration = Date.now() - startTime;
    debug(`Remote Sign API call succeeded: ${endpoint} in ${duration}`, {
      responseKeys: Object.keys(data),
    });

    return data as T;
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = formatError(error);

    debug(`Remote Sign API call failed: ${endpoint} in ${duration}`, {
      message,
    });

    throw new Error(`Remote signing API request failed: ${message}`);
  }
}

export function remoteSign(payload: unknown, options?: RemoteSignOptions): Promise<RemoteSignResponse> {
  const normalized = normalizePayload(payload);
  return callRemoteSignAPI<RemoteSignResponse>('/api/sign', { payload: normalized, options });
}

export function remoteSignJWT(payload: unknown, options?: any): Promise<RemoteSignJWTResponse> {
  return callRemoteSignAPI<RemoteSignJWTResponse>('/api/sign/jwt', { payload, options });
}

export function remoteSignETH(data: string, options?: RemoteSignOptions): Promise<RemoteSignETHResponse> {
  const { hashBeforeSign, ...restOptions } = options || {};
  return callRemoteSignAPI<RemoteSignETHResponse>('/api/sign/eth', { data, hashBeforeSign, options: restOptions });
}

export function remoteDeriveWallet(
  sub: string,
  type?: any,
  index?: number,
  options?: RemoteSignOptions
): Promise<SerializedWallet> {
  return callRemoteSignAPI<SerializedWallet>('/api/sign/derive', { sub, type, index, options });
}
