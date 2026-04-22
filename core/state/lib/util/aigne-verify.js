/**
 * 用于验证 aigne 的配置是否正确
 */
const { AIGNE_CONFIG_ENCRYPT_SALT } = require('@abtnode/constant');
const { decrypt } = require('@abtnode/util/lib/security');
const axios = require('@abtnode/util/lib/axios');
const { joinURL } = require('ufo');
const logger = require('@abtnode/logger')('@abtnode/core:util:aigne-verify');

const decryptValue = (value, did) => {
  return value ? decrypt(value, did || AIGNE_CONFIG_ENCRYPT_SALT, '') : value;
};

const getAigneHubModelApi = async (url) => {
  try {
    const urlObj = new URL(url);
    const appUrl = urlObj.origin;
    const { data: blockletJson } = await axios.get(joinURL(appUrl, '__blocklet__.js?type=json'));
    const { componentMountPoints = [] } = blockletJson || {};

    const component = componentMountPoints.find((item) => item.name === 'ai-kit');
    if (!component) {
      throw new Error("The current application doesn't have the AIGNE Hub component installed");
    }

    return joinURL(appUrl, component.mountPoint);
  } catch (error) {
    throw new Error('Failed to establish connection to AIGNE Hub API endpoint at the specified URL');
  }
};

/**
 * 通过 api 验证 aigne hub model 是否可用
 */
const verifyAigneViaApi = async ({ url, model, apiKey }) => {
  if (!url || !apiKey) {
    return {
      valid: false,
      error: 'url and apiKey are required',
    };
  }

  try {
    const { data } = await axios.get(joinURL(url, '/api/v2/status'), {
      ...(model && { params: { model } }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    logger.info('Response data', { data });
    return { valid: data.available };
  } catch (error) {
    logger.error('Failed to verify aigne hub model via api', { error });
    return {
      valid: false,
      error: error.message,
    };
  }
};

const verifyAigneHub = async (config, blocklet) => {
  try {
    if (!config.url) {
      return {
        valid: false,
        error: 'AIGNE Hub API URL must be provided in the configuration',
      };
    }
    if (!config.key) {
      return {
        valid: false,
        error: 'AIGNE Hub API key must be provided in the configuration',
      };
    }

    const baseUrl = await getAigneHubModelApi(config.url);
    const { did } = blocklet?.meta || {};
    const apiKey = decryptValue(config.key, did);

    const result = await verifyAigneViaApi({
      url: baseUrl,
      model: !config.model || config.model === 'auto' ? undefined : config.model,
      apiKey,
    });

    logger.info('verify aigne hub model via api', { result });

    return result;
  } catch (error) {
    logger.error(`verify ${config.provider} config error`, { error });
    return { valid: false, error: error.message };
  }
};

/**
 * 主验证函数 - 根据配置中的 provider 执行对应的验证方法
 * @param {Object} config - 配置对象
 * @param {string} config.provider - 提供商名称
 * @param {string} config.apiKey - API 密钥
 * @param {string} [config.baseURL] - 基础 URL
 * @param {string} [config.model] - 模型名称
 * @param {Object} [config.options] - 其他选项
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function verifyAigneConfig(config, blocklet) {
  try {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        error: 'AIGNE configuration must be a valid object',
      };
    }

    return await verifyAigneHub(config, blocklet);
  } catch (error) {
    return {
      valid: false,
      error: `Verification failed: ${error.message}`,
    };
  }
}

module.exports = {
  verifyAigneConfig,
  verifyAigneHub,
  decryptValue,
};
