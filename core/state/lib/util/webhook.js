const { CustomError } = require('@blocklet/error');
const { WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD } = require('@abtnode/constant');

/**
 * 更新 webhook 项的失败状态（直接修改传入的对象）
 * @param {Object} item - webhook 对象（会被直接修改）
 * @param {Object} updates - 更新参数
 * @param {boolean} [updates.enabled] - 新的启用状态
 * @param {number} [updates.consecutiveFailures] - 新的连续失败次数（如果不传则自动 +1）
 * @param {Function} [createNotification] - 达到阈值时的通知回调
 * @param {Object} [options] - 额外选项
 * @param {boolean} [options.validateIncremental] - 是否验证 consecutiveFailures 必须递增（默认 false）
 */
function updateWebhookFailureState(item, updates, createNotification, options = {}) {
  const { enabled, consecutiveFailures } = updates;
  const { validateIncremental = false } = options;

  // 处理 enabled 更新
  if (enabled !== undefined) {
    item.enabled = enabled;
    // 如果关闭 webhook，自动将连续失败次数重置为 0
    if (enabled === false) {
      item.consecutiveFailures = 0;
    }
    return item;
  }

  // 处理 consecutiveFailures 更新
  const currentFailures = item.consecutiveFailures || 0;

  if (consecutiveFailures === undefined) {
    // 未传入值，默认 +1
    // 这么做的原因是由于，在队列中拿到的值不是最新的值，在外面进行 + 1 操作是不准确的
    item.consecutiveFailures = currentFailures + 1;
  } else {
    // 验证必须是非负整数
    if (!Number.isInteger(consecutiveFailures) || consecutiveFailures < 0) {
      throw new CustomError(400, 'consecutiveFailures must be a non-negative integer.');
    }

    // 如果需要验证递增
    if (validateIncremental && consecutiveFailures !== 0 && consecutiveFailures <= currentFailures) {
      throw new CustomError(
        400,
        `consecutiveFailures must be greater than the current value (${currentFailures}) or equal to 0.`
      );
    }

    item.consecutiveFailures = consecutiveFailures;
  }

  // 达到阈值则自动禁用并触发通知
  if (item.consecutiveFailures >= WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD) {
    item.enabled = false;
    item.consecutiveFailures = 0;
    if (createNotification) {
      createNotification(item);
    }
  }
  return item;
}

module.exports = {
  updateWebhookFailureState,
};
