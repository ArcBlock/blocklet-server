const logger = require('@abtnode/logger')('@abtnode/core:states:webhook');
const { CustomError } = require('@blocklet/error');
const BaseState = require('./base');
const { validateWebhook } = require('../validators/webhook');
const { updateWebhookFailureState } = require('../util/webhook');

/**
 * @extends BaseState<import('@abtnode/models').WebHookState>
 */
class WebhookState extends BaseState {
  async create(info, { mock } = {}) {
    const { type, params } = info;

    const filterParams = params.map((item) => {
      const data = {
        name: item.name,
        value: item.value,
      };
      return data;
    });

    const data = {
      type,
      params: filterParams,
      createdAt: Date.now(),
    };

    const exist = await this.list();
    const existUrls = exist.map((item) => item.params.map((param) => param.value)).flat();

    await validateWebhook(data, { existUrls });

    if (mock) {
      return data;
    }

    const webhook = await this.insert(data);
    return webhook;
  }

  // eslint-disable-next-line no-unused-vars
  async list() {
    const res = await this.paginate({}, { createdAt: -1 }, { pageSize: 100 });
    return res.list;
  }

  async delete({ id } = {}) {
    logger.info('remove webhook id', { id });
    if (!id) {
      throw new Error('webhookId should not be empty');
    }
    const webhook = await this.findOne(id);
    const num = await this.remove({ id });
    if (num <= 0) {
      throw new Error(`${id} does not exist`);
    }

    return webhook;
  }

  async findOne(id) {
    try {
      const webhook = await super.findOne({ id });
      return webhook;
    } catch (error) {
      throw new Error(`webhook with id ${id} not exist`);
    }
  }

  /**
   * 更新 webhook 状态（开启/关闭或连续失败次数）
   * @param {string} id - webhook ID
   * @param {object} options - 更新选项
   * @param {string} [options.url] - 要更新的 URL，不传则更新所有 URL 类型的 param
   * @param {boolean} [options.enabled] - 开启/关闭状态
   * @param {number} [options.consecutiveFailures] - 连续失败次数，不传则默认+1，传入必须大于原有值或为0
   * @throws {Error} 当同时提供 enabled 和 consecutiveFailures 时抛出错误
   * @throws {Error} 当未提供任何更新参数时抛出错误
   * @throws {Error} 当 consecutiveFailures 值无效时抛出错误
   * @throws {Error} 当指定的 url 不存在时抛出错误
   */
  async updateWebhook(id, { url, enabled, consecutiveFailures } = {}, createNotification = () => {}) {
    // 验证不能同时设置开启/关闭和连续失败次数
    if (enabled !== undefined && consecutiveFailures !== undefined) {
      throw new CustomError(400, 'Cannot update enabled and consecutiveFailures at the same time.');
    }

    // 验证至少提供一个更新参数
    if (enabled === undefined && consecutiveFailures === undefined) {
      throw new CustomError(400, 'Must provide either enabled or consecutiveFailures to update.');
    }

    // 获取当前 webhook 状态
    const currentWebhook = await this.findOne(id);

    if (!currentWebhook) {
      throw new CustomError(404, `webhook with id ${id} not exist`);
    }

    // 确定匹配函数
    const matcher = url ? (item) => item.value === url : (item) => item.name === 'url' && item.value;

    // 验证是否有匹配的项
    const hasMatchingItems = currentWebhook.params.some(matcher);
    if (!hasMatchingItems) {
      if (url) {
        throw new CustomError(404, `URL ${url} not found in webhook params.`);
      }
      throw new CustomError(400, 'No valid URL params found to update.');
    }

    // 遍历并更新匹配的项（只复制需要修改的项）
    const updatedParams = currentWebhook.params.map((item) => {
      if (matcher(item)) {
        const cloned = { ...item };
        // 使用抽离的核心逻辑更新失败状态（webhook.js 需要验证递增）
        updateWebhookFailureState(cloned, { enabled, consecutiveFailures }, createNotification, {
          validateIncremental: true,
        });
        return cloned;
      }
      return item;
    });

    // 更新整个 params 数组
    const [updatedRows, [updatedWebhook]] = await this.update({ id }, { params: updatedParams });
    if (updatedRows === 1) {
      return updatedWebhook;
    }
    return currentWebhook;
  }
}

module.exports = WebhookState;
