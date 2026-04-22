const path = require('path');
const { createSequelize, getServiceModels, setupModels, createStateFactory } = require('@abtnode/models');

const MessageState = require('./message');
const logger = require('../libs/logger')('@abtnode/blocklet-service:states');

const models = getServiceModels();

const getDbFilePath = (filePath) => (process.env.NODE_ENV === 'test' ? `${filePath}:memory:` : filePath);

const init = (dataDir, config) => {
  const dbPath = getDbFilePath(path.join(dataDir, 'service.db'));
  const sequelize = createSequelize(dbPath);
  setupModels(models, sequelize);
  logger.info(`Init service states in ${dbPath}`);

  const messageState = new MessageState(models.Message, config);

  return {
    message: messageState,
  };
};

module.exports = createStateFactory(init, models);
