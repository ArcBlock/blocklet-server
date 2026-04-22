const { test, expect, describe, beforeEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { loginSchema } = require('../../lib/validators/user');

describe('user schema', () => {
  let did = '';
  let pk = '';

  beforeEach(() => {
    const wallet = fromRandom();
    did = wallet.address;
    pk = wallet.publicKey;
  });

  test('loginSchema should get error with empty data', () => {
    const { error } = loginSchema.validate({});
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"did" is required');
  });

  test('user schema should get error with error did', () => {
    const { error } = loginSchema.validate({
      did: 'abcde',
      pk,
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('did "abcde" is not valid');
  });

  test('user schema should get error with no connectedAccount', () => {
    const { error } = loginSchema.validate({
      did,
      pk,
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"connectedAccount" is required');
  });

  test('user schema should get error with no error connectedAccount', () => {
    let error;
    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: '',
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"connectedAccount" must be one of [object, array]');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: null,
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"connectedAccount" is required');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: {},
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"connectedAccount.provider" is required');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet' },
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"connectedAccount.did" is required');
  });

  test('user schema should get error with error passport', () => {
    let error;
    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: '',
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"passport" must be of type object');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: [],
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"passport" must be of type object');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: {},
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"passport.id" is required');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: { id: 'pp' },
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"passport.role" is required');

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: { id: 'pp', role: 'admin' },
    }));
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('"passport.name" is required');
  });

  test('user schema should work with minimal data', () => {
    let error;
    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: null,
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      passport: undefined,
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      email: '',
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      email: null,
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: { provider: 'wallet', did },
      email: undefined,
    }));
    expect(error).toBe(undefined);
  });

  // pass case
  test('user schema should work with array connectedAccount', () => {
    let error;
    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: [
        { provider: 'wallet', did },
        { provider: 'auth0', did },
      ],
    }));
    expect(error).toBe(undefined);

    ({ error } = loginSchema.validate({
      did,
      pk,
      connectedAccount: [{ provider: 'wallet', did }, null],
    }));
    expect(error).toBe(undefined);
  });
  test('user schema should work with full data', () => {
    const { error } = loginSchema.validate({
      did,
      pk,
      fullName: 'test',
      avatar: 'https://picsum.photos/100/100',
      email: 'blocklet@arcblock.io',
      role: 'admin',
      locale: 'en',
      extra: {},
      remark: 'from test',
      lastLoginIp: '127.0.0.1',
      passport: { id: 'pp', role: 'admin', name: 'admin' },
      connectedAccount: { provider: 'wallet', did },
    });
    expect(error).toBe(undefined);
  });
});
