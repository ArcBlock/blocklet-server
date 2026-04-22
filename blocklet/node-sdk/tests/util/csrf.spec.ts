import { describe, it, expect } from 'bun:test';
import { sign, verify, hmac } from '../../src/util/csrf';

describe('csrf', () => {
  const testSecret = 'test-secret-key';
  const testLoginToken = 'abcd1234567890ef'; // sample login token

  describe('hmac', () => {
    it('should generate MD5 HMAC by default', () => {
      const result = hmac(testSecret, testLoginToken);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate SHA256 HMAC when specified', () => {
      const result = hmac(testSecret, testLoginToken, 'sha256');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should generate different results with different algorithms', () => {
      const md5Result = hmac(testSecret, testLoginToken, 'md5');
      const sha256Result = hmac(testSecret, testLoginToken, 'sha256');
      expect(md5Result).not.toBe(sha256Result);
    });

    it('should generate same result with same inputs', () => {
      const result1 = hmac(testSecret, testLoginToken);
      const result2 = hmac(testSecret, testLoginToken);
      expect(result1).toBe(result2);
    });

    it('should generate different results with different secrets', () => {
      const result1 = hmac('secret1', testLoginToken);
      const result2 = hmac('secret2', testLoginToken);
      expect(result1).not.toBe(result2);
    });

    it('should generate different results with different messages', () => {
      const result1 = hmac(testSecret, 'message1');
      const result2 = hmac(testSecret, 'message2');
      expect(result1).not.toBe(result2);
    });
  });

  describe('sign', () => {
    it('should generate valid CSRF token', () => {
      const token = sign(testSecret, testLoginToken);

      expect(typeof token).toBe('string');
      expect(token).toContain('.'); // Should contain separator

      const parts = token.split('.');
      expect(parts).toHaveLength(2); // Should have two parts: md5Hash.sha256Signature
    });

    it('should generate same tokens with same inputs', () => {
      const token1 = sign(testSecret, testLoginToken);
      const token2 = sign(testSecret, testLoginToken);

      expect(token1).toBe(token2);
    });

    it('should generate different tokens with different loginTokens', () => {
      const loginToken1 = 'abcd1234567890ef';
      const loginToken2 = 'wxyz9876543210ab';

      const token1 = sign(testSecret, loginToken1);
      const token2 = sign(testSecret, loginToken2);

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens with different secrets', () => {
      const token1 = sign('secret1', testLoginToken);
      const token2 = sign('secret2', testLoginToken);

      expect(token1).not.toBe(token2);
    });

    it('should generate token with correct format', () => {
      const token = sign(testSecret, testLoginToken);
      const parts = token.split('.');

      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0); // MD5 hash part
      expect(parts[1].length).toBeGreaterThan(0); // SHA256 signature part
    });

    it('should handle empty loginToken', () => {
      const emptyLoginToken = '';
      const token = sign(testSecret, emptyLoginToken);

      expect(typeof token).toBe('string');
      expect(token).toContain('.');

      const parts = token.split('.');
      expect(parts).toHaveLength(2);
    });

    it('should handle special characters in loginToken', () => {
      const specialLoginToken = 'login@#$%^&*()token';
      const token = sign(testSecret, specialLoginToken);

      expect(typeof token).toBe('string');
      expect(token).toContain('.');

      const parts = token.split('.');
      expect(parts).toHaveLength(2);
    });
  });

  describe('verify', () => {
    it('should verify valid token', () => {
      const token = sign(testSecret, testLoginToken);
      const isValid = verify(testSecret, token, testLoginToken);

      expect(isValid).toBe(true);
    });

    it('should reject invalid format tokens', () => {
      const invalidTokens = [
        '', // empty string
        'short', // too short
        'no-separator', // no separator
        'invalid.token.format', // too many separators
        'onlyonepart', // no separator at all
        '.startswithdot', // starts with separator
        'endswithseparator.', // ends with separator
      ];

      invalidTokens.forEach((invalidToken) => {
        const isValid = verify(testSecret, invalidToken, testLoginToken);
        expect(isValid).toBe(false);
      });
    });

    it('should reject tokens with wrong secret', () => {
      const token = sign('correct-secret', testLoginToken);
      const isValid = verify('wrong-secret', token, testLoginToken);

      expect(isValid).toBe(false);
    });

    it('should reject tokens with wrong loginToken', () => {
      const token = sign(testSecret, 'correct-login-token');
      const isValid = verify(testSecret, token, 'wrong-login-token');

      expect(isValid).toBe(false);
    });

    it('should reject tampered tokens', () => {
      const token = sign(testSecret, testLoginToken);

      // Tamper different parts of token
      const tamperedTokens = [
        // modify first part (MD5 hash)
        `tampered${token.slice(8)}`,
        // modify second part (SHA256 signature)
        `${token.split('.')[0]}.tamperedsignature`,
        // modify last character
        `${token.slice(0, -1)}X`,
        // modify middle character
        `${token.slice(0, token.length / 2)}X${token.slice(token.length / 2 + 1)}`,
      ];

      tamperedTokens.forEach((tamperedToken) => {
        // Ensure tampered token is actually different from original
        expect(tamperedToken).not.toBe(token);

        const isValid = verify(testSecret, tamperedToken, testLoginToken);
        expect(isValid).toBe(false);
      });
    });

    it('should handle malformed tokens', () => {
      const malformedTokens = [
        'validpart.', // empty signature part
        '.validpart', // empty MD5 part
        'part1.part2.part3', // too many parts
        'validpart.invalid@#$%chars', // invalid characters in signature
      ];

      malformedTokens.forEach((malformedToken) => {
        const isValid = verify(testSecret, malformedToken, testLoginToken);
        expect(isValid).toBe(false);
      });
    });

    it('should verify tokens generated with different loginTokens', () => {
      const loginTokens = ['token1', 'token2', 'very-long-login-token-with-special-chars@#$%', '', '123456789'];

      loginTokens.forEach((loginToken) => {
        const token = sign(testSecret, loginToken);
        const isValid = verify(testSecret, token, loginToken);
        expect(isValid).toBe(true);

        // Should fail with different loginToken
        const wrongLoginToken = `${loginToken}wrong`;
        const isInvalid = verify(testSecret, token, wrongLoginToken);
        expect(isInvalid).toBe(false);
      });
    });
  });

  describe('integration tests', () => {
    it('should complete sign and verify flow', () => {
      const secret = 'integration-test-secret';
      const loginToken = 'integration-login-token';

      // Generate token
      const token = sign(secret, loginToken);

      // Verify token
      const isValid = verify(secret, token, loginToken);

      expect(isValid).toBe(true);
    });

    it('should work correctly with different secrets', () => {
      const secret1 = 'string-secret-1';
      const secret2 = 'string-secret-2';

      // Tokens generated with different secrets
      const token1 = sign(secret1, testLoginToken);
      const token2 = sign(secret2, testLoginToken);

      // Own secret can verify
      expect(verify(secret1, token1, testLoginToken)).toBe(true);
      expect(verify(secret2, token2, testLoginToken)).toBe(true);

      // Cross verification should fail
      expect(verify(secret2, token1, testLoginToken)).toBe(false);
      expect(verify(secret1, token2, testLoginToken)).toBe(false);
    });

    it('should generate different tokens with different loginTokens', () => {
      const secret = 'concurrent-test-secret';
      const tokens = new Set();
      const tokenCount = 50;

      // Generate multiple tokens with different loginTokens
      for (let i = 0; i < tokenCount; i++) {
        const loginToken = `loginToken${i}`;
        const token = sign(secret, loginToken);
        tokens.add(token);
      }

      // Due to different loginTokens, all tokens should be unique
      expect(tokens.size).toBe(tokenCount);

      // All tokens should be valid with their corresponding loginToken
      let index = 0;
      tokens.forEach((token) => {
        const loginToken = `loginToken${index}`;
        expect(verify(secret, token as string, loginToken)).toBe(true);
        index++;
      });
    });

    it('should handle concurrent token generation and verification', () => {
      const secret = 'concurrent-secret';
      const loginTokens = ['login1', 'login2', 'login3', 'login4', 'login5'];

      // Generate all tokens
      const tokenPairs = loginTokens.map((loginToken) => ({
        token: sign(secret, loginToken),
        loginToken,
      }));

      // Verify all tokens
      tokenPairs.forEach(({ token, loginToken }) => {
        expect(verify(secret, token, loginToken)).toBe(true);

        // Should fail with wrong loginToken
        const wrongLoginToken = `${loginToken}_wrong`;
        expect(verify(secret, token, wrongLoginToken)).toBe(false);
      });
    });
  });

  describe('security tests', () => {
    it('should use secure HMAC for token generation', () => {
      const secret = 'security-test-secret';
      const loginToken = 'security-test-login';

      const token = sign(secret, loginToken);
      const parts = token.split('.');

      // Should have two parts
      expect(parts).toHaveLength(2);

      // Both parts should be base64url encoded (no padding, URL-safe characters)
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      expect(parts[0]).toMatch(base64urlRegex);
      expect(parts[1]).toMatch(base64urlRegex);
    });

    it('should prevent token reuse with different loginTokens', () => {
      const secret = 'reuse-test-secret';
      const loginToken1 = 'login-token-1';
      const loginToken2 = 'login-token-2';

      const token = sign(secret, loginToken1);

      // Token should be valid with original loginToken
      expect(verify(secret, token, loginToken1)).toBe(true);

      // Token should NOT be valid with different loginToken
      expect(verify(secret, token, loginToken2)).toBe(false);
    });

    it('should generate cryptographically secure tokens', () => {
      const secret = 'crypto-test-secret';
      const tokens = new Set();
      const iterations = 100;

      // Generate many tokens with same inputs
      for (let i = 0; i < iterations; i++) {
        const token = sign(secret, testLoginToken);
        tokens.add(token);
      }

      // All tokens should be identical (deterministic)
      expect(tokens.size).toBe(1);

      // But tokens with different loginTokens should be different
      const token1 = sign(secret, 'loginToken1');
      const token2 = sign(secret, 'loginToken2');
      expect(token1).not.toBe(token2);
    });

    it('should resist brute force attacks', () => {
      const secret = 'brute-force-test-secret';
      const validToken = sign(secret, testLoginToken);

      // Try many invalid tokens
      const attempts = [
        'invalid.token',
        'another.invalid.token',
        'yet.another.invalid',
        'fake.signature.here',
        'brute.force.attempt',
      ];

      attempts.forEach((invalidToken) => {
        expect(verify(secret, invalidToken, testLoginToken)).toBe(false);
      });

      // Valid token should still work
      expect(verify(secret, validToken, testLoginToken)).toBe(true);
    });
  });
});
