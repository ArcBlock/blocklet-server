const crypto = require('crypto');

function generateWebhookSecret() {
  return crypto.randomBytes(32).toString('hex');
}

function createWebhookSignature(secret, payload, timestamp) {
  const signedContent = `${timestamp}.${JSON.stringify(payload)}`;
  const hmac = crypto.createHmac('sha256', secret).update(signedContent).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

module.exports = { generateWebhookSecret, createWebhookSignature };
