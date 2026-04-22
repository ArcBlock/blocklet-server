const express = require('express');
const logger = require('../libs/logger');
const states = require('../states');

const router = express.Router();

router.get('/.well-known/acme-challenge/:token', async (req, res) => {
  const challenge = await states.httpChallenge.findOne({ key: req.params.token });
  logger.debug('acme challenge', { token: req.params.token, challenge });
  if (!challenge) {
    return res.status(404).send();
  }

  return res.send(challenge.value);
});

module.exports = router;
