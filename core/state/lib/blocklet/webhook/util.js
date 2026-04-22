const md5 = require('@abtnode/util/lib/md5');

const API_VERSION = '2025-02-27';

const getWebhookJobId = (eventId, webhookId) => {
  return md5([eventId, webhookId].join('-'));
};

const STATUS = {
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  PENDING: 'pending',
};

module.exports = {
  API_VERSION,
  STATUS,
  getWebhookJobId,
};
