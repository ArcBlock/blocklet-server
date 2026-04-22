const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').WebhookAttempt>
 */
class WebhookAttemptState extends BaseState {
  constructor(model, config, models) {
    super(model, config);

    this.models = models;
  }

  async list(page, pageSize, where = {}) {
    const condition = {
      where,
      include: [
        { model: this.models.WebhookEvent, as: 'event' },
        { model: this.models.WebhookEndpoint, as: 'endpoint' },
      ],
    };

    const { list, paging } = await this.paginate(condition, { createdAt: -1 }, { pageSize, page });
    return { list, paging };
  }
}

module.exports = WebhookAttemptState;
