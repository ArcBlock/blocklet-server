/* eslint-disable import/prefer-default-export */

// 当前模式是 内测模式 吗？ @see: https://developer.aliyun.com/article/572525
export const enableDebug = localStorage.getItem('enableDebug') === 'true';
