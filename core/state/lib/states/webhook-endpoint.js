const Joi = require('joi');
const { CustomError } = require('@blocklet/error');

const BaseState = require('./base');
const { generateWebhookSecret } = require('../blocklet/webhook/signature');

const webhookEndpointSchema = Joi.object({
  id: Joi.string().max(30),

  apiVersion: Joi.string().max(16).required(),

  url: Joi.string().max(512).required(),
  description: Joi.string().max(512).optional().allow(''),
  enabledEvents: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        source: Joi.string().required(),
      })
    )
    .required(),

  metadata: Joi.object().optional(),

  status: Joi.string().valid('enabled', 'disabled').required(),

  secret: Joi.string().max(256).optional(),
});

const updateWebhookEndpointSchema = Joi.object({
  url: Joi.string().max(512).optional(),
  description: Joi.string().max(512).optional(),
  enabledEvents: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().required(),
        source: Joi.string().required(),
      })
    )
    .optional(),
  status: Joi.string().valid('enabled', 'disabled').optional(),
  metadata: Joi.object().optional(),
  secret: Joi.string().max(256).optional(),
});

/**
 * @extends BaseState<import('@abtnode/models').WebhookEndpoint>
 */
class WebhookEndpointState extends BaseState {
  async create(input) {
    // 校验非法的URL
    await this.validateURL([input.url], 'webhook endpoint URL');

    if (!input.secret) {
      input.secret = generateWebhookSecret();
    }

    await webhookEndpointSchema.validateAsync(input, { stripUnknown: true });

    const webhook = await this.insert(input);
    return webhook;
  }

  async list(page, pageSize, where) {
    const { list, paging } = await this.paginate({ where }, { createdAt: -1 }, { pageSize, page });
    return { list, paging };
  }

  async updateWebhook(id, updates) {
    const doc = await this.findOne({ where: { id } });
    if (!doc) {
      throw new CustomError(400, 'webhook endpoint not found');
    }

    await updateWebhookEndpointSchema.validateAsync(updates, { stripUnknown: true });
    if (updates.metadata && updates.status && updates.status !== 'enabled') {
      updates.metadata = {
        ...(doc.metadata || {}),
        ...(updates.metadata || {}),
        consecutiveFailures: 0,
      };
    }

    await this.update({ id }, { $set: updates });
    return doc;
  }

  async deleteWebhook(id) {
    const doc = await this.findOne({ where: { id } });
    if (!doc) {
      throw new CustomError(400, 'webhook endpoint not found');
    }

    await this.remove({ id });
    return doc;
  }
}

module.exports = WebhookEndpointState;
