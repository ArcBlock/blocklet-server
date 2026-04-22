const { test, expect, mock, afterAll } = require('bun:test');

mock.module('@blocklet/sdk/lib/util/send-notification', () => ({
  sendToAppChannel: mock(),
}));
mock.module('@blocklet/meta/lib/channel', () => ({
  getAppPublicChannel: mock(),
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

const { sendToAppChannel } = require('@blocklet/sdk/lib/util/send-notification');
const { getAppPublicChannel } = require('@blocklet/meta/lib/channel');
const { NodeMonitSender } = require('../../lib/monitor/node-monit-sender');

const node = {
  getNodeInfo: () => ({
    did: 'abt123',
    sk: 'sk123',
  }),
};

expect(getAppPublicChannel).not.toHaveBeenCalled();
expect(sendToAppChannel).not.toHaveBeenCalled();

test('node-monit-server', async () => {
  process.env.ABT_NODE_SERVICE_PORT = 8888;
  const sender = new NodeMonitSender({ node, interval: 400 });
  await sender.sendToWallet({
    cpu: {
      currentLoad: 50,
    },
    mem: {
      total: 1024 * 1024 * 1024 * 2,
      available: 1024 * 1024 * 1024,
    },
  });

  expect(getAppPublicChannel).toHaveBeenCalledWith('abt123');
  expect(sendToAppChannel).toHaveBeenCalledWith(
    undefined, // channel, return undefined because getAppPublicChannel is mocked
    'message',
    {
      type: 'feed',
      feedType: 'data-tracker',
      data: {
        cardTitle: 'Server Usage',
        items: [
          {
            title: 'CPU',
            content: '50%',
            content_color: '#222222',
          },
          {
            title: 'MEM',
            content: '1 GiB (50%)',
            content_color: '#222222',
          },
        ],
      },
    },
    { appDid: 'abt123', appSk: 'sk123' },
    8888 // port
  );

  await sender.sendToWallet({
    cpu: {
      currentLoad: 50,
    },
    mem: {
      total: 1024 * 1024 * 1024 * 2,
      available: 1024 * 1024 * 1024,
    },
  });

  expect(getAppPublicChannel).toHaveBeenCalledTimes(1);
  expect(sendToAppChannel).toHaveBeenCalledTimes(1);

  // 使用 performance.now() 确保在覆盖率模式下时间准确
  await new Promise((resolve) => {
    const start = performance.now();
    const check = () => {
      if (performance.now() - start >= 2000) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    setTimeout(check, 50);
  });

  await sender.sendToWallet({
    cpu: {
      currentLoad: 100,
    },
    mem: {
      total: 1024 * 1024 * 1024 * 2,
      available: 0,
    },
  });

  expect(getAppPublicChannel).toHaveBeenCalledTimes(2);
  expect(sendToAppChannel).toHaveBeenCalledTimes(2);

  expect(sendToAppChannel).toHaveBeenCalledWith(
    undefined, // channel, return undefined because getAppPublicChannel is mocked
    'message',
    {
      type: 'feed',
      feedType: 'data-tracker',
      data: {
        cardTitle: 'Server Usage',
        items: [
          {
            title: 'CPU',
            content: '100%',
            content_color: '#FF1111',
          },
          {
            title: 'MEM',
            content: '2 GiB (100%)',
            content_color: '#FF1111',
          },
        ],
      },
    },
    { appDid: 'abt123', appSk: 'sk123' },
    8888 // port
  );
});
