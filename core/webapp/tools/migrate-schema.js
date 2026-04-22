/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
process.env.NODE_ENV = 'development';
require('dotenv-flow').config();
const { runSchemaMigrations } = require('@abtnode/core/lib/migrations');
const shelljs = require('shelljs');

// 确保开发模式下的server可以迁移成功
// Ensure dev server db schema and data migrated: only need to run once
(async () => {
  const dataDir = process.env.ABT_NODE_DATA_DIR;
  await shelljs.exec('bun run --filter @abtnode/models build');
  await runSchemaMigrations({ dataDir, blocklets: [] });
  process.exit(0);
})();
