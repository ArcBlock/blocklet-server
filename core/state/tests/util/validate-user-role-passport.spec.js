const { it, expect, describe } = require('bun:test');
const { CustomError } = require('@blocklet/error');
const { validateUserRolePassport } = require('../../lib/util/validate-user-role-passport');

describe('validateUserRolePassport', () => {
  const validPassports = [
    {
      status: 'valid',
      role: 'admin',
      expirationDate: null,
    },
    {
      status: 'valid',
      role: 'user',
      expirationDate: '2024-12-31',
    },
  ];

  describe('input validation', () => {
    it('should throw error when passports is not an array', () => {
      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports: 'not-an-array',
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports: 'not-an-array',
        });
      }).toThrow('Invalid passports: must be an array');
    });

    it('should throw error when role is missing', () => {
      expect(() => {
        validateUserRolePassport({
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow('Invalid role: must be a non-empty string');
    });

    it('should throw error when role is not a string', () => {
      expect(() => {
        validateUserRolePassport({
          role: 123,
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 123,
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow('Invalid role: must be a non-empty string');
    });

    it('should throw error when role is empty string', () => {
      expect(() => {
        validateUserRolePassport({
          role: '',
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: '',
          setRoleName: 'admin',
          passports: validPassports,
        });
      }).toThrow('Invalid role: must be a non-empty string');
    });
  });

  describe('passport validation', () => {
    it('should throw error when no valid passport found for role', () => {
      const passports = [
        { status: 'invalid', role: 'admin' },
        { status: 'valid', role: 'user' },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow('No valid passport found: you don\'t have the required role "admin".');
    });

    it('should throw error when passport status is not valid', () => {
      const passports = [
        { status: 'expired', role: 'admin' },
        { status: 'suspended', role: 'admin' },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow('No valid passport found: you don\'t have the required role "admin".');
    });

    it('should throw error when passport role does not match', () => {
      const passports = [
        { status: 'valid', role: 'user' },
        { status: 'valid', role: 'moderator' },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow('No valid passport found: you don\'t have the required role "admin".');
    });
  });

  describe('setRoleName validation', () => {
    it('should throw error when role equals setRoleName and all passports have expiration date', () => {
      const passports = [
        {
          status: 'valid',
          role: 'admin',
          expirationDate: '2024-12-31',
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow(CustomError);

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow('The passport for role "admin" is only temporary and cannot be used to invite new members.');
    });

    it('should pass when role equals setRoleName and at least one passport has no expiration date', () => {
      const passports = [
        {
          status: 'valid',
          role: 'admin',
          expirationDate: '2024-12-31',
        },
        {
          status: 'valid',
          role: 'admin',
          expirationDate: null,
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).not.toThrow();
    });

    it('should pass when role equals setRoleName and passport has undefined expiration date', () => {
      const passports = [
        {
          status: 'valid',
          role: 'admin',
          expirationDate: undefined,
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).not.toThrow();
    });
  });

  describe('successful validation', () => {
    it('should pass with valid admin passport', () => {
      const passports = [
        {
          status: 'valid',
          role: 'admin',
          expirationDate: null,
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).not.toThrow();
    });

    it('should pass when role is different from setRoleName', () => {
      const passports = [
        {
          status: 'valid',
          role: 'user',
          expirationDate: '2024-12-31',
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'user',
          setRoleName: 'admin',
          passports,
        });
      }).toThrow(CustomError);
    });

    it('should pass with multiple valid passports', () => {
      const passports = [
        {
          status: 'valid',
          role: 'admin',
          expirationDate: null,
        },
        {
          status: 'valid',
          role: 'user',
          expirationDate: '2024-12-31',
        },
        {
          status: 'invalid',
          role: 'admin',
          expirationDate: null,
        },
      ];

      expect(() => {
        validateUserRolePassport({
          role: 'admin',
          setRoleName: 'admin',
          passports,
        });
      }).not.toThrow();
    });
  });
});
