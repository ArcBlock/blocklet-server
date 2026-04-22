const { auditLogList } = require('@blocklet/did-space-js');
const { WELLKNOWN_SERVICE_PATH_PREFIX } = require('@abtnode/constant');

module.exports = {
  /**
   * 初始化 did-space 服务
   * @param {object} params 初始化参数
   * @param {import('express').Express} params.server Express 实例对象
   */
  init({ server }) {
    // 查询 did space 审计日志
    server.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did-space/audit-log/list`, auditLogList); // 后续去掉
    server.get(`${WELLKNOWN_SERVICE_PATH_PREFIX}/api/did-space/audit-logs`, auditLogList);
  },
};
