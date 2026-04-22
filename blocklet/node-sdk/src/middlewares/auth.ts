// eslint-disable-next-line import/no-extraneous-dependencies
import { NextFunction, Request, Response } from 'express';
import { LRUCache } from 'lru-cache';
import { BlockletService } from '../service/blocklet';
import { decodeKycStatus, SessionUser, AuthMethod, KycMethod } from '../util/login';

const clients: Record<string, BlockletService> = {};
const getServiceClient = () => {
  const appId = process.env.BLOCKLET_APP_ID;
  if (!clients[appId]) {
    clients[appId] = new BlockletService();
  }

  return clients[appId];
};

const cache = new LRUCache({ max: 10, ttl: 60 * 1000 });
const getPermissionsByRole = async (getClient: Function, role: string) => {
  if (!role) {
    return [];
  }

  const cached = cache.get(role);
  if (cached) {
    return cached;
  }

  const res = await getClient().getPermissionsByRole(role);
  cache.set(role, res);
  return res;
};

type AuthOptions = {
  roles?: string[];
  permissions?: string[];
  kyc?: KycMethod[];
  methods?: AuthMethod[];
  getClient?: Function;
};

const authMiddleware = ({ roles, permissions, kyc, methods, getClient = getServiceClient }: AuthOptions = {}) => {
  if (roles && !Array.isArray(roles)) {
    throw new Error('roles must be array');
  }
  if (permissions && !Array.isArray(permissions)) {
    throw new Error('permissions must be array');
  }
  if (kyc && !Array.isArray(kyc)) {
    throw new Error('kyc must be array');
  }
  if (methods && !Array.isArray(methods)) {
    throw new Error('auth methods must be array');
  }

  return async (req: Request & { user?: SessionUser }, res: Response, next: NextFunction) => {
    const userDid = req.user?.did || (req.headers['x-user-did'] as string);
    const userRole = req.user?.role || (req.headers['x-user-role'] as string);
    const userKyc = req.user?.kyc || (req.headers['x-user-kyc'] as string);
    const userMethod = req.user?.method || '';

    if (!userDid) {
      res.status(401).json({ code: 'forbidden', error: 'not authorized' });
      return;
    }
    if (roles && !roles.includes(userRole)) {
      res.status(403).json({ code: 'forbidden', error: 'no permission' });
      return;
    }

    if (permissions) {
      const { permissions: list } = await getPermissionsByRole(getClient, userRole as string);
      if (!permissions.some((x: any) => (list || []).some((y: any) => y.name === x))) {
        res.status(403).json({ code: 'forbidden', error: 'no permission' });
        return;
      }
    }

    if (kyc) {
      const kycStatus = decodeKycStatus(Number(userKyc) || 0);
      if (kyc.some((x: string) => !kycStatus[`${x}Verified`])) {
        res.status(403).json({ code: 'forbidden', error: 'kyc required' });
        return;
      }
    }

    if (methods) {
      if (!methods.includes(userMethod)) {
        res.status(403).json({ code: 'forbidden', error: 'auth method not allowed' });
        return;
      }
    }

    next();
  };
};

authMiddleware.getServiceClient = getServiceClient;

export { authMiddleware, authMiddleware as auth };
