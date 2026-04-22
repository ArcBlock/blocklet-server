const { test, describe, expect } = require('bun:test');
const { shouldSyncFederated } = require('../../api/util/federated');

describe('Federated Utils', () => {
  describe('shouldSyncFederated', () => {
    test('should work as expected', () => {
      expect(shouldSyncFederated({}, 'sourceAppPid')).toBe(true);
      expect(shouldSyncFederated({ appPid: 'blockletAppPid' }, 'sourceAppPid')).toBe(true);
      expect(shouldSyncFederated({ appPid: 'masterAppPid' }, 'sourceAppPid')).toBe(true);

      expect(
        shouldSyncFederated({
          appPid: 'masterAppPid',
          settings: { federated: { sites: [{ appPid: 'masterAppPid', isMaster: true }] } },
        })
      ).toBe(true);
      expect(
        shouldSyncFederated({
          appPid: 'blockletAppPid',
          settings: { federated: { sites: [{ appPid: 'masterAppPid', isMaster: false }] } },
        })
      ).toBe(false);
      expect(
        shouldSyncFederated({
          appPid: 'blockletAppPid',
          settings: { federated: { sites: [{ appPid: 'blockletAppPid', isMaster: false }] } },
        })
      ).toBe(false);
      expect(shouldSyncFederated({})).toBe(false);
    });
  });
});
