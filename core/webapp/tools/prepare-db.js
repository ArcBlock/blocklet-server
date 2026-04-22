/* eslint-disable no-console */
const dotenvFlow = require('dotenv-flow');

dotenvFlow.config();

const { ensureSchemaMigrations } = require('../dev/util');

ensureSchemaMigrations()
  .then(() => process.exit(0))
  .catch(console.error);
