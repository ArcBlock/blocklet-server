const express = require('express');
const wellKnownRouter = require('./well-known');
const states = require('../states');

const router = express.Router();

const createRoutes = (dataDir) => {
  states.init(dataDir);

  router.use(wellKnownRouter);

  return router;
};

module.exports = createRoutes;
