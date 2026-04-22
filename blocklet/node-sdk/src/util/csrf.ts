import { createHmac } from 'crypto';

import type { LiteralUnion } from 'type-fest';

export function hmac(secretKey: string, message: string, algorithm: LiteralUnion<'md5' | 'sha256', string> = 'md5') {
  const hmacFunc = createHmac(algorithm, secretKey);
  return hmacFunc.update(message).digest('base64url');
}

/**
 * Get CSRF secret key with smart fallback strategy
 * @returns CSRF secret key
 */
export function getCsrfSecret(): string {
  // Compatible with previous version where APP_ASK does not exist
  return process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK;
}

/**
 * Generate a CSRF token
 * @param secretKey Server secret key (required, must be kept private)
 * @param loginToken Login token used as HMAC input
 * @returns Signed token string
 */
export function sign(secretKey: string, loginToken: string): string {
  const xCsrfTokenMd5 = hmac(secretKey, loginToken);
  const xCsrfTokenSigned = hmac(secretKey, xCsrfTokenMd5, 'sha256');
  return [xCsrfTokenMd5, xCsrfTokenSigned].join('.');
}

/**
 * Validate a CSRF token
 * @param secretKey Server secret key (must match the one used during signing)
 * @param csrfTokenFromRequest The token to validate
 * @returns Whether the token is valid (boolean)
 */
export function verify(secretKey: string, csrfTokenFromRequest: string, loginToken: string): boolean {
  const expectCsrfToken = sign(secretKey, loginToken);
  return expectCsrfToken === csrfTokenFromRequest;
}
