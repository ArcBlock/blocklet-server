const { auditLogList } = require('@blocklet/did-space-js');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');
const { assertSafeUrl } = require('@abtnode/util/lib/safe-url');

const { checkGuestPermission } = require('../../middlewares/check-permission');

/**
 * auditLogList 会用 blocklet 的钱包对请求签名后转发到 endpoint，
 * 所以必须登录，并且确保 endpoint 不能指向内网或云元数据地址
 */
const ensureSafeEndpoint = async (req, res, next) => {
  try {
    await assertSafeUrl(req.query.endpoint);
    return next();
  } catch (error) {
    return res.status(400).json({ code: 'bad_request', error: error.message });
  }
};

module.exports = {
  /**
   * 初始化 did-space 服务
   * @param {object} params 初始化参数
   * @param {import('express').Express} params.server Express 实例对象
   */
  init({ server }) {
    // 查询 did space 审计日志
    server.get(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did-space/audit-log/list`,
      checkGuestPermission,
      ensureSafeEndpoint,
      auditLogList
    ); // 后续去掉
    server.get(
      `${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did-space/audit-logs`,
      checkGuestPermission,
      ensureSafeEndpoint,
      auditLogList
    );
  },
};
