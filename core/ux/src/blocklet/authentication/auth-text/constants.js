import { baseLanguages } from '@blocklet/constant';

export const defaultConfig = {
  login: {
    en: {
      title: 'Login',
      scan: 'Login with one of the following methods',
      confirm: 'Confirm connection in your DID Wallet',
      success: 'Successfully logged in',
    },
    zh: {
      title: '登录',
      scan: '请使用下面的方式完成登录',
      confirm: '在 DID Wallet 中确认连接',
      success: '登录成功',
    },
  },
  'switch-profile': {
    en: {
      title: 'Switch Profile',
      scan: 'Use DID Wallet to switch profile',
      confirm: 'Select profile in your DID Wallet',
      success: 'Profile updated',
    },
    zh: {
      title: '切换个人信息',
      scan: '请使用 DID Wallet 来切换个人信息',
      confirm: '在 DID Wallet 中选择个人信息',
      success: '个人信息已经更新',
    },
  },
  'switch-passport': {
    en: {
      title: 'Switch Passport',
      scan: 'Use DID Wallet to switch passport',
      confirm: 'Select passport in your DID Wallet',
      success: 'Passport and session updated',
    },
    zh: {
      title: '切换通行证',
      scan: '请使用 DID Wallet 来切换通行证',
      confirm: '在 DID Wallet 中选择通行证',
      success: '通行证和会话已经更新',
    },
  },
};

export const configTemplate = {
  en: { title: '', scan: '', confirm: '', success: '' },
  zh: { title: '', scan: '', confirm: '', success: '' },
};

export const defaultAction = 'new-action';

export const defaultActions = Object.keys(defaultConfig);

export const requiredLanguages = ['zh', 'en'];

export const isValidActionName = (name) => /^[a-z][a-z-]*$/.test(name);

export const getSortedLanguages = (langs) => {
  const sorted = [];
  if (langs.includes('zh')) sorted.push('zh');
  if (langs.includes('en')) sorted.push('en');
  langs.filter((lang) => !requiredLanguages.includes(lang)).forEach((lang) => sorted.push(lang));
  return sorted;
};

export const getLanguageLabel = (code) => {
  const lang = baseLanguages.find((l) => l.code === code);
  return lang ? lang.name : code;
};
