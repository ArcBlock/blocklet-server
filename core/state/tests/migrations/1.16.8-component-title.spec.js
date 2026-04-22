const { test, expect, beforeEach, mock } = require('bun:test');
const run = require('../../lib/migrations/1.16.8-component-title');

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

test('one hit component', async () => {
  states.blocklet.find.mockResolvedValue([
    { id: '123', children: [{ meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'xxxxx' } }] },
  ]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    { $set: { children: [{ meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'Pages Kit' } }] } }
  );
});

test('two hit component', async () => {
  states.blocklet.find.mockResolvedValue([
    {
      id: '123',
      children: [
        { meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'aaa' } },
        { meta: { bundleDid: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', title: 'bbb' } },
      ],
    },
  ]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    {
      $set: {
        children: [
          { meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'Pages Kit' } },
          { meta: { bundleDid: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', title: 'Discuss Kit' } },
        ],
      },
    }
  );
});

test('two hit app', async () => {
  states.blocklet.find.mockResolvedValue([
    {
      id: '123',
      children: [{ meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'aaa' } }],
    },
    {
      id: '456',
      children: [{ meta: { bundleDid: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', title: 'bbb' } }],
    },
  ]);
  expect(states.blocklet.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blocklet.find).toHaveBeenCalledTimes(1);
  expect(states.blocklet.update).toHaveBeenCalledTimes(2);
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '123' },
    {
      $set: {
        children: [{ meta: { bundleDid: 'z8iZiDFg3vkkrPwsiba1TLXy3H9XHzFERsP8o', title: 'Pages Kit' } }],
      },
    }
  );
  expect(states.blocklet.update).toHaveBeenCalledWith(
    { id: '456' },
    {
      $set: {
        children: [{ meta: { bundleDid: 'z8ia1WEiBZ7hxURf6LwH21Wpg99vophFwSJdu', title: 'Discuss Kit' } }],
      },
    }
  );
});
