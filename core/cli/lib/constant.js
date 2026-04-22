const os = require('os');
const path = require('path');

// Support custom data directory via ABT_NODE_CUSTOM_DATA_DIR environment variable
// Default to ~/.arcblock if not specified
const ABT_NODE_HOME = process.env.ABT_NODE_CUSTOM_DATA_DIR
  ? path.resolve(process.env.ABT_NODE_CUSTOM_DATA_DIR)
  : path.join(os.homedir(), '.arcblock');

const ABT_NODE_MAX_CLUSTER_SIZE = Math.min(Math.max(Number(process.env.ABT_NODE_MAX_CLUSTER_SIZE) || 1, 1), 32);

const CLI_MODE = 'blocklet';
const NODE_ENV = process.env.NODE_ENV || 'production';

const PM2_HOME = path.join(ABT_NODE_HOME, 'abtnode');
const ABT_NODE_CONFIG_FILE = path.join(ABT_NODE_HOME, 'blocklet.ini');
const INSTALL_FILE_PATH = path.join(ABT_NODE_HOME, '.is-new-server-install');
const HELP_DOCS_GITHUB_CODESPACES_URL =
  'https://www.arcblock.io/docs/blocklet-developer/en/develop-with-github-codespaces';

const ABT_NODE_ACCESS_KEY_FILE = path.join(ABT_NODE_HOME, 'access-key.ini');

module.exports = {
  ABT_NODE_MAX_CLUSTER_SIZE,
  CLI_MODE,
  NODE_ENV,
  ABT_NODE_HOME,
  PM2_HOME,
  ABT_NODE_CONFIG_FILE,
  INSTALL_FILE_PATH,
  HELP_DOCS_GITHUB_CODESPACES_URL,
  ABT_NODE_ACCESS_KEY_FILE,
};
