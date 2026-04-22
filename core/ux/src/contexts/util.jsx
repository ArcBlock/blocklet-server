import {
  MFA_PROTECTED_METHODS,
  STUDIO_ALLOWED_METHODS,
  SKIP_ACCESS_VERIFY_METHODS,
  WELLKNOWN_BLOCKLET_ADMIN_PATH,
} from '@abtnode/constant';
import { ALLOW_VERIFY_PROVIDERS } from '@blocklet/constant';
import { LOGIN_PROVIDER } from '@arcblock/ux/lib/Util/constant';
import Typography from '@mui/material/Typography';
import { toBase64 } from '@ocap/util';
import decode from 'jwt-decode';

const OPERATION_ROLES = {
  configVault: 'owner',
  deleteComponent: 'owner,admin,member',
  deleteAccessKey: 'owner,admin,member',
  default: 'admin,owner',
};

// 全局验证锁，用于防止并发请求时弹出多个验证对话框
let verifyPromise = null;

/**
 * 判断是否需要角色检查
 * @param {boolean} inService - 是否为service端请求
 * @returns {boolean} 是否需要角色检查
 * @description
 * 1. server 端请求永远需要检测
 * 2. service 端请求时:
 *    - dashboard页面需要检查角色
 *    - 其他页面不需要检查角色
 */
const shouldCheckRole = (inService) => {
  if (!inService) {
    return true;
  }
  const link = window.location.href;
  try {
    const url = new URL(link);
    return !url.pathname || url.pathname.startsWith(WELLKNOWN_BLOCKLET_ADMIN_PATH);
  } catch (error) {
    console.warn('Failed to parse URL when checking dashboard path', { error, link });
    return true;
  }
};

// eslint-disable-next-line import/prefer-default-export
export function createProxyClient({
  t,
  client,
  locale,
  connectApi,
  getSessionToken,
  setSessionToken,
  setRefreshToken,
  enableSessionHardening,
  session,
  inService = false,
}) {
  return new Proxy(client, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return (...args) => {
          const method = target[prop];
          const connectedAccounts = session.user?.connectedAccounts || [];
          const hasPasskey = connectedAccounts.some((x) => x.provider === LOGIN_PROVIDER.PASSKEY);
          const passkeyBehavior = hasPasskey ? 'only-existing' : 'none';

          // 如果连接的账户中没有 passkey 或 wallet，则不进行验证
          if (!connectedAccounts.some((x) => ALLOW_VERIFY_PROVIDERS.includes(x.provider))) {
            // eslint-disable-next-line prefer-spread
            return target[prop].apply(target, args);
          }
          // 如果是 e2e 模式，则不进行验证
          if (window?.env?.isE2E) {
            // eslint-disable-next-line prefer-spread
            return target[prop].apply(target, args);
          }

          console.warn('prop', method.type, prop);
          if (
            method.type === 'mutation' &&
            MFA_PROTECTED_METHODS.includes(prop) &&
            !import.meta.env.VITE_NO_MFA_PROTECTED_METHODS
          ) {
            const shouldCheck = shouldCheckRole(inService);

            return new Promise((resolve, reject) => {
              connectApi.open({
                locale,
                action: 'verify-destroy', // 每次都需要验证的
                forceConnected: true,
                saveConnect: false,
                autoConnect: false,
                className: 'connect',
                checkTimeout: 10 * 60 * 1000,
                passkeyBehavior,
                extraParams: {
                  payload: toBase64(JSON.stringify({ action: prop, input: args[0]?.input || {} })),
                  roles: !shouldCheck ? [] : OPERATION_ROLES[prop] || OPERATION_ROLES.default,
                  shouldCheckRole: shouldCheck,
                },
                messages: {
                  title: t('login.verify.title'),
                  scan: t('login.verify.scan'),
                  confirm: t('login.verify.confirm'),
                  success: t('login.verify.success'),
                },
                onSuccess: (result, decrypt = (x) => x) => {
                  if (result.destroySessionId) {
                    if (!args[0]) {
                      args[0] = {};
                    }
                    if (!args[0].input) {
                      args[0].input = {};
                    }
                    args[0].input.sessionId = decrypt(result.destroySessionId);
                  }
                  if (result.sessionToken) {
                    setSessionToken(decrypt(result.sessionToken));
                    setRefreshToken(decrypt(result.refreshToken));
                  }
                  setTimeout(() => {
                    // eslint-disable-next-line prefer-spread
                    resolve(target[prop].apply(target, args));
                  }, 50);
                },
                onClose: () => {
                  reject(new Error(t('login.verify.abort')));
                  connectApi.close();
                },
                extraContent: (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      textAlign: 'center',
                    }}>
                    {t('login.verify.descriptionForDestroy', {
                      roles: OPERATION_ROLES[prop] || OPERATION_ROLES.default,
                    })}
                  </Typography>
                ),
              });
            });
          }

          if (enableSessionHardening && method.type === 'mutation') {
            const token = getSessionToken();
            let needVerifyAccess = false;
            if (!STUDIO_ALLOWED_METHODS[prop] && !SKIP_ACCESS_VERIFY_METHODS[prop]) {
              if (token) {
                try {
                  const decoded = decode(token);
                  needVerifyAccess = !decoded.elevated;
                } catch (err) {
                  console.error('get session token failed: ', err);
                  needVerifyAccess = true;
                }
              } else {
                needVerifyAccess = true;
              }
            }

            console.warn('intercepted', { prop, needVerifyAccess });
            if (needVerifyAccess) {
              // 如果已有验证正在进行，等待其完成后直接执行请求
              if (verifyPromise) {
                return verifyPromise.then(
                  // eslint-disable-next-line prefer-spread
                  () => target[prop].apply(target, args),
                  (err) => Promise.reject(err)
                );
              }

              // 创建新的验证 Promise 并存储
              verifyPromise = new Promise((resolve, reject) => {
                connectApi.open({
                  locale,
                  action: 'verify-elevated', // 每小时需要验证一次的
                  forceConnected: true,
                  saveConnect: false,
                  autoConnect: false,
                  className: 'connect',
                  checkTimeout: 10 * 60 * 1000,
                  passkeyBehavior,
                  messages: {
                    title: t('login.verify.title'),
                    scan: t('login.verify.scan'),
                    confirm: t('login.verify.confirm'),
                    success: t('login.verify.success'),
                  },
                  onSuccess: (result, decrypt = (x) => x) => {
                    // sessionToken 是全局状态，只需设置一次
                    if (result.sessionToken) {
                      setSessionToken(decrypt(result.sessionToken));
                      setRefreshToken(decrypt(result.refreshToken));
                    }
                    verifyPromise = null; // 清除锁
                    resolve();
                  },
                  onClose: () => {
                    verifyPromise = null; // 清除锁
                    reject(new Error(t('login.verify.abort')));
                    connectApi.close();
                  },
                  extraParams: {},
                  extraContent: (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        textAlign: 'center',
                      }}>
                      {t('login.verify.description', { roles: OPERATION_ROLES[prop] || OPERATION_ROLES.default })}
                    </Typography>
                  ),
                });
              });

              // 验证完成后执行当前请求
              return verifyPromise.then(
                // eslint-disable-next-line prefer-spread
                () => target[prop].apply(target, args),
                (err) => Promise.reject(err)
              );
            }
          }

          // eslint-disable-next-line prefer-spread
          return target[prop].apply(target, args);
        };
      }

      return target[prop];
    },
  });
}
