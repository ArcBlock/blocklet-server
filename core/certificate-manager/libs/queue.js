const createQueue = require('@abtnode/queue');
const QueueStore = require('@abtnode/queue/lib/store/sequelize');
const logger = require('./logger');

module.exports = ({ name, model, onJob, options = {} }) => {
  const queue = createQueue({
    store: new QueueStore(model, name),
    onJob,
    options: {
      ...options,
      logger,
    },
  });

  return queue;
};
