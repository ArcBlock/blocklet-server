import { getBlockletSDK as _getBlockletSDK } from '@blocklet/js-sdk';
import { fromPublicKey } from '@ocap/wallet';
import { toTypeInfo } from '@arcblock/did';

/**
 * 创建签名验证函数
 * 使用 @ocap/wallet 进行签名验证
 */
export const createVerifyFn = () => {
  return async (data, signature, appPk, appId) => {
    const wallet = fromPublicKey(appPk, toTypeInfo(appId));
    const result = await wallet.verify(data, signature);
    return result;
  };
};

// 默认的 verifyFn 实例
const defaultVerifyFn = createVerifyFn();

/**
 * 获取配置了 verifyFn 的 BlockletSDK 单例
 */
export const getBlockletSDK = () => {
  return _getBlockletSDK({ verifyFn: defaultVerifyFn });
};
