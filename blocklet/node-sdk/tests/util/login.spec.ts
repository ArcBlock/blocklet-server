import { describe, it, expect } from 'bun:test';
import { encodeKycStatus, decodeKycStatus } from '../../src/util/login';

describe('KYC Status Encoding and Decoding', () => {
  describe('encodeKycStatus', () => {
    it('should return 0 when both email and phone are not verified', () => {
      expect(encodeKycStatus(false, false)).toBe(0);
    });

    it('should return 1 when only email is verified', () => {
      expect(encodeKycStatus(true, false)).toBe(1);
    });

    it('should return 2 when only phone is verified', () => {
      expect(encodeKycStatus(false, true)).toBe(2);
    });

    it('should return 3 when both email and phone are verified', () => {
      expect(encodeKycStatus(true, true)).toBe(3);
    });
  });

  describe('decodeKycStatus', () => {
    it('should return both false when status is 0', () => {
      expect(decodeKycStatus(0)).toEqual({ emailVerified: false, phoneVerified: false });
    });

    it('should return only email verified when status is 1', () => {
      expect(decodeKycStatus(1)).toEqual({ emailVerified: true, phoneVerified: false });
    });

    it('should return only phone verified when status is 2', () => {
      expect(decodeKycStatus(2)).toEqual({ emailVerified: false, phoneVerified: true });
    });

    it('should return both true when status is 3', () => {
      expect(decodeKycStatus(3)).toEqual({ emailVerified: true, phoneVerified: true });
    });
  });
});
