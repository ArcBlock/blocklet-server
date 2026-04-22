const { mock, test, afterAll, expect } = require('bun:test');

mock.module('@abtnode/router-templates/lib/blocklet-not-running', () => {
  return {
    getBlockletNotRunningTemplate: mock(() => 'mock-blocklet-not-running-page'),
  };
});
mock.module('@abtnode/router-templates/lib/blocklet-maintenance', () => {
  return {
    getBlockletMaintenanceTemplate: mock(() => 'mock-blocklet-maintenance-page'),
  };
});

const { BlockletStatus } = require('@blocklet/constant');

const checkRunning = require('../../api/middlewares/check-running');

const b = { settings: { initialized: true } };

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

test('checkRunning', async () => {
  const mockRes = {
    set: mock().mockReturnThis(),
    status: mock().mockReturnThis(),
    redirect: mock(),
    send: mock(),
    json: mock(),
  };

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({ ...b, status: BlockletStatus.running }),
        getBlockletComponentId: () => {},
        query: {},
      },
      mockRes,
      resolve
    );
  });

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({ ...b, status: BlockletStatus.downloading }),
        getBlockletComponentId: () => {},
        query: {},
      },
      mockRes,
      resolve
    );
  });

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({ ...b, status: BlockletStatus.waiting }),
        getBlockletComponentId: () => {},
        query: {},
      },
      mockRes,
      resolve
    );
  });

  // components

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({
          ...b,
          status: BlockletStatus.running,
          children: [{ meta: { did: 'c1' }, status: BlockletStatus.running }],
        }),
        getBlockletComponentId: () => 'c1',
        query: {},
      },
      mockRes,
      resolve
    );
  });

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({
          ...b,
          status: BlockletStatus.downloading,
          children: [{ meta: { did: 'c1' }, status: BlockletStatus.downloading }],
        }),
        getBlockletComponentId: () => 'c1',
        query: {},
      },
      mockRes,
      resolve
    );
  });

  await new Promise((resolve) => {
    checkRunning(
      {
        getBlocklet: () => ({
          ...b,
          status: BlockletStatus.waiting,
          children: [{ meta: { did: 'c1' }, status: BlockletStatus.waiting }],
        }),
        getBlockletComponentId: () => 'c1',
        query: {},
      },
      mockRes,
      resolve
    );
  });

  // redirect to start page

  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b }),
      headers: {},
      user: { role: 'owner' },
      getBlockletComponentId: () => {},
      query: {},
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/.well-known/service/start?redirect'));

  await checkRunning(
    {
      url: '/?__start__=1',
      getBlocklet: () => ({ ...b }),
      headers: {},
      user: {},
      getBlockletComponentId: () => {},
      query: { __start__: '1' },
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith(expect.not.stringContaining('__start__'));

  // component

  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b, children: [{ meta: { did: 'c1' } }] }),
      headers: {},
      user: { role: 'owner' },
      getBlockletComponentId: () => 'c1',
      query: {},
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/.well-known/service/start?redirect'));

  await checkRunning(
    {
      url: '/?__start__=1',
      getBlocklet: () => ({ ...b, children: [{ meta: { did: 'c1' } }] }),
      headers: {},
      user: {},
      getBlockletComponentId: () => 'c1',
      query: { __start__: '1' },
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith(expect.not.stringContaining('__start__'));

  // return error page

  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b }),
      getNodeInfo: () => ({}),
      headers: {},
      user: {},
      accepts: () => 'html',
      getBlockletComponentId: () => {},
      query: {},
    },
    mockRes
  );
  expect(mockRes.status).toHaveBeenCalledWith(503);
  expect(mockRes.send).toHaveBeenCalledWith('mock-blocklet-maintenance-page');

  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b, status: BlockletStatus.starting }),
      getNodeInfo: () => ({}),
      headers: {},
      user: {},
      accepts: () => 'html',
      getBlockletComponentId: () => {},
      query: {},
    },
    mockRes
  );
  expect(mockRes.status).toHaveBeenCalledWith(503);
  expect(mockRes.send).toHaveBeenCalledWith('mock-blocklet-maintenance-page');

  // return error json

  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b }),
      getNodeInfo: () => ({}),
      headers: {},
      user: {},
      accepts: () => 'json',
      getBlockletComponentId: () => {},
      query: {},
    },
    mockRes
  );
  expect(mockRes.status).toHaveBeenCalledWith(503);
  expect(mockRes.json).toHaveBeenCalledWith({ code: 'error', error: 'blocklet is under maintenance' });

  // redirect to setup page
  await checkRunning(
    {
      url: '/',
      getBlocklet: () => ({ ...b, settings: {} }),
      headers: {},
      user: { role: 'owner' },
      getBlockletComponentId: () => {},
      query: {},
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith(expect.stringContaining('/.well-known/service/setup?redirect'));

  // redirect to no __start__
  await checkRunning(
    {
      url: '/?__start__=1',
      getBlocklet: () => ({ ...b, children: [{ meta: { did: 'c1' }, status: BlockletStatus.running }] }),
      headers: {},
      user: { role: 'owner' },
      getBlockletComponentId: () => 'c1',
      query: { __start__: '1' },
    },
    mockRes
  );
  expect(mockRes.redirect).toHaveBeenCalledWith('/');
});
