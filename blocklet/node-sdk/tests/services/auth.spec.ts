// @eslint-disable-next
import { describe, test, expect, beforeEach } from 'bun:test';
import { setEnvironment, clearEnvironment } from '../../tools/environment';
// BLOCKLET_APP_SK must be set before module load because getWallet is called at the top level
setEnvironment();
import { AuthService } from '../../src/index'; // eslint-disable-line import/first

process.env.BLOCKLET_LOG_DIR = '/tmp/abtnode/test-log';
describe('AuthService', () => {
  beforeEach(() => {
    setEnvironment();
  });

  test('abtnode api should be undefined', () => {
    const client = new AuthService();
    // @ts-ignore
    expect(typeof client.getNodeInfo).toEqual('undefined');
    // @ts-ignore
    expect(typeof client.getBlocklets).toEqual('undefined');
  });

  test('blocklet auth api should be exist', () => {
    const client = new AuthService();
    expect(typeof client.getUsers).toBe('function');
    expect(typeof client.getUsersCount).toBe('function');
    expect(typeof client.getUsersCountPerRole).toBe('function');
    expect(typeof client.getUser).toBe('function');
    expect(typeof client.getOwner).toBe('function');
    expect(typeof client.getRoles).toBe('function');
    expect(typeof client.getRole).toBe('function');
    expect(typeof client.createRole).toBe('function');
    expect(typeof client.updateRole).toBe('function');
    expect(typeof client.deleteRole).toBe('function');
    expect(typeof client.updateUserApproval).toBe('function');
    expect(typeof client.updateUserTags).toBe('function');
    expect(typeof client.grantPermissionForRole).toBe('function');
    expect(typeof client.revokePermissionFromRole).toBe('function');
    expect(typeof client.updatePermissionsForRole).toBe('function');
    expect(typeof client.hasPermission).toBe('function');
    expect(typeof client.issuePassportToUser).toBe('function');
    expect(typeof client.revokeUserPassport).toBe('function');
    expect(typeof client.enableUserPassport).toBe('function');
    expect(typeof client.removeUserPassport).toBe('function');
    expect(typeof client.getPermissions).toBe('function');
    expect(typeof client.createPermission).toBe('function');
    expect(typeof client.updatePermission).toBe('function');
    expect(typeof client.deletePermission).toBe('function');
    expect(typeof client.getPermissionsByRole).toBe('function');
    expect(typeof client.getBlocklet).toBe('function');
    expect(typeof client.getComponent).toBe('function');
    expect(typeof client.getTrustedDomains).toBe('function');
    expect(typeof client.clearCache).toBe('function');

    expect(typeof client.createTag).toBe('function');
    expect(typeof client.updateTag).toBe('function');
    expect(typeof client.deleteTag).toBe('function');
    expect(typeof client.getTags).toBe('function');
    expect(typeof client.login).toBe('function');
    expect(typeof client.getVault).toBe('function');
  });

  test('should throw error if environment variable is not defined', () => {
    clearEnvironment();
    expect(() => new AuthService()).toThrow();
    process.env.BLOCKLET_APP_ID = 'zNKhBhM6QHJ7NSwPMDG1oXUGCZRuDaPzzyWZ';
    expect(() => new AuthService()).toThrow();
    process.env.BLOCKLET_APP_SK =
      '0x8ed6742900c639fb2e55671342f01bb7be83fb62e7c3e109783501d926a293b9c4a3f8cd5303848fc06e7a3ca69a04adbe3881e6f4577b84df8fc4b51b1b2f70';
    expect(() => new AuthService()).toThrow();
    // should be success
    setEnvironment();
    new AuthService(); // eslint-disable-line
  });
});
