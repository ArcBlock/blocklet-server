import { AIGNE_CONFIG_ENCRYPT_SALT } from '@abtnode/constant';
import { isNil } from 'lodash';
import { encrypt, decrypt } from '@abtnode/util/lib/security';

export const encryptValue = (value, did) => {
  return value ? encrypt(value, did || AIGNE_CONFIG_ENCRYPT_SALT, '') : value;
};

export const decryptValue = (value, did) => {
  return value ? decrypt(value, did || AIGNE_CONFIG_ENCRYPT_SALT, '') : value;
};

export const isAigneHubProvider = (provider) => {
  return provider === 'aigneHub';
};

export const isBedrockProvider = (provider) => {
  return provider === 'bedrock';
};

export const getEmptyFields = (values) => {
  const baseFields = ['provider', 'model'];
  if (isNil(values)) {
    return [...baseFields, 'key'];
  }

  const { provider } = values;
  let verifyFields = baseFields;
  if (isAigneHubProvider(provider)) {
    verifyFields = [...baseFields, 'key', 'url'];
  } else if (isBedrockProvider(provider)) {
    verifyFields = [...baseFields, 'accessKeyId', 'secretAccessKey'];
  } else {
    verifyFields = [...baseFields, 'key'];
  }

  return verifyFields.filter((field) => !values[field]);
};

export const getKeyLabel = (field) => {
  switch (field) {
    case 'provider':
      return 'Model Provider';
    case 'model':
      return 'Model Name';
    case 'key':
      return 'API Key';
    case 'url':
      return 'URL';
    default:
      return '';
  }
};

export const formatAmount = (value) => {
  // 处理无效输入
  if (isNil(value) || value === '') {
    return '0';
  }

  // 转换为数字
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 检查是否为有效数字
  if (Number.isNaN(numValue)) {
    return '0';
  }

  // 优先使用 Intl.NumberFormat，提供备选方案
  if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numValue);
  }

  // 备选方案：使用正则表达式实现千分位格式化
  const parts = numValue.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parseFloat(parts[1]) > 0 ? `.${parts[1]}` : '';

  return `${integerPart}${decimalPart}`;
};
