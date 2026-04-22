/* eslint-disable no-console */
import * as constants from '../src/index.js';

describe('constants', () => {
  test('should have required constants', () => {
    expect(constants.NODE_MODES).toBeTruthy();
    expect(constants.ROLES).toBeTruthy();
    expect(constants.RBAC_CONFIG).toBeTruthy();
    expect(constants.NODE_SERVICES).toBeTruthy();
    expect(constants.BLOCKLET_LAUNCHER_URL).toBeTruthy();
    expect(constants.WEB_WALLET_URL).toBeTruthy();
  });

  test('should genPermissionName as expected', () => {
    expect(constants.genPermissionName('user', 'add')).toEqual('add_user');
  });
});
