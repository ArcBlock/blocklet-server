const { it, expect, describe, mock, beforeEach } = require('bun:test');
const { ROLES, SERVER_ROLES } = require('@abtnode/constant');

const verifyBlockletScope = require('../../../api/middlewares/verify-blocklet-scope');

describe('verifyBlockletScope', () => {
  let res;
  let next;
  const run = (user, target) => {
    const mw = verifyBlockletScope(req => req.params.did);
    return mw({ user, params: { did: target } }, res, next);
  };

  beforeEach(() => {
    res = { status: mock().mockReturnThis(), json: mock() };
    next = mock();
  });

  it('should skip non blocklet roles', () => {
    run({ role: ROLES.ADMIN, did: 'z1admin' }, 'zNKserver');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should skip anonymous requests, auth is handled upstream', () => {
    run(undefined, 'zNKserver');
    expect(next).toHaveBeenCalled();
  });

  it('should allow a blocklet to access its own did', () => {
    run({ role: SERVER_ROLES.BLOCKLET_SDK, blockletDid: 'zNKapp' }, 'zNKapp');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow a component path under its own app', () => {
    run({ role: SERVER_ROLES.BLOCKLET_SDK, blockletDid: 'zNKapp' }, 'zNKapp/z8component');
    expect(next).toHaveBeenCalled();
  });

  // Regression: a leaked BLOCKLET_APP_SK authenticates as blocklet-sdk, which owns
  // mutate_blocklet, and was able to download the server's own logs
  it('should reject a blocklet identity targeting the server did', () => {
    run({ role: SERVER_ROLES.BLOCKLET_SDK, blockletDid: 'zNKapp' }, 'zNKserverDid');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: 'forbidden', error: "You cannot access other blocklet's data" });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject a blocklet identity targeting another app', () => {
    for (const role of [
      SERVER_ROLES.BLOCKLET_SDK,
      SERVER_ROLES.BLOCKLET_OWNER,
      SERVER_ROLES.BLOCKLET_ADMIN,
      SERVER_ROLES.BLOCKLET_MEMBER,
    ]) {
      res = { status: mock().mockReturnThis(), json: mock() };
      next = mock();
      run({ role, blockletDid: 'zNKapp' }, 'zNKotherApp');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    }
  });

  it('should pass through when no target did is present', () => {
    run({ role: SERVER_ROLES.BLOCKLET_SDK, blockletDid: 'zNKapp' }, undefined);
    expect(next).toHaveBeenCalled();
  });
});
