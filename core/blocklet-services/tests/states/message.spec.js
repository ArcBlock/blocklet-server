const { test, describe, expect, beforeAll, afterAll, afterEach, mock } = require('bun:test');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { doSchemaMigration } = require('@abtnode/models');
const { getDbFilePath } = require('@abtnode/core/lib/util');

const states = require('../../api/state');
const MessageState = require('../../api/state/message');

// eslint-disable-next-line no-promise-executor-return
const sleep = (t) => new Promise((r) => setTimeout(r, t || 600));

beforeAll(() => {
  mock.restore();
});

describe('MessageState', () => {
  let state = null;

  const dataDir = path.join(os.tmpdir(), 'message', Math.random().toString());

  beforeAll(async () => {
    await doSchemaMigration(getDbFilePath(path.join(dataDir, 'service.db')), 'service');
    states.init(dataDir);
    state = new MessageState(states.models.Message);
  });

  afterAll(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true });
    }
  });

  afterEach(async () => {
    await state.reset();
  });

  test('should add message works as expected', async () => {
    const message = await state.insert({ did: '111', event: 'aaa', data: 'hello' });

    expect(message).toHaveProperty('createdAt');
    expect(message).toHaveProperty('updatedAt');
    expect(message).toMatchObject({
      did: '111',
      event: 'aaa',
      data: 'hello',
    });

    await state.insert({ did: '222', event: 'bbb', data: 'hello' });

    const messages = await state.find();

    expect(messages.length).toBe(2);
  });

  test('should prune message works user as expected', async () => {
    await state.insert({ did: '111', event: 'aaa', data: 'hello' });
    expect((await state.find()).length).toBe(1);
    await state.prune();
    expect((await state.find()).length).toBe(1);
    await sleep(100);
    await state.prune(50);
    expect((await state.find()).length).toBe(0);
  });
});
