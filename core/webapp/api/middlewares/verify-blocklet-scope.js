const { isBlockletRole } = require('@abtnode/constant');

/**
 * mutateBlockletPermission 只校验角色是否拥有 mutate_blocklet 权限，不校验操作目标。
 * blocklet-sdk / blocklet-owner 等 blocklet 身份天然拥有该权限（见 RBAC_CONFIG），
 * 因此持有某个应用 appSk 的调用方可以读取 server 自身或其它应用的数据。
 *
 * 该中间件补上目标归属校验：blocklet 身份只能操作自己的 did，
 * 与 gql 的 verify-team 中间件保持同一套语义。
 *
 * @param {(req: import('express').Request) => string} getTargetDid 从请求中取出操作目标 did
 */
const verifyBlockletScope = getTargetDid => (req, res, next) => {
  const role = req.user?.role;
  if (!isBlockletRole(role)) {
    return next();
  }

  const target = getTargetDid(req);
  if (!target) {
    return next();
  }

  // 组件共享父应用状态，blockletDid 始终是根应用的 did
  const [targetRoot] = String(target).split('/');
  if (req.user?.blockletDid !== targetRoot) {
    return res.status(403).json({ code: 'forbidden', error: "You cannot access other blocklet's data" });
  }

  return next();
};

module.exports = verifyBlockletScope;
