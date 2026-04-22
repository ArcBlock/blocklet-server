const { handlers } = require('../libs/auth');
const createDidHandler = require('./auth/create-did');

module.exports = {
  init(app) {
    handlers.attach({ app, ...createDidHandler });
  },
};
