import crypto from 'crypto';
// @ts-ignore
import aes from '@ocap/mcrypto/lib/crypter/aes-legacy';
import { signResponse as _signResponse, verifyResponse as _verifyResponse } from '@blocklet/meta/lib/security';

import { getWallet } from '../wallet';

const AES = { default: aes }.default;

const encrypt = (message: string, password?: string, salt?: string): string => {
  const _password = password || process.env.BLOCKLET_APP_EK;
  const _salt = salt || process.env.BLOCKLET_DID;
  if (!_password || !_salt) {
    return message;
  }
  return <string>AES.encrypt(message, crypto.pbkdf2Sync(_password, _salt, 256, 32, 'sha512').toString('hex'));
};

const decrypt = (message: string, password?: string, salt?: string): string => {
  const _password = password || process.env.BLOCKLET_APP_EK;
  const _salt = salt || process.env.BLOCKLET_DID;
  if (!_password || !_salt) {
    return message;
  }
  return <string>AES.decrypt(message, crypto.pbkdf2Sync(_password, _salt, 256, 32, 'sha512').toString('hex'));
};

const signResponse = (data: any) => _signResponse(data, getWallet());
const verifyResponse = (data: any) => _verifyResponse(data, getWallet());

export { encrypt };
export { decrypt };
export { signResponse, verifyResponse };

export default {
  encrypt,
  decrypt,
  signResponse,
  verifyResponse,
};
