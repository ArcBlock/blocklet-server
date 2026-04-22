const { WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD } = require('@abtnode/constant');
const { updateWebhookFailureState } = require('../../lib/util/webhook');

describe('Webhook Utility Functions', () => {
  describe('updateWebhookFailureState', () => {
    test('should handle enabled status updates', () => {
      const item = { enabled: false, consecutiveFailures: 5 };
      updateWebhookFailureState(item, { enabled: true });
      expect(item.enabled).toBe(true);
      expect(item.consecutiveFailures).toBe(5);

      updateWebhookFailureState(item, { enabled: false });
      expect(item.enabled).toBe(false);
      expect(item.consecutiveFailures).toBe(0); // Auto reset when disabled
    });

    test('should handle consecutiveFailures updates', () => {
      const item = { enabled: true, consecutiveFailures: 5 };

      // Auto increment when not provided
      updateWebhookFailureState(item, {});
      expect(item.consecutiveFailures).toBe(6);

      // Set specific value
      updateWebhookFailureState(item, { consecutiveFailures: 10 });
      expect(item.consecutiveFailures).toBe(10);
    });

    test('should auto-disable and trigger notification when reaching threshold', () => {
      const item = { enabled: true, consecutiveFailures: 0 };
      const mockNotification = jest.fn();

      updateWebhookFailureState(
        item,
        { consecutiveFailures: WEBHOOK_CONSECUTIVE_FAILURES_THRESHOLD },
        mockNotification
      );

      expect(item.enabled).toBe(false);
      expect(item.consecutiveFailures).toBe(0);
      expect(mockNotification).toHaveBeenCalledTimes(1);
    });

    test('should validate consecutiveFailures parameter', () => {
      const item = { enabled: true, consecutiveFailures: 0 };

      expect(() => updateWebhookFailureState(item, { consecutiveFailures: -1 })).toThrow(
        'consecutiveFailures must be a non-negative integer.'
      );
      expect(() => updateWebhookFailureState(item, { consecutiveFailures: 5.5 })).toThrow(
        'consecutiveFailures must be a non-negative integer.'
      );
    });

    test('should validate incremental updates when option enabled', () => {
      const item = { enabled: true, consecutiveFailures: 10 };

      // Should allow reset to 0
      expect(() =>
        updateWebhookFailureState(item, { consecutiveFailures: 0 }, null, { validateIncremental: true })
      ).not.toThrow();

      // Should reject non-incremental values
      item.consecutiveFailures = 10;
      expect(() =>
        updateWebhookFailureState(item, { consecutiveFailures: 5 }, null, { validateIncremental: true })
      ).toThrow('consecutiveFailures must be greater than the current value (10) or equal to 0.');

      // Should allow incremental values
      expect(() =>
        updateWebhookFailureState(item, { consecutiveFailures: 15 }, null, { validateIncremental: true })
      ).not.toThrow();
    });
  });
});
