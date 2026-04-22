const { test, describe, expect } = require('bun:test');

// Directly require the module under test. The module's top-level requires
// are internal to the monorepo and safe to load for testing pure helpers.
const federated = require('../../lib/util/federated');

describe('federated util - pure functions', () => {
  test('isMaster returns true when isMaster not false', () => {
    expect(
      federated.isMaster({
        // undefined should work
        // isMaster: undefined
      })
    ).toBe(true);
    expect(federated.isMaster({ isMaster: true })).toBe(true);
    expect(federated.isMaster({ isMaster: false })).toBe(false);
  });

  test('getUserAvatarUrl with prefixed avatar builds well-known URL', () => {
    const blocklet = { environmentObj: { BLOCKLET_APP_URL: 'https://example.com' } };
    // real constant prefix used in repo is 'bn://avatar'
    const avatar = 'bn://avatar/123.png';
    const result = federated.getUserAvatarUrl(avatar, blocklet);
    expect(result).toBe('https://example.com/.well-known/service/user/avatar/123.png');
  });

  test('getUserAvatarUrl returns original when not prefixed', () => {
    const blocklet = { environmentObj: { BLOCKLET_APP_URL: 'https://example.com' } };
    const avatar = 'https://cdn.com/1.png';
    expect(federated.getUserAvatarUrl(avatar, blocklet)).toBe(avatar);
  });

  test('safeGetFederated returns defaults and respects isMaster flag', () => {
    const blocklet = { appDid: 'did:app', appPid: 'pid', settings: {} };
    const resDefault = federated.safeGetFederated(blocklet);
    expect(resDefault.config.appId).toBe('did:app');
    expect(resDefault.config.appPid).toBe('pid');
    expect(resDefault.sites).toBeDefined();

    const resMasterFalse = federated.safeGetFederated(blocklet, { isMaster: false });
    // safeGetFederated sets config.isMaster when passed isMaster:false
    expect(resMasterFalse.config.isMaster).toBe(false);
  });

  test('getFederatedMaster, getFederatedMembers, findFederatedSite, shouldSyncFederated, getFederatedEnabled behaviors', () => {
    const blocklet = {
      appDid: 'did:app',
      appPid: 'pid-owner',
      settings: {
        federated: {
          sites: [
            { appPid: 'master', isMaster: true, appUrl: 'https://master' },
            { appPid: 'pid-owner', isMaster: false, status: 'approved', appUrl: 'https://me' },
            { appPid: 'other', isMaster: false, status: 'revoked', appUrl: 'https://other' },
          ],
        },
      },
    };

    const master = federated.getFederatedMaster(blocklet);
    expect(master.appPid).toBe('master');

    const membersApproved = federated.getFederatedMembers(blocklet, 'approved');
    expect(membersApproved.length).toBe(1);
    expect(membersApproved[0].appPid).toBe('pid-owner');

    const membersAll = federated.getFederatedMembers(blocklet, null);
    expect(membersAll.length).toBe(2);

    const found = federated.findFederatedSite(blocklet, 'other');
    expect(found.appPid).toBe('other');

    // shouldSyncFederated: true if sourceAppPid provided
    expect(federated.shouldSyncFederated(blocklet, 'sourceAppPid')).toBe(true);
    // shouldSyncFederated: true if current is master
    const masterBlocklet = Object.assign({}, blocklet, { appPid: 'master' });
    expect(federated.shouldSyncFederated(masterBlocklet)).toBe(true);

    // getFederatedEnabled: false if master missing
    const disabled = federated.getFederatedEnabled({ settings: {} });
    expect(disabled).toBe(false);

    // getFederatedEnabled: false if master.appPid === blocklet.appPid
    const notEnabled = federated.getFederatedEnabled(masterBlocklet);
    expect(notEnabled).toBe(false);

    // getFederatedEnabled: true when member approved and master different
    const enabled = federated.getFederatedEnabled(blocklet);
    expect(enabled).toBe(true);
  });
});
