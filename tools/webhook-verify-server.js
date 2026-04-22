/**
 * Blocklet Server Webhook Signature Verification Example
 *
 * This example shows how to verify webhook signatures sent by Blocklet Server.
 *
 * Setup:
 *   1. Create a Webhook Endpoint in Blocklet Server admin panel
 *   2. Copy the Signing Secret shown after creation
 *   3. Set it as environment variable: WEBHOOK_SIGNING_SECRET=<secret>
 *   4. Set the Webhook Endpoint URL to: http://<your-host>:3999/webhook
 *
 * Run:
 *   WEBHOOK_SIGNING_SECRET=<secret> node webhook-verify-server.js
 *
 * Signature format:
 *   Header:  X-Webhook-Signature: t=<unix-timestamp>,v1=<hmac-sha256-hex>
 *   Signed:  HMAC-SHA256(secret, "<timestamp>.<json-body>")
 */

const crypto = require('crypto');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3999;
const SECRET = process.env.WEBHOOK_SIGNING_SECRET;

if (!SECRET) {
  console.error('Error: WEBHOOK_SIGNING_SECRET environment variable is required');
  console.error('Usage: WEBHOOK_SIGNING_SECRET=<secret> node webhook-verify-server.js');
  process.exit(1);
}

/**
 * Verify a Blocklet Server webhook signature.
 *
 * @param {string} secret    - The signing secret from Blocklet Server
 * @param {object} body      - The parsed JSON request body
 * @param {string} signature - The X-Webhook-Signature header value
 * @param {number} [tolerance=300] - Max allowed age in seconds (default: 5 min)
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyWebhookSignature(secret, body, signature, tolerance = 300) {
  if (!signature) {
    return { valid: false, reason: 'missing signature' };
  }

  const parts = signature.split(',');
  const timestamp = parts[0]?.replace('t=', '');
  const hmac = parts[1]?.replace('v1=', '');

  if (!timestamp || !hmac) {
    return { valid: false, reason: 'malformed signature' };
  }

  // Reject expired signatures to prevent replay attacks
  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (age > tolerance) {
    return { valid: false, reason: `signature expired (${age}s old)` };
  }

  // Recompute HMAC and compare using timing-safe equality
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${JSON.stringify(body)}`)
    .digest('hex');

  const valid = crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));

  return valid ? { valid: true } : { valid: false, reason: 'signature mismatch' };
}

app.use(express.json());

app.post('/webhook', (req, res) => {
  const result = verifyWebhookSignature(SECRET, req.body, req.headers['x-webhook-signature']);

  if (!result.valid) {
    console.log('[webhook] rejected:', result.reason);
    return res.status(401).json({ error: result.reason });
  }

  console.log('[webhook] verified:', req.body.type || 'unknown event');

  // TODO: handle your business logic here
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}/webhook`);
});
