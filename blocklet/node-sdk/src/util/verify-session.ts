import { LOGIN_PROVIDER } from '@blocklet/constant';
import { verify as verifyJwt } from '@arcblock/jwt';
import JWT from 'jsonwebtoken';
import { Hasher } from '@ocap/mcrypto';
import { joinURL } from 'ufo';

import { getWallet } from '../wallet';
import { authMiddleware as auth } from '../middlewares/auth';
import { decodeKycStatus, SessionUser } from './login';
import { env } from '../config';
import { verify as verifySign, getVerifyData } from './verify-sign';

export const getSessionSecret = () => {
  if (process.env.BLOCKLET_SESSION_SECRET) {
    return process.env.BLOCKLET_SESSION_SECRET;
  }
  const wallet = getWallet();
  const secret = Hasher.SHA3.hash256(
    Buffer.concat([wallet.secretKey, wallet.address, env.sessionSalt].filter(Boolean).map((v) => Buffer.from(v)))
  ) as string;
  return secret;
};

export function verifyLoginToken({ token, strictMode }): Promise<SessionUser | null> {
  if (!token) return null;

  return new Promise((resolve, reject) => {
    JWT.verify(token, getSessionSecret(), (err, decoded) => {
      if (err) {
        if (strictMode) {
          reject(new Error('Unauthorized: Invalid login token'));
        }
        resolve(null);
        return;
      }

      const { did, role, fullName, provider = LOGIN_PROVIDER.WALLET, walletOS, kyc = 0, org = '' } = decoded;
      const loginUser: SessionUser = {
        did,
        role,
        fullName,
        provider,
        walletOS,
        ...decodeKycStatus(Number(kyc) || 0),
        method: 'loginToken',
      };

      if (org) {
        loginUser.org = org;
      }

      resolve(loginUser);
    });
  });
}

export async function verifyAccessKey({ token, strictMode }): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const client = auth.getServiceClient();
    const result = await client.verifyAccessKey({ accessKeyId: token });
    const { createdBy, accessKeyId, passport = 'guest', remark = '' } = result.data;

    return {
      did: createdBy,
      accessKeyId,
      role: passport.replace('blocklet-', ''),
      fullName: remark || accessKeyId,
      provider: 'accessKey',
      walletOS: 'embed',
      method: 'accessKey',
    };
  } catch (err) {
    console.error('verifyAccessKey', err);
    if (strictMode) {
      throw new Error('Unauthorized: Invalid access key');
    }
    return null;
  }
}

export async function verifyComponentCall({ req, strictMode }): Promise<SessionUser | null> {
  let sig;
  let data;

  try {
    ({ sig, data } = getVerifyData(req));
    if (!sig) return null;
  } catch {
    // verifyComponentCall is called on every request; ensure errors from getVerifyData do not break downstream flow
    return null;
  }

  const pathPrefix = req?.get('x-path-prefix');
  let verified = await verifySign(data, sig, { appSk: process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK });
  if (!verified && pathPrefix && data?.url && !data.url?.startsWith(pathPrefix)) {
    verified = await verifySign({ ...data, url: joinURL(pathPrefix, data.url) }, sig, {
      appSk: process.env.BLOCKLET_APP_ASK || process.env.BLOCKLET_APP_SK,
    });
  }
  if (!verified) {
    if (strictMode) {
      throw new Error('Unauthorized: Invalid signature');
    }
    return null;
  }

  return {
    did: <string>req.get('x-component-did'),
    role: 'component',
    provider: 'wallet',
    fullName: <string>req.get('x-component-did'),
    walletOS: 'embed',
    emailVerified: false,
    phoneVerified: false,
    method: 'componentCall',
  };
}

export async function verifySignedToken({ token, strictMode }): Promise<SessionUser | null> {
  if (!token) return null;

  const wallet = getWallet();
  if (!(await verifyJwt(token as string, wallet.publicKey))) {
    if (strictMode) {
      throw new Error('Unauthorized: Invalid signed token');
    }
    return null;
  }

  return {
    did: wallet.address,
    role: 'component',
    provider: 'wallet',
    fullName: wallet.address,
    walletOS: 'embed',
    emailVerified: false,
    phoneVerified: false,
    method: 'signedToken',
  };
}
