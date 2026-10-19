const { describe, expect, it, afterEach } = require('bun:test');
const { NODE_MODES } = require('@abtnode/constant');

const { isInServerlessMode, isLaunchDisabled } = require('../lib/serverless');

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
