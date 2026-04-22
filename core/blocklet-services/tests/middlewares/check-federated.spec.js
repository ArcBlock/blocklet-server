/* eslint-disable global-require */
const { describe, beforeEach, afterEach, afterAll, mock, expect, test } = require('bun:test');

mock.module('@arcblock/jwt', () => ({
  verify: mock(() => true),
  decode: mock(() => true),
}));
mock.module('@abtnode/auth/lib/util/federated', () => ({
  isMaster: mock(() => true),
  getFederatedMaster: mock(() => true),
}));
mock.module('@blocklet/sdk/lib/util/verify-sign', () => ({
  getVerifyData: mock(() => true),
  verify: mock(() => true),
}));

const { isMaster, getFederatedMaster } = require('@abtnode/auth/lib/util/federated');
const { SIG_VERSION } = require('@blocklet/constant');
const { getVerifyData, verify } = require('@blocklet/sdk/lib/util/verify-sign');
const { checkFederatedCall } = require('../../api/middlewares/check-federated');

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('checkFederatedCall Middleware (default)', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      get: mock(),
    };
    res = {
      status: mock().mockReturnThis(),
      send: mock(),
      json: mock(),
    };
    next = mock();
    getVerifyData.mockReturnValue({
      sig: 'mockSig',
      data: 'mockData',
      sigPk: 'mockSigPk',
      sigVersion: SIG_VERSION.DEFAULT,
    });
  });

  afterEach(() => {
    getVerifyData.mockReset();
    res.status.mockReset();
    res.send.mockReset();
    res.json.mockReset();
  });

  test('should respond with 400 if blocklet is not present', () => {
    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('blocklet not exists');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 400 if signer is missing', () => {
    req.blocklet = {};
    req.body = { data: 'someData' };
    getVerifyData.mockReturnValue({
      data: 'mockData',
      sigPk: 'mockSigPk',
      sigVersion: SIG_VERSION.DEFAULT,
    });
    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('missing sig or data or sigPk');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 400 if data is missing', () => {
    req.blocklet = {};
    req.body = {};
    getVerifyData.mockReturnValue({
      sig: 'mockSig',
      sigPk: 'mockSigPk',
      sigVersion: SIG_VERSION.DEFAULT,
    });
    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('missing sig or data or sigPk');
    expect(next).not.toHaveBeenCalled();
  });
  test('should respond with 400 if sigPK is missing', () => {
    req.blocklet = {};
    req.body = {};
    getVerifyData.mockReturnValue({
      sig: 'mockSig',
      data: 'mockData',
      sigVersion: SIG_VERSION.DEFAULT,
    });
    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('missing sig or data or sigPk');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 403 if mode is memberToMaster and appPid does not match', () => {
    req.blocklet = { appPid: 'appPid1' };
    req.body = { signer: 'signerId', data: 'data' };
    getFederatedMaster.mockReturnValue({ appPid: 'appPid2' });

    const middleware = checkFederatedCall({ mode: 'memberToMaster' });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Only master can handle this request');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 403 if mode is masterToMember and appPid matches', () => {
    req.blocklet = { appPid: 'appPid1' };
    req.body = { signer: 'signerId', data: 'data' };
    getFederatedMaster.mockReturnValue({ appPid: 'appPid1' });

    const middleware = checkFederatedCall({ mode: 'masterToMember' });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('Only member can handle this request');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 403 if no valid site is found', () => {
    req.blocklet = { appPid: 'appPid1', settings: { federated: { sites: [] } } };
    req.body = { signer: 'signerId', data: 'data' };
    getFederatedMaster.mockReturnValue(null);
    isMaster.mockReturnValue(false);

    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 403 if valid site status is pending', () => {
    req.blocklet = {
      appPid: 'appPid1',
      settings: { federated: { sites: [{ appPid: 'signerId', status: 'pending' }] } },
    };
    req.body = { signer: 'signerId', data: 'data' };
    getFederatedMaster.mockReturnValue(null);
    isMaster.mockReturnValue(false);

    const middleware = checkFederatedCall({ mode: 'all' });
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Unauthorized');
    expect(next).not.toHaveBeenCalled();
  });

  test('should respond with 403 if JWT verification fails', async () => {
    req.blocklet = {
      appPid: 'appPid1',
      settings: { federated: { sites: [{ appPid: 'signerId', status: 'approved', pk: 'mockSigPk' }] } },
    };
    req.body = 'mockData';
    getFederatedMaster.mockReturnValue(null);
    isMaster.mockReturnValue(false);
    verify.mockResolvedValue(false);

    const middleware = checkFederatedCall({ mode: 'all' });
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('verify sig failed');
    expect(next).not.toHaveBeenCalled();
  });

  test('should set verifyData and verifySite and call next if verification succeeds', async () => {
    req.blocklet = {
      appPid: 'appPid1',
      settings: { federated: { sites: [{ appPid: 'signerId', status: 'approved', pk: 'mockSigPk' }] } },
    };
    req.body = 'mockData';
    getFederatedMaster.mockReturnValue(null);
    isMaster.mockReturnValue(false);
    verify.mockResolvedValue(true);

    const middleware = checkFederatedCall({ mode: 'all' });
    await middleware(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(req.verifyData).toEqual(req.body);
    expect(req.verifySite).toEqual({ appPid: 'signerId', status: 'approved', pk: 'mockSigPk' });
    expect(next).toHaveBeenCalled();
  });
});
