const { test, expect, beforeEach, mock } = require('bun:test');
const run = require('../../lib/migrations/1.16.11-component-status');

const states = {
  blocklet: {
    find: mock(),
    update: mock(),
  },
};
const printInfo = mock();

beforeEach(() => {
  states.blocklet.find.mockReset();
  states.blocklet.find.mockResolvedValue([]);
  states.blocklet.update.mockReset();
});

test('blocklets is null', async () => {
  states.blocklet.find.mockResolvedValue(null);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).not.toHaveBeenCalled();
});

test('blocklets is []', async () => {
  states.blocklet.find.mockResolvedValue([]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).not.toHaveBeenCalled();
});

test('one app with no component', async () => {
  states.blocklet.find.mockResolvedValue([{ id: '123', children: [] }]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).not.toHaveBeenCalled();

  states.blocklet.find.mockResolvedValue([{ id: '123' }]);
  await run({ states, printInfo });
  expect(states.blocklet.update).not.toHaveBeenCalled();
});

test('one app with one component', async () => {
  states.blocklet.find.mockResolvedValue([{ id: '123', status: 1, children: [{ xxx: 'yyy' }] }]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    { $set: { children: [{ xxx: 'yyy', status: 1 }] } }
  );
});

test('one app with two component', async () => {
  states.blocklet.find.mockResolvedValue([{ id: '123', status: 1, children: [{ xxx: 'xxx' }, { yyy: 'yyy' }] }]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    {
      $set: {
        children: [
          { xxx: 'xxx', status: 1 },
          { yyy: 'yyy', status: 1 },
        ],
      },
    }
  );
});

test('two app', async () => {
  states.blocklet.find.mockResolvedValue([
    { id: '123', status: 1, children: [{ xxx: 'xxx' }, { yyy: 'yyy' }] },
    { id: '456', status: 2, children: [{ aaa: 'aaa' }, { bbb: 'bbb' }] },
  ]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(2);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    {
      $set: {
        children: [
          { xxx: 'xxx', status: 1 },
          { yyy: 'yyy', status: 1 },
        ],
      },
    }
  );
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '456' },
    {
      $set: {
        children: [
          { aaa: 'aaa', status: 2 },
          { bbb: 'bbb', status: 2 },
        ],
      },
    }
  );
});
