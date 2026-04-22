const { describe, it, expect, mock, spyOn, afterAll } = require('bun:test');
const {
  isProfileUrlSupported,
  getProfileItems,
  isEmailKycRequired,
  isEmailUniqueRequired,
  isOAuthKycTrusted,
  isPhoneKycRequired,
  isPhoneUniqueRequired,
  isOAuthEmailVerified,
  isProfileClaimRequired,
  getKycClaims,
  isEmailBlocked,
  isEmailAllowed,
  isSameEmail,
  isSamePhone,
} = require('../../api/libs/kyc');
const { api } = require('../../api/libs/api');

mock.module('../../api/libs/api', () => ({
  api: {
    ...api,
    get: mock(),
  },
}));

afterAll(() => {
  mock.restore();
  mock.clearAllMocks();
});

describe('isProfileUrlSupported', () => {
  it('should return false if didWallet is not provided', () => {
    const result = isProfileUrlSupported(null);

    expect(result).toBe(false);
  });

  it('should return true for web os version 4.13.0 and above', () => {
    expect(isProfileUrlSupported({ os: 'web', version: '4.13.0' })).toBe(true);
    expect(isProfileUrlSupported({ os: 'web', version: '4.12.0' })).toBe(false);
  });

  it('should return true for ios os version 5.6.0 and above', () => {
    expect(isProfileUrlSupported({ os: 'ios', version: '5.6.0' })).toBe(true);
    expect(isProfileUrlSupported({ os: 'ios', version: '5.5.0' })).toBe(false);
  });

  it('should return true for android os version 5.6.0 and above', () => {
    expect(isProfileUrlSupported({ os: 'android', version: '5.6.0' })).toBe(true);
    expect(isProfileUrlSupported({ os: 'android', version: '5.5.0' })).toBe(false);
  });

  it('should return false for unsupported os or version', () => {
    const didWallet = { os: 'unknown', version: '1.0.0' };
    const result = isProfileUrlSupported(didWallet);

    expect(result).toBe(false);
  });
});

describe('getProfileItems', () => {
  it('should always include fullName and avatar', () => {
    const result = getProfileItems({}, null);
    expect(result).toContain('fullName');
    expect(result).toContain('avatar');
  });

  it('should include email when enabled in settings', () => {
    const settings = { email: { enabled: true } };
    const result = getProfileItems(settings, null);
    expect(result).toContain('email');
  });

  it('should not include email when disabled in settings', () => {
    const settings = { email: { enabled: false } };
    const result = getProfileItems(settings, null);
    expect(result).not.toContain('email');
  });

  it('should include phone when enabled in settings', () => {
    const settings = { phone: { enabled: true } };
    const result = getProfileItems(settings, null);
    expect(result).toContain('phone');
  });

  it('should not include phone when disabled in settings', () => {
    const settings = { phone: { enabled: false } };
    const result = getProfileItems(settings, null);
    expect(result).not.toContain('phone');
  });

  it('should include url when isProfileUrlSupported returns true', () => {
    const result = getProfileItems({}, { os: 'android', version: '5.6.0' });
    expect(result).toContain('url');
  });

  it('should not include url when isProfileUrlSupported returns false', () => {
    const result = getProfileItems({}, { os: 'android', version: '5.5.0' });
    expect(result).not.toContain('url');
  });

  it('should return unique items', () => {
    const settings = { email: { enabled: true }, phone: { enabled: true } };
    const result = getProfileItems(settings, { os: 'android', version: '5.6.0' });
    expect(result).toEqual(['fullName', 'avatar', 'email', 'phone', 'url']);
    expect(result.length).toBe(5); // Ensure no duplicates
  });
});

describe('KYC functions', () => {
  describe('isEmailKycRequired', () => {
    it('should return true when email is enabled and verified', () => {
      const blocklet = { settings: { session: { email: { enabled: true, requireVerified: true } } } };
      expect(isEmailKycRequired(blocklet)).toBe(true);
    });

    it('should return false when email is not enabled', () => {
      const blocklet = { settings: { session: { email: { enabled: false, requireVerified: true } } } };
      expect(isEmailKycRequired(blocklet)).toBe(false);
    });

    it('should return false when email is enabled but not required to be verified', () => {
      const blocklet = { settings: { session: { email: { enabled: true, requireVerified: false } } } };
      expect(isEmailKycRequired(blocklet)).toBe(false);
    });
  });

  describe('isEmailUniqueRequired', () => {
    it('should return true when email is enabled and unique', () => {
      const blocklet = { settings: { session: { email: { enabled: true, requireUnique: true } } } };
      expect(isEmailUniqueRequired(blocklet)).toBe(true);
    });

    it('should return false when email is not enabled', () => {
      const blocklet = { settings: { session: { email: { enabled: false, requireUnique: true } } } };
      expect(isEmailUniqueRequired(blocklet)).toBe(false);
    });

    it('should return false when email is enabled but not required to be unique', () => {
      const blocklet = { settings: { session: { email: { enabled: true, requireUnique: false } } } };
      expect(isEmailUniqueRequired(blocklet)).toBe(false);
    });
  });

  describe('isOAuthKycTrusted', () => {
    it('should return true when email is enabled and OAuth providers are trusted', () => {
      const blocklet = { settings: { session: { email: { enabled: true, trustOauthProviders: true } } } };
      expect(isOAuthKycTrusted(blocklet)).toBe(true);
    });

    it('should return false when email is not enabled', () => {
      const blocklet = { settings: { session: { email: { enabled: false, trustOauthProviders: true } } } };
      expect(isOAuthKycTrusted(blocklet)).toBe(false);
    });

    it('should return false when email is enabled but OAuth providers are not trusted', () => {
      const blocklet = { settings: { session: { email: { enabled: true, trustOauthProviders: false } } } };
      expect(isOAuthKycTrusted(blocklet)).toBe(false);
    });
  });

  describe('isPhoneKycRequired', () => {
    it('should return true when phone is enabled and verified', () => {
      const blocklet = { settings: { session: { phone: { enabled: true, requireVerified: true } } } };
      expect(isPhoneKycRequired(blocklet)).toBe(true);
    });

    it('should return false when phone is not enabled', () => {
      const blocklet = { settings: { session: { phone: { enabled: false, requireVerified: true } } } };
      expect(isPhoneKycRequired(blocklet)).toBe(false);
    });

    it('should return false when phone is enabled but not required to be verified', () => {
      const blocklet = { settings: { session: { phone: { enabled: true, requireVerified: false } } } };
      expect(isPhoneKycRequired(blocklet)).toBe(false);
    });
  });

  describe('isPhoneUniqueRequired', () => {
    it('should return true when phone is enabled and unique', () => {
      const blocklet = { settings: { session: { phone: { enabled: true, requireUnique: true } } } };
      expect(isPhoneUniqueRequired(blocklet)).toBe(true);
    });

    it('should return false when phone is not enabled', () => {
      const blocklet = { settings: { session: { phone: { enabled: false, requireUnique: true } } } };
      expect(isPhoneUniqueRequired(blocklet)).toBe(false);
    });

    it('should return false when phone is enabled but not required to be unique', () => {
      const blocklet = { settings: { session: { phone: { enabled: true, requireUnique: false } } } };
      expect(isPhoneUniqueRequired(blocklet)).toBe(false);
    });
  });

  describe('isOAuthEmailVerified', () => {
    const blocklet = { settings: { session: { email: { enabled: true, trustOauthProviders: true } } } };

    it('should return true when OAuth KYC is trusted and email is verified', () => {
      expect(isOAuthEmailVerified(blocklet, { email_verified: true })).toBe(true);
    });

    it('should return true when OAuth KYC is trusted and email is verified', () => {
      expect(isOAuthEmailVerified(blocklet, { emailVerified: true })).toBe(true);
    });

    it('should return true when OAuth KYC is trusted and provider is github', () => {
      expect(isOAuthEmailVerified(blocklet, { provider: 'github' })).toBe(true);
    });

    it('should return false when OAuth KYC is trusted but email is not verified and provider is not github', () => {
      expect(isOAuthEmailVerified(blocklet, { email_verified: false, provider: 'google' })).toBe(false);
    });

    it('should return false when OAuth KYC is not trusted', () => {
      const untrustedBlocklet = { settings: { session: { email: { enabled: true, trustOauthProviders: false } } } };
      expect(isOAuthEmailVerified(untrustedBlocklet, { email_verified: true })).toBe(false);
    });
  });

  describe('isProfileClaimRequired', () => {
    const blocklet = {
      settings: {
        session: {
          email: { enabled: true, requireVerified: true },
          phone: { enabled: true, requireVerified: true },
        },
      },
    };

    it('should return true when email KYC is required and user has no email', () => {
      expect(isProfileClaimRequired(blocklet, { phone: '1234567890' })).toBe(true);
    });

    it('should return true when phone KYC is required and user has no phone', () => {
      expect(isProfileClaimRequired(blocklet, { email: 'test@example.com' })).toBe(true);
    });

    it('should return false when both email and phone are provided', () => {
      expect(isProfileClaimRequired(blocklet, { email: 'test@example.com', phone: '1234567890' })).toBe(false);
    });

    it('should return false when neither email nor phone KYC is required', () => {
      const noKycBlocklet = {
        settings: {
          session: {
            email: { enabled: false },
            phone: { enabled: false },
          },
        },
      };
      expect(isProfileClaimRequired(noKycBlocklet, {})).toBe(false);
    });
  });
});

describe('getKycClaims', () => {
  const baseUrl = 'https://example.com';
  const locale = 'en';

  it('should return empty claims when no KYC is required', async () => {
    const user = { emailVerified: true, phoneVerified: true };
    const blocklet = { settings: { session: { email: { enabled: false }, phone: { enabled: false } } } };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl });
    expect(result).toEqual({});
  });

  it('should include email KYC claim when required and not verified', async () => {
    const user = { emailVerified: false };
    const blocklet = { settings: { session: { email: { enabled: true, requireVerified: true } } } };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl, inviter: 'abc' });

    expect(result).toHaveProperty('emailKyc');
    expect(result.emailKyc[0]).toBe('verifiableCredential');
    expect(result.emailKyc[1]).toEqual(
      expect.objectContaining({
        type: 'verifiableCredential',
        item: ['VerifiedEmailCredential'],
        trustedIssuers: [],
        optional: false,
        acquireUrl: `${baseUrl}/.well-known/service/kyc/email?inviter=abc`,
        claimUrl: `${baseUrl}/.well-known/service/lost-passport?role=email&inviter=abc`,
      })
    );
  });

  it('should include phone KYC claim when required and not verified', async () => {
    const user = { phoneVerified: false };
    const blocklet = { settings: { session: { phone: { enabled: true, requireVerified: true } } } };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl });

    expect(result).toHaveProperty('phoneKyc');
    expect(result.phoneKyc[0]).toBe('verifiableCredential');
    expect(result.phoneKyc[1]).toEqual(
      expect.objectContaining({
        type: 'verifiableCredential',
        item: ['VerifiedPhoneCredential'],
        trustedIssuers: [],
        optional: false,
        acquireUrl: `${baseUrl}/.well-known/service/kyc/phone`,
        claimUrl: `${baseUrl}/.well-known/service/lost-passport?role=phone`,
      })
    );
  });

  it('should include both email and phone KYC claims when both are required and not verified', async () => {
    const user = { emailVerified: false, phoneVerified: false };
    const blocklet = {
      settings: {
        session: { email: { enabled: true, requireVerified: true }, phone: { enabled: true, requireVerified: true } },
      },
    };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl });
    expect(result).toHaveProperty('emailKyc');
    expect(result).toHaveProperty('phoneKyc');
  });

  it('should not include email KYC claim when it is verified', async () => {
    const user = { emailVerified: true };
    const blocklet = { settings: { session: { email: { enabled: true, requireVerified: true } } } };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl });
    expect(result).not.toHaveProperty('emailKyc');
  });

  it('should not include phone KYC claim when it is verified', async () => {
    const user = { phoneVerified: true };
    const blocklet = { settings: { session: { phone: { enabled: true, requireVerified: true } } } };
    const result = await getKycClaims({ blocklet, user, locale, baseUrl });
    expect(result).not.toHaveProperty('phoneKyc');
  });
});

describe('EmailDomainChecker', () => {
  const mockBlocklet = {
    settings: {
      session: {
        email: {
          enableDomainBlackList: true,
          domainBlackList: ['https://blacklist.com'],
          enableDomainWhiteList: true,
          domainWhiteList: ['https://whitelist.com'],
        },
      },
    },
  };

  // afterAll(() => {
  //   mock.restore();
  // });

  describe('isEmailBlocked', () => {
    it('should return false if email is not provided', async () => {
      const result = await isEmailBlocked(mockBlocklet);
      expect(result).toBe(false);
    });

    it('should return false if email has no domain', async () => {
      const result = await isEmailBlocked(mockBlocklet, 'invalid-email');
      expect(result).toBe(false);
    });

    it('should return false if enableDomainBlackList is false', async () => {
      const blocklet = { ...mockBlocklet, settings: { session: { email: { enableDomainBlackList: false } } } };
      const result = await isEmailBlocked(blocklet, 'test@example.com');
      expect(result).toBe(false);
    });

    it('should return false if domainBlackList is not an array or empty', async () => {
      const blocklet = {
        ...mockBlocklet,
        settings: { session: { email: { enableDomainBlackList: true, domainBlackList: null } } },
      };
      const result = await isEmailBlocked(blocklet, 'test@example.com');
      expect(result).toBe(false);
    });

    it('should return true if domain is in blacklist', async () => {
      const spy = spyOn(api, 'get');
      spy.mockResolvedValueOnce({ data: 'example.com\nblocked.com' });
      const result = await isEmailBlocked(mockBlocklet, 'test@blocked.com');
      expect(result).toBe(true);
    });

    it('should return true if domain is in blacklist: case insensitive', async () => {
      const spy = spyOn(api, 'get');
      spy.mockResolvedValueOnce({ data: 'example.com\nblocked.com' });
      const result = await isEmailBlocked(mockBlocklet, 'test@BLOCKED.com');
      expect(result).toBe(true);
    });

    it('should return false if domain is not in blacklist', async () => {
      api.get.mockResolvedValueOnce({ data: 'example.com\nblocked.com' });
      const result = await isEmailBlocked(mockBlocklet, 'test@allowed.com');
      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      api.get.mockRejectedValueOnce(new Error('API error'));
      const result = await isEmailBlocked(mockBlocklet, 'test@example.com');
      expect(result).toBe(false);
    });
  });

  describe('isEmailAllowed', () => {
    it('should return false if email is not provided', async () => {
      const result = await isEmailAllowed(mockBlocklet);
      expect(result).toBe(false);
    });

    it('should return false if email has no domain', async () => {
      const result = await isEmailAllowed(mockBlocklet, 'invalid-email');
      expect(result).toBe(false);
    });

    it('should return true if enableDomainWhiteList is false', async () => {
      const blocklet = { ...mockBlocklet, settings: { session: { email: { enableDomainWhiteList: false } } } };
      const result = await isEmailAllowed(blocklet, 'test@example.com');
      expect(result).toBe(true);
    });

    it('should return true if domainWhiteList is not an array or empty', async () => {
      const blocklet = {
        ...mockBlocklet,
        settings: { session: { email: { enableDomainWhiteList: true, domainWhiteList: null } } },
      };
      const result = await isEmailAllowed(blocklet, 'test@example.com');
      expect(result).toBe(true);
    });

    it('should return true if domain is in whitelist', async () => {
      api.get.mockResolvedValueOnce({ data: 'example.com\nallowed.com' });
      const result = await isEmailAllowed(mockBlocklet, 'test@allowed.com');
      expect(result).toBe(true);
    });

    it('should return true if domain is in whitelist: case insensitive', async () => {
      api.get.mockResolvedValueOnce({ data: 'example.com\nallowed.com' });
      const result = await isEmailAllowed(mockBlocklet, 'test@ALLOWED.com');
      expect(result).toBe(true);
    });

    it('should return false if domain is not in whitelist', async () => {
      api.get.mockResolvedValueOnce({ data: 'example.com\nallowed.com' });
      const result = await isEmailAllowed(mockBlocklet, 'test@blocked.com');
      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const spy = spyOn(api, 'get');
      spy.mockRejectedValueOnce(new Error('API error'));
      const result = await isEmailAllowed(mockBlocklet, 'test@example.com');
      expect(result).toBe(false);
    });
  });

  describe('isSameEmail', () => {
    it('should return false if either email is falsy', () => {
      expect(isSameEmail(null, 'test@example.com')).toBe(false);
      expect(isSameEmail('test@example.com', undefined)).toBe(false);
      expect(isSameEmail('', 'test@example.com')).toBe(false);
    });

    it('should return true for case-insensitive matching emails', () => {
      expect(isSameEmail('test@example.com', 'TEST@EXAMPLE.COM')).toBe(true);
      expect(isSameEmail('User.Name@domain.com', 'user.name@DOMAIN.com')).toBe(true);
    });

    it('should return false for different emails', () => {
      expect(isSameEmail('test1@example.com', 'test2@example.com')).toBe(false);
      expect(isSameEmail('user@domain1.com', 'user@domain2.com')).toBe(false);
    });
  });

  describe('isSamePhone', () => {
    it('should return false if either phone number is falsy', () => {
      expect(isSamePhone(null, '1234567890')).toBe(false);
      expect(isSamePhone('1234567890', undefined)).toBe(false);
      expect(isSamePhone('', '1234567890')).toBe(false);
    });

    it('should return true for matching phone numbers ignoring spaces, brackets, and dashes', () => {
      expect(isSamePhone('123 456 7890', '1234567890')).toBe(true);
      expect(isSamePhone('  +1 (123) 456-7890  ', '+11234567890')).toBe(true);
      expect(isSamePhone('(123) 456-7890', '123-456-7890')).toBe(true);
    });

    it('should return false for different phone numbers', () => {
      expect(isSamePhone('1234567890', '9876543210')).toBe(false);
      expect(isSamePhone('+1 123 456 7890', '+1 987 654 3210')).toBe(false);
      expect(isSamePhone('(123) 456-7890', '(123) 456-7891')).toBe(false);
    });
  });
});
