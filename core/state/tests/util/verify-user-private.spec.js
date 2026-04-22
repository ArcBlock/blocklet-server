const { test, expect, describe, beforeEach, mock, afterAll } = require('bun:test');
const { SERVER_ROLES } = require('@abtnode/constant');
const { isInDashboard } = require('../../lib/util/verify-user-private');

mock.module('@abtnode/logger', () => {
  const info = mock();
  const error = mock();
  const warn = mock();

  const fn = mock(() => {
    return {
      info,
      error,
      warn,
    };
  });

  return {
    __esModule: true,
    default: fn,
  };
});

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('verify-user-private', () => {
  beforeEach(() => {
    mock.clearAllMocks();
  });

  test('should check if request is in dashboard correctly', () => {
    const teamDid = 'did:team:123';
    const prefix = '/api';
    // SDK,
    const context1 = {
      user: { role: SERVER_ROLES.BLOCKLET_SDK },
      hostname: 'example.com',
      referrer: 'https://example.com/admin/dashboard',
    };
    const result = isInDashboard(teamDid, prefix, context1);
    expect(result).toBe(false);
    // service dashboard
    const context2 = {
      user: { role: 'owner' },
      hostname: 'example.com',
      referrer: 'https://example.com/.well-known/service/admin/dashboard',
    };
    const result2 = isInDashboard(teamDid, prefix, context2);
    expect(result2).toBe(true);

    // server dashboard
    const context3 = {
      user: { role: 'owner' },
      hostname: 'example.com',
      referrer: 'https://example.com/api/blocklets/did:team:123',
    };
    const result3 = isInDashboard(teamDid, prefix, context3);
    expect(result3).toBe(true);

    // 失败用例：缺少 teamDid
    const context4 = {
      user: { role: 'owner' },
      hostname: 'example.com',
      referrer: 'https://example.com/.well-known/service/admin/dashboard',
    };
    const result4 = isInDashboard(null, prefix, context4);
    expect(result4).toBe(false);

    // 失败用例：缺少 hostname
    const context5 = {
      user: { role: 'owner' },
      referrer: 'https://example.com/.well-known/service/admin/dashboard',
    };
    const result5 = isInDashboard(teamDid, prefix, context5);
    expect(result5).toBe(false);

    // 失败用例：缺少 referrer
    const context6 = {
      user: { role: 'owner' },
      hostname: 'example.com',
    };
    const result6 = isInDashboard(teamDid, prefix, context6);
    expect(result6).toBe(false);

    // 失败用例：非仪表板路径
    const context7 = {
      user: { role: 'owner' },
      hostname: 'example.com',
      referrer: 'https://example.com/some/other/path',
    };
    const result7 = isInDashboard(teamDid, prefix, context7);
    expect(result7).toBe(false);
  });
});
