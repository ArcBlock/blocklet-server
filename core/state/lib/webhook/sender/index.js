/* eslint-disable no-restricted-syntax, global-require */
const logger = require('@abtnode/logger')('@abtnode/core:sender');

const Slack = require('./slack');
const Api = require('./api');
const Wallet = require('./wallet');

const SenderMap = new Map([
  [Slack.type, Slack],
  [Api.type, Api],
]);

const getSenderNames = () => [...SenderMap.keys()];

const getSender = (name) => {
  if (name === Wallet.type) {
    return Wallet;
  }

  if (!SenderMap.has(name)) {
    logger.error(`getSender:sender name [${name}] does not exist`);
    return null;
  }

  return SenderMap.get(name);
};

const listSenders = () => getSenderNames().map((x) => SenderMap.get(x).describe());

const getMessageSender = (name) => {
  const Sender = getSender(name);
  if (Sender) {
    return new Sender();
  }

  return {};
};

module.exports = {
  getSender,
  getSenderNames,
  listSenders,
  getMessageSender,
};
