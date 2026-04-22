const { BaseState } = require('@abtnode/models');
const { isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');
const { CustomError } = require('@blocklet/error');
const logger = require('@abtnode/logger')('@abtnode/core:states:base');

const { isCLI } = require('../util');

/**
 * @template T
 * @extends BaseState<T>
 */
class ExtendedBase extends BaseState {
  constructor(model, config) {
    super(model, config);

    // HACK: do not emit any events from CLI
    if (isCLI() && process.env.NODE_ENV !== 'test') {
      this.emit = (name) => logger.debug('stopped state db event in CLI', name);
    }
  }

  update(condition, updates, options) {
    return super.update(condition, updates, { returnUpdatedDocs: true, ...options });
  }

  /**
   * 验证输入的URL是否合法，如果非法禁止保存
   */
  async validateURL(urls = [], label = '') {
    if (urls.length === 0) {
      return true;
    }
    const validateResults = await Promise.all(
      urls.map(async (url) => {
        try {
          const allowed = await isAllowedURL(url);
          return { url, allowed };
        } catch (error) {
          logger.warn('URL validation failed', { url, error });
          return { url, allowed: false };
        }
      })
    );

    const allowed = validateResults.every((item) => item.allowed);
    if (!allowed) {
      const invalidUrls = validateResults
        .filter((result) => !result.allowed)
        .map((result) => result.url)
        .filter(Boolean);

      throw new CustomError(400, `Invalid ${label || 'URLs'}: ${invalidUrls.join(', ')}`);
    }
    return true;
  }
}

module.exports = ExtendedBase;
