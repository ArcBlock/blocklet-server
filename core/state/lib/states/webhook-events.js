const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').WebhookEvent>
 */
class WebhookEventState extends BaseState {
  async create(input) {
    const event = await this.insert(input);
    return event;
  }
}

module.exports = WebhookEventState;
