const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const WebhookState = require('../../lib/states/webhook');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('WebhookState', () => {
  let store = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    store = new WebhookState(models.WebHook, {});
  });

  afterAll(async () => {
    await store.reset();
  });

  const webhookParam = {
    name: 'url',
    value: 'https://hooks.slack.com/xxxxxxxx',
  };

  test('should create slack webhook', async () => {
    const doc = await store.create({
      type: 'slack',
      params: [
        {
          description: 'Slack Incoming Webhook URL',
          required: true,
          defaultValue: '',
          type: 'url',
          ...webhookParam,
        },
      ],
    });
    expect(doc.type).toEqual('slack');
    expect(doc.params).toEqual([webhookParam]);
  });

  test('should get webhooks', async () => {
    const docs = await store.list();
    expect(docs[0].type).toEqual('slack');
    expect(docs[0].params).toEqual([webhookParam]);
  });

  test('should throw on invalid slack webhook', async () => {
    try {
      await store.create({
        type: 'slack',
        params: [
          {
            description: 'Slack Incoming Webhook URL',
            required: true,
            defaultValue: '',
            type: 'url',
            name: 'url',
            value: 'https://xxx.slack.com/xxxxxxxx',
          },
        ],
      });
      expect(false).toBe(true);
    } catch (err) {
      expect(err).toBeTruthy();
    }
  });
  // 测试 updateWebhook
  test('should update webhook', async () => {
    // Get the webhook created in the first test
    const docs = await store.list();
    const webhook = docs[0];

    // Test updating enabled status to false (should reset consecutiveFailures to 0)
    const updated1 = await store.updateWebhook(webhook.id, { enabled: false });
    expect(updated1.params[0].enabled).toBe(false);
    expect(updated1.params[0].consecutiveFailures).toBe(0);

    // Test updating enabled status to true
    const updated2 = await store.updateWebhook(webhook.id, { enabled: true });
    expect(updated2.params[0].enabled).toBe(true);

    // Test updating consecutiveFailures with specific value
    const updated3 = await store.updateWebhook(webhook.id, { consecutiveFailures: 2 });
    expect(updated3.params[0].consecutiveFailures).toBe(2);

    // Test error: cannot update enabled and consecutiveFailures at the same time
    try {
      await store.updateWebhook(webhook.id, { enabled: true, consecutiveFailures: 1 });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toBe('Cannot update enabled and consecutiveFailures at the same time.');
    }

    // Test error: consecutiveFailures must be a non-negative integer (negative number)
    try {
      await store.updateWebhook(webhook.id, { consecutiveFailures: -1 });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toBe('consecutiveFailures must be a non-negative integer.');
    }

    // Test error: consecutiveFailures must be a non-negative integer (float)
    try {
      await store.updateWebhook(webhook.id, { consecutiveFailures: 1.5 });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toBe('consecutiveFailures must be a non-negative integer.');
    }

    // Test error: must provide either enabled or consecutiveFailures to update
    try {
      await store.updateWebhook(webhook.id, {});
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toBe('Must provide either enabled or consecutiveFailures to update.');
    }

    // Test error: consecutiveFailures must be greater than current value or equal to 0
    try {
      await store.updateWebhook(webhook.id, { consecutiveFailures: 1 });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toContain('consecutiveFailures must be greater than the current value');
    }

    // Test error: webhook id not exist
    try {
      await store.updateWebhook('non-existent-id', { enabled: true });
      expect(false).toBe(true);
    } catch (err) {
      expect(err.message).toContain('not exist');
    }
  });
});
