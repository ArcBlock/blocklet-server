const ensurePermission = node => async (req, res, next) => {
  if (req.user) {
    const rbac = await node.getRBAC();
    const can = rbac.canAny(
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
