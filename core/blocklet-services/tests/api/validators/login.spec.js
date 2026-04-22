const { LOGIN_PROVIDER } = require('@blocklet/constant');
const { fromRandom } = require('@ocap/wallet');
const { describe, it, expect } = require('bun:test');
const { loginWalletSchema } = require('../../../api/validators/login');

describe('loginWalletSchema', () => {
  const validWallet = fromRandom();

  it('should validate successfully with correct data', () => {
    const data = {
      provider: LOGIN_PROVIDER.WALLET,
      did: validWallet.address,
      pk: validWallet.publicKey,
      email: 'user@example.com',
      fullName: 'Test User',
    };

    expect(
      loginWalletSchema.validate({
        ...data,
      }).error
    ).toBeUndefined();

    expect(
      loginWalletSchema.validate({
        ...data,
        email: null,
      }).error
    ).toBeUndefined();

    expect(
      loginWalletSchema.validate({
        ...data,
        email: undefined,
      }).error
    ).toBeUndefined();

    expect(
      loginWalletSchema.validate({
        ...data,
        email: '',
      }).error
    ).toBeUndefined();
  });

  it('should throw an error if did is missing', () => {
    const data = {
      provider: LOGIN_PROVIDER.WALLET,
      pk: 'public_key_string',
    };

    const { error } = loginWalletSchema.validate(data);

    expect(error).toBeDefined();
    expect(error.message).toContain('"did" is required');
  });

  it('should set default values for optional fields', () => {
    const data = {
      provider: LOGIN_PROVIDER.WALLET,
      did: validWallet.address,
      pk: validWallet.publicKey,
      fullName: 'Test User',
    };

    const result = loginWalletSchema.validate(data);

    expect(result.value.avatar).toBe('');
    expect(result.value.email).toBe('');
  });

  it('should allow email to be null or empty', () => {
    const data = {
      provider: LOGIN_PROVIDER.WALLET,
      did: validWallet.address,
      pk: validWallet.publicKey,
      email: '',
      fullName: 'Test User',
    };

    const { error } = loginWalletSchema.validate(data);

    expect(error).toBeUndefined();
  });

  it('should throw an error if provider is invalid', () => {
    const data = {
      provider: 'INVALID_PROVIDER',
      did: validWallet.address,
      pk: validWallet.publicKey,
    };

    const { error } = loginWalletSchema.validate(data);

    expect(error).toBeDefined();
    expect(error.message).toContain('"provider" must be [wallet]');
  });
});
