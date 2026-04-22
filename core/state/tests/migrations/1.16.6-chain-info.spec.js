const { test, expect, beforeEach, mock } = require('bun:test');
const run = require('../../lib/migrations/1.16.6-chain-info');

const props = {
  description: '',
  validation: '',
  shared: true,
  secure: false,
  required: false,
  custom: false,
};
const states = {
  blockletExtras: {
    find: mock(),
    update: mock(),
  },
};
const printInfo = mock();

beforeEach(() => {
  states.blockletExtras.find.mockReset();
  states.blockletExtras.find.mockResolvedValue([]);
  states.blockletExtras.update.mockReset();
});

test('no extras', async () => {
  states.blockletExtras.find.mockResolvedValue(null);
  expect(states.blockletExtras.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blockletExtras.find).toHaveBeenCalledTimes(1);
  expect(states.blockletExtras.update).not.toHaveBeenCalled();
});

test('extras is null', async () => {
  expect(states.blockletExtras.find).not.toHaveBeenCalled();
  await run({ states, printInfo });
  expect(states.blockletExtras.find).toHaveBeenCalledTimes(1);
  expect(states.blockletExtras.update).not.toHaveBeenCalled();
});

test('No configs of chain info', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      configs: [
        {
          key: 'a',
          value: 'A',
        },
      ],
    },
  ]);
  await run({ states, printInfo });
  expect(states.blockletExtras.update).not.toHaveBeenCalled();
});

test('CHAIN_HOST in root component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      configs: [
        {
          key: 'a',
          value: 'A',
        },
        {
          key: 'CHAIN_HOST',
          value: 'abc',
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'a',
            value: 'A',
          },
          {
            key: 'CHAIN_HOST',
            value: 'abc',
          },
          {
            key: 'BLOCKLET_APP_CHAIN_HOST',
            value: 'abc',
            ...props,
          },
        ],
      },
    }
  );
});

test('CHAIN_HOST in child component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      children: [
        {
          configs: [
            {
              key: 'a',
              value: 'A',
            },
            {
              key: 'CHAIN_HOST',
              value: 'abc',
            },
          ],
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'BLOCKLET_APP_CHAIN_HOST',
            value: 'abc',
            ...props,
          },
        ],
      },
    }
  );
});

test('CHAIN_ID in child component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      children: [
        {
          configs: [
            {
              key: 'CHAIN_ID',
              value: 'abc',
            },
          ],
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'BLOCKLET_APP_CHAIN_ID',
            value: 'abc',
            ...props,
          },
        ],
      },
    }
  );
});

test('CHAIN_TYPE in child component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      children: [
        {
          configs: [
            {
              key: 'CHAIN_TYPE',
              value: 'abc',
            },
          ],
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'BLOCKLET_APP_CHAIN_TYPE',
            value: 'abc',
            ...props,
          },
        ],
      },
    }
  );
});

test('All chain info in child component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      children: [
        {
          configs: [
            {
              key: 'CHAIN_HOST',
              value: 'a',
            },
            {
              key: 'CHAIN_ID',
              value: 'b',
            },
            {
              key: 'CHAIN_TYPE',
              value: 'c',
            },
          ],
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'BLOCKLET_APP_CHAIN_HOST',
            value: 'a',
            ...props,
          },
          {
            key: 'BLOCKLET_APP_CHAIN_ID',
            value: 'b',
            ...props,
          },
          {
            key: 'BLOCKLET_APP_CHAIN_TYPE',
            value: 'c',
            ...props,
          },
        ],
      },
    }
  );
});

test('CHAIN_HOST in root component and child component', async () => {
  states.blockletExtras.find.mockResolvedValue([
    {
      did: '1',
      configs: [
        {
          key: 'a',
          value: 'A',
        },
        {
          key: 'CHAIN_HOST',
          value: 'abc in root',
        },
      ],
      children: [
        {
          configs: [
            {
              key: 'a',
              value: 'A',
            },
            {
              key: 'CHAIN_HOST',
              value: 'abc in child1',
            },
          ],
        },
        {
          configs: [
            {
              key: 'a',
              value: 'A',
            },
            {
              key: 'CHAIN_HOST',
              value: 'abc in child2',
            },
          ],
        },
      ],
    },
  ]);

  await run({ states, printInfo });
  expect(states.blockletExtras.update).toHaveBeenCalledWith(
    { did: '1' },
    {
      $set: {
        configs: [
          {
            key: 'a',
            value: 'A',
          },
          {
            key: 'CHAIN_HOST',
            value: 'abc in root',
          },
          {
            key: 'BLOCKLET_APP_CHAIN_HOST',
            value: 'abc in child1',
            ...props,
          },
        ],
      },
    }
  );
});
