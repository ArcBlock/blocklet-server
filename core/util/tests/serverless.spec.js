const { describe, expect, it, afterEach } = require('bun:test');
const { NODE_MODES } = require('@abtnode/constant');

const { isInServerlessMode, isLaunchDisabled, isTrustedLauncherUrl } = require('../lib/serverless');

describe('serverless', () => {
  it('should return true when the node is in serverless mode', () => {
    expect(isInServerlessMode({ mode: NODE_MODES.SERVERLESS, previousMode: NODE_MODES.DEBUG })).toBe(true);
    expect(isInServerlessMode({ mode: NODE_MODES.MAINTENANCE, previousMode: NODE_MODES.SERVERLESS })).toBe(true);
  });

  it('should return false when the node is not in serverless mode', () => {
    expect(isInServerlessMode({ mode: NODE_MODES.PRODUCTION, previousMode: NODE_MODES.MAINTENANCE })).toBe(false);
    expect(isInServerlessMode({ mode: NODE_MODES.DEBUG, previousMode: NODE_MODES.MAINTENANCE })).toBe(false);
    expect(isInServerlessMode({ mode: NODE_MODES.MAINTENANCE, previousMode: NODE_MODES.PRODUCTION })).toBe(false);
  });

  it('should return false when params are empty', () => {
    expect(isInServerlessMode()).toBe(false);
    expect(isInServerlessMode({})).toBe(false);
  });
});

describe('isLaunchDisabled', () => {
  afterEach(() => {
    delete process.env.ABT_NODE_DISABLE_LAUNCH;
  });

  it('should be disabled only when env is true', () => {
    expect(isLaunchDisabled()).toBe(false);
    process.env.ABT_NODE_DISABLE_LAUNCH = 'false';
    expect(isLaunchDisabled()).toBe(false);
    process.env.ABT_NODE_DISABLE_LAUNCH = 'true';
    expect(isLaunchDisabled()).toBe(true);
  });
});

describe('isTrustedLauncherUrl', () => {
  const info = { launcher: { url: 'https://launcher.arcblock.io/' }, registerUrl: 'https://launcher.arcblock.io/' };

  it('should accept urls on the registered launcher origin', () => {
    expect(isTrustedLauncherUrl(info, 'https://launcher.arcblock.io/app')).toBe(true);
    expect(isTrustedLauncherUrl(info, 'https://launcher.arcblock.io/app/api/launches/x')).toBe(true);
    expect(
      isTrustedLauncherUrl({ registerUrl: 'https://launcher.arcblock.io' }, 'https://launcher.arcblock.io/app')
    ).toBe(true);
  });

  it('should reject attacker controlled or look-alike launchers', () => {
    expect(isTrustedLauncherUrl(info, 'http://203.0.113.42:18503')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'https://www.arcblock.io/launch')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'https://launcher.arcblock.io.evil.com/app')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'http://launcher.arcblock.io/app')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'https://launcher.arcblock.io:8443/app')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'https://user@203.0.113.42/launcher.arcblock.io')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'file:///etc/passwd')).toBe(false);
    expect(isTrustedLauncherUrl(info, 'not a url')).toBe(false);
    expect(isTrustedLauncherUrl(info, '')).toBe(false);
  });

  it('should reject everything when the node has no launcher configured', () => {
    expect(isTrustedLauncherUrl({}, 'https://launcher.arcblock.io/app')).toBe(false);
    expect(isTrustedLauncherUrl(undefined, 'https://launcher.arcblock.io/app')).toBe(false);
  });

  it('should allow a local launcher in development mode', () => {
    expect(isTrustedLauncherUrl({ launcher: { mode: 'development' } }, 'http://127.0.0.1:3030/app')).toBe(true);
  });
});
