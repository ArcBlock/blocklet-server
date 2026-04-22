const path = require('path');
const { DBCache } = require('../dist/index.cjs');
const { tmpdir } = require('os');

// Use environment variables for unique paths when running tests concurrently
// If not set, fall back to default values for backward compatibility
const prefix = process.env.TEST_DB_PREFIX || 'test';
const sqlitePath = process.env.TEST_DB_PATH || path.join(tmpdir(), 'test_busy.db');

const db = new DBCache(() => {
  return {
    prefix,
    sqlitePath,
    ttl: 1000,
  };
});

const task = async () => {
  const list = [];
  for (let i = 0; i < 100; i++) {
    list.push(db.groupSet('test', 'test', `test-${i}`));
  }

  for (let i = 0; i < 100; i++) {
    list.push(db.groupGet('test', 'test'));
  }
  for (let i = 0; i < 100; i++) {
    list.push(db.del('test'));
  }

  for (let i = 0; i < 100; i++) {
    list.push(db.groupSet('test', 'test', `test-${i}`));
  }
  await Promise.all(list);
  process.exit(0);
};

task();
