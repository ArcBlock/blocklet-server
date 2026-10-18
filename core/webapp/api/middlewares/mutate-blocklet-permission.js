const ensurePermission = node => async (req, res, next) => {
  if (req.user) {
    const rbac = await node.getRBAC();
    // NOTICE: canAny is async, without await the returned promise is always truthy
    const can = await rbac.canAny(
      req.user.role,
      ['mutate_blocklets', 'mutate_blocklet'].map(x => x.split('_'))
    );
    if (!can) {
      return res.status(403).json({ code: 'forbidden', error: 'no permission' });
    }
  } else {
    return res.status(403).json({ code: 'forbidden', error: 'not authorized' });
  }

  return next();
};

module.exports = ensurePermission;
