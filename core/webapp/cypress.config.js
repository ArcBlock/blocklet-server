const { defineConfig } = require('cypress');

const isVideo = process.env.E2E_ENABLE_VIDEO === 'true';
const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;
const baseUrl = process.env.ABT_NODE_BASE_URL || 'http://127.0.0.1:3000';

module.exports = defineConfig({
  gatewayBaseUrl: 'http://127.0.0.1:8080',
  viewportWidth: 1400,
  viewportHeight: 1000,
  projectId: 'x82hbx',
  defaultCommandTimeout: 40000,
  numTestsKeptInMemory: isCI ? 30 : 1,
  videoCompression: 1,
  screenshotOnRunFailure: true,
  trashAssetsBeforeRuns: true,
  video: isVideo,
  env: {
    FAIL_FAST_STRATEGY: 'run',
    FAIL_FAST_BAIL: 1,
    FAIL_FAST_PLUGIN: true,
    codeCoverage: {
      url: `${baseUrl}/__coverage__`,
    },
    'static-server-url': 'http://127.0.0.1:9090',
    E2E_ENABLE_DOCKER_MODE: process.env.E2E_ENABLE_DOCKER_MODE === 'true',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      // eslint-disable-next-line global-require
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl,
    abtNodeAdminPath: '/.well-known/server/admin',
    specPattern: 'cypress/e2e/*.cy.js',
  },
});
