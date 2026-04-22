/* eslint-disable-next-line no-unused-expressions */
const { test, describe, expect, beforeAll, afterAll } = require('bun:test');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { doSchemaMigration } = require('@abtnode/models');
const { getDbFilePath } = require('@abtnode/core/lib/util');

const states = require('../../api/state');

// eslint-disable-next-line no-promise-executor-return
const sleep = (t) => new Promise((r) => setTimeout(r, t || 600));

describe('state index', () => {
  const dataDir = path.join(os.tmpdir(), Math.random().toString());

  beforeAll(async () => {
    await doSchemaMigration(getDbFilePath(path.join(dataDir, 'service.db')), 'service');
  });

  afterAll(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }
  });

  test('should work as expected', async () => {
    expect(() => states.message).toThrow(/State message initializer may not be initialized/);
    states.init(dataDir);
    await sleep();
    expect(() => states.message).not.toThrow();
  });
});
