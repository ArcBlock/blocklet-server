const { it, expect, describe, mock, beforeEach } = require('bun:test');
const { ROLES } = require('@abtnode/constant');

const mutateBlockletPermission = require('../../../api/middlewares/mutate-blocklet-permission');

describe('mutateBlockletPermission', () => {
  let node;
  let req;
  let res;
  let next;
  let canAny;

  beforeEach(() => {
    canAny = mock().mockResolvedValue(false);
    node = { getRBAC: mock().mockResolvedValue({ canAny }) };
    req = { user: null };
    res = { status: mock().mockReturnThis(), json: mock() };
    next = mock();
  });

  it('should reject anonymous requests', async () => {
    await mutateBlockletPermission(node)(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'not authorized' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should reject roles without mutate permission', async () => {
    req.user = { role: ROLES.GUEST };
    await mutateBlockletPermission(node)(req, res, next);
    expect(canAny).toHaveBeenCalledWith(ROLES.GUEST, [
      ['mutate', 'blocklets'],
      ['mutate', 'blocklet'],
    ]);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ code: 'forbidden', error: 'no permission' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow roles with mutate permission', async () => {
    canAny.mockResolvedValue(true);
    req.user = { role: ROLES.ADMIN };
    await mutateBlockletPermission(node)(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  // Regression: canAny is async, a missing await made the check always pass
  it('should await the permission check instead of trusting the promise', async () => {
    let settled = false;
    canAny = mock(
      () =>
        new Promise(resolve => {
          setTimeout(() => {
            settled = true;
            resolve(false);
          }, 10);
        })
    );
    node.getRBAC.mockResolvedValue({ canAny });
    req.user = { role: ROLES.GUEST };

    await mutateBlockletPermission(node)(req, res, next);

    expect(settled).toBe(true);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
