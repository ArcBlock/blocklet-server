const Joi = require('joi');
const axios = require('@abtnode/util/lib/axios');
const logger = require('@abtnode/logger')('@abtnode/core:sender:api');
const { isAllowedURL } = require('@abtnode/util/lib/ssrf-protector');
const BaseSender = require('../base');

class APISender extends BaseSender {
  async send(params, message) {
    const url = params.find((x) => x.name === 'url').value;
    const { status, name, title, description } = message;

    try {
      if (!(await isAllowedURL(url))) {
        throw new Error('Invalid URL');
      }
      await axios.post(
        url,
        {
          status,
          name,
          title,
          description,
        },
        { timeout: 10000 }
      );
    } catch (error) {
      logger.error('failed to push notification to api', { url, message: JSON.stringify(message), error });
    }
  }

  sendTestMessage(params, message) {
    return this.send(params, {
      description: message,
      status: 'info',
      name: 'Test Message',
      title: 'Test Message',
    });
  }

  async sendNotification(url, notification) {
    if (process.env.NODE_ENV === 'test') {
      return {
        text: 'ok',
      };
    }
    try {
      const res = await axios.post(url, notification, { timeout: 10000 });
      return { text: res.statusText, code: res.status };
    } catch (error) {
      logger.error('failed to push notification to api', { url, error });
      throw error;
    }
  }
}

APISender.type = 'api';

APISender.describe = () => ({
  type: APISender.type,
  title: 'API Integration',
  description: 'Send notification use API',
  params: [
    {
      name: 'url',
      description: 'API Webhook URL',
      required: true,
      defaultValue: '',
      validate: (x) => !!x,
      value: '',
      type: 'url',
      enabled: true,
      consecutiveFailures: 0,
      schema: Joi.string()
        .required()
        .uri({ scheme: [/https?/] }),
    },
  ],
});

module.exports = APISender;
