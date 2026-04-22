// eslint-disable-next-line global-require
const logger = require('@abtnode/logger')('@abtnode/core:states:migration');

const BaseState = require('./base');

/**
 * @extends BaseState<import('@abtnode/models').MigrationState>
 */
class MigrationState extends BaseState {
  // eslint-disable-next-line no-unused-vars
  async isExecuted({ script, version }, context) {
    try {
      const item = await this.findOne({ script, version });
      return !!item;
    } catch (err) {
      logger.error('failed to find migration', { script, version });
      return false;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async markExecuted({ script, version }, context) {
    try {
      const result = await this.insert({ script, version, executedAt: new Date() });
      logger.info('mark executed', result);
      return result;
    } catch (error) {
      logger.error('mark executed failed', { error, script, version });
      return false;
    }
  }
}

module.exports = MigrationState;
