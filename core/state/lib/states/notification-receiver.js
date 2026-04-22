const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').NotificationReceiverState>
 */
class NotificationReceiverState extends BaseState {
  // eslint-disable-next-line no-useless-constructor
  constructor(...args) {
    super(...args);
    this.enableCountCache = `notification-receiver-count-${Math.random().toString(36).substring(2, 15)}`;
  }
}

module.exports = NotificationReceiverState;
