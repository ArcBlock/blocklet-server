const { expect, describe, it } = require('bun:test');
const { getEmailServiceProvider } = require('../lib/email');

describe('getEmailServiceProvider', () => {
  const emailConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: true,
    user: 'test@example.com',
    from: 'test@example.com',
    password: 'password123',
    enabled: true,
  };
  it('should return "service" when valid email config is present', () => {
    const blocklet = {
      settings: {
        notification: {
          email: emailConfig,
        },
      },
    };

    expect(getEmailServiceProvider(blocklet)).toBe('service');
  });

  it('should return "launcher" when launcher properties are present', () => {
    const blocklet = {
      controller: {
        launcherSessionId: 'session123',
        launcherUrl: 'http://launcher.example.com',
        consumedAt: '2024-01-01',
      },
    };

    expect(getEmailServiceProvider(blocklet)).toBe('launcher');
  });

  it('should return empty string when no valid config or launcher is present', () => {
    const blocklet = {
      settings: {
        notification: {
          email: {
            // Invalid/incomplete email config
            host: 'smtp.example.com',
          },
        },
      },
    };

    expect(getEmailServiceProvider(blocklet)).toBe('');
  });

  it('should return empty string when blocklet has no settings', () => {
    const blocklet = {};
    expect(getEmailServiceProvider(blocklet)).toBe('');
  });

  it('should return empty string when launcher properties are incomplete', () => {
    const blocklet = {
      controller: {
        launcherSessionId: 'session123',
        // Missing launcherUrl and consumedAt
      },
    };

    expect(getEmailServiceProvider(blocklet)).toBe('');
  });

  it('should prioritize service over launcher when both are present', () => {
    const blocklet = {
      settings: {
        notification: {
          email: emailConfig,
        },
      },
      controller: {
        launcherSessionId: 'session123',
        launcherUrl: 'http://launcher.example.com',
        consumedAt: '2024-01-01',
      },
    };

    expect(getEmailServiceProvider(blocklet)).toBe('service');
  });
});
