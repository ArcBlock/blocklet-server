const path = require('path');
const { createSequelize, getCertificateManagerModels, setupModels, createStateFactory } = require('@abtnode/models');
const logger = require('@abtnode/logger')('@abtnode/certificate-manager:states');

const Account = require('./account');
const Certificate = require('./certificate');
const HttpChallenge = require('./http-challenge');
const Job = require('./job');

const models = getCertificateManagerModels();

const getDbFilePath = (filePath) => (process.env.NODE_ENV === 'test' ? `${filePath}:memory:` : filePath);

const init = (dataDir) => {
  const dbPath = getDbFilePath(path.join(dataDir, 'module.db'));

  const sequelize = createSequelize(dbPath);
  setupModels(models, sequelize);
  logger.info(`Init certificate manager states in ${dbPath}`);

  const account = new Account(models.Account);
  const certificate = new Certificate(models.Certificate);
  const httpChallenge = new HttpChallenge(models.HttpChallenge);
  const job = new Job(models.Job);

  return {
    account,
    certificate,
    httpChallenge,
    job,
  };
};

module.exports = createStateFactory(init, models);
