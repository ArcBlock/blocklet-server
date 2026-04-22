/* eslint-disable global-require */
/* eslint-disable import/no-extraneous-dependencies */

module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  // require('@cypress/code-coverage/task')(on, config);
  require('cypress-fail-fast/plugin')(on, config);
  return config;
};
