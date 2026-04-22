const crypto = require('crypto');
const { generateWebhookSecret, createWebhookSignature } = require('../../../lib/blocklet/webhook/signature');

describe('Webhook Signature', () => {
  describe('generateWebhookSecret', () => {
    test('should generate a 64-character hex string', () => {
      const secret = generateWebhookSecret();
      expect(secret).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(secret)).toBe(true);
    });

    test('should generate unique secrets', () => {
      const secret1 = generateWebhookSecret();
      const secret2 = generateWebhookSecret();
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('createWebhookSignature', () => {
    test('should produce a valid signature format', () => {
      const secret = 'test-secret';
      const payload = { type: 'test.event', data: { id: '123' } };
      const timestamp = 1709000000;

      const signature = createWebhookSignature(secret, payload, timestamp);
      expect(signature).toMatch(/^t=\d+,v1=[0-9a-f]{64}$/);
    });

    test('should embed the timestamp in the signature', () => {
      const secret = 'test-secret';
      const payload = { key: 'value' };
      const timestamp = 1709000000;

      const signature = createWebhookSignature(secret, payload, timestamp);
      expect(signature.startsWith(`t=${timestamp},`)).toBe(true);
    });

    test('should produce consistent signatures for the same inputs', () => {
      const secret = 'my-secret';
      const payload = { event: 'user.created' };
      const timestamp = 1709000000;

      const sig1 = createWebhookSignature(secret, payload, timestamp);
      const sig2 = createWebhookSignature(secret, payload, timestamp);
      expect(sig1).toBe(sig2);
    });

    test('should produce different signatures for different secrets', () => {
      const payload = { event: 'user.created' };
      const timestamp = 1709000000;

      const sig1 = createWebhookSignature('secret-1', payload, timestamp);
      const sig2 = createWebhookSignature('secret-2', payload, timestamp);
      expect(sig1).not.toBe(sig2);
    });

    test('should produce different signatures for different payloads', () => {
      const secret = 'test-secret';
      const timestamp = 1709000000;

      const sig1 = createWebhookSignature(secret, { a: 1 }, timestamp);
      const sig2 = createWebhookSignature(secret, { b: 2 }, timestamp);
      expect(sig1).not.toBe(sig2);
    });

    test('should produce different signatures for different timestamps', () => {
      const secret = 'test-secret';
      const payload = { key: 'value' };

      const sig1 = createWebhookSignature(secret, payload, 1709000000);
      const sig2 = createWebhookSignature(secret, payload, 1709000001);
      expect(sig1).not.toBe(sig2);
    });

    test('should be verifiable with the same inputs', () => {
      const secret = 'verification-secret';
      const payload = { type: 'order.completed', data: { orderId: 'abc' } };
      const timestamp = 1709000000;

      const signature = createWebhookSignature(secret, payload, timestamp);

      // Parse the signature
      const parts = signature.split(',');
      const t = parts[0].replace('t=', '');
      const v1 = parts[1].replace('v1=', '');

      // Recreate the expected HMAC
      const signedContent = `${t}.${JSON.stringify(payload)}`;
      const expectedHmac = crypto.createHmac('sha256', secret).update(signedContent).digest('hex');

      expect(v1).toBe(expectedHmac);
    });
  });
});
