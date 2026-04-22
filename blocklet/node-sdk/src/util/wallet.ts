import type { Request } from 'express';

/**
 *
 * Determine whether the request originates from a DID Connect wallet session
 * @export
 */
export function isDidWalletConnect(headers: Request['headers']) {
  const userAgent = (headers['user-agent'] || '').toLowerCase() as string;
  const isMatch = userAgent.split(/\s+/).find((x) => x.startsWith('arcwallet/') || x.startsWith('abtwallet/'));
  if (isMatch) {
    return true;
  }

  const arcWalletVersion = headers['arcwallet-version'] as string;
  if (arcWalletVersion) {
    return true;
  }

  return false;
}
