const isProduction = process.env.NODE_ENV === 'production';
const isE2E = process.env.NODE_ENV === 'e2e' || ['1', 'true'].includes(process.env.IS_E2E);
const isFeDev = !!process.env.ABT_NODE_SERVICE_FE_PORT;
const isDev = process.env.NODE_ENV === 'development';

module.exports = {
  isProduction,
  isE2E,
  isFeDev,
  isDev,
};
