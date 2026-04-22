const { test, expect, describe } = require('bun:test');
const omit = require('lodash/omit');
const { fromRandom } = require('@ocap/wallet');
const { WELLKNOWN_SERVICE_PATH_PREFIX, PASSPORT_STATUS } = require('@abtnode/constant');
const {
  validatePassport,
  createPassport,
  createPassportVC,
  createKycVC,
  validateKyc,
  isUserPassportRevoked,
  upsertToPassports,
  getRoleFromLocalPassport,
  getRoleFromExternalPassport,
  createUserPassport,
  getPassportClaimUrl,
  getLastUsedPassport,
  SPEC_VERSION,
} = require('../lib/passport');

const createPassportSvg = require('../lib/util/create-passport-svg');

describe('validatePassport', () => {
  test('should work as expected', async () => {
    validatePassport();
    validatePassport({ name: 'owner' });
    validatePassport({ name: 'owner', title: 'Owner' });
    validatePassport({ name: 'owner', title: 'Owner', specVersion: SPEC_VERSION });
    await expect(() => validatePassport({})).toThrow();
    await expect(() => validatePassport({ name: '' })).toThrow('"name" is not allowed to be empty');
    await expect(() => validatePassport({ name: 'owner', specVersion: 1 })).toThrow(); // specVersion should be string
    await expect(() => validatePassport({ name: 'owner', unknownProperty: 'x' })).toThrow();
  });
});

describe('createPassport', () => {
  const node = {
    getRoles({ teamDid }) {
      return teamDid === 'did1' ? [{ name: 'owner', title: 'Owner' }] : [];
    },
  };
  test('should work as expected success', async () => {
    const result = await createPassport({ name: 'owner', node, teamDid: 'did1' });
    expect(result.passport).toEqual({ name: 'owner', title: 'Owner', specVersion: SPEC_VERSION });

    await expect(createPassport({ name: 'owner', node, teamDid: 'did2' })).rejects.toBeTruthy();

    const result2 = await createPassport({ name: 'owner', node, teamDid: 'did1', endpoint: 'http://a.io' });
    expect(result2.passport).toEqual({
      name: 'owner',
      title: 'Owner',
      specVersion: SPEC_VERSION,
      endpoint: 'http://a.io',
    });

    await expect(
      createPassport({ name: 'owner', node, teamDid: 'did2', endpoint: 'not an uri string' })
    ).rejects.toBeTruthy();
  });
});

describe('createPassport with not validate', () => {
  test('should work as expected success', async () => {
    const role = { name: 'owner', title: 'Owner' };
    const result = await createPassport({ role });
    expect(result.passport).toEqual({ name: 'owner', title: 'Owner', specVersion: SPEC_VERSION });
  });
});

describe('createPassportSvg', () => {
  test('should work as expected', () => {
    expect(() =>
      createPassportSvg({
        issuer: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        title: 'Owner',
        issuerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        ownerName: 'Owner',
        ownerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        preferredColor: 'default',
        ownerAvatarUrl: '',
        revoked: false,
        isDataUrl: false,
      })
    ).not.toThrow();

    expect(() =>
      createPassportSvg({
        issuer: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        title: 'Title cannot sfjksdfjksdfjskfjdskfjsdkfjskdfjds',
        issuerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        ownerName: 'Owner',
        ownerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        preferredColor: 'auto',
        ownerAvatarUrl: '',
        revoked: false,
        isDataUrl: false,
      })
    ).not.toThrow();

    expect(() =>
      createPassportSvg({
        issuer: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        title: 'Title',
        issuerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        ownerName: 'Owner',
        ownerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        preferredColor: '',
        ownerAvatarUrl: '',
        revoked: true,
        isDataUrl: false,
      })
    ).not.toThrow();

    expect(() =>
      createPassportSvg({
        issuer: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        title: 'Title',
        issuerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        ownerName: 'Owner',
        ownerDid: 'z3Ct5wGWyd8sMVu6y5JgGJbqrPt8JrNDQ5cXh',
        preferredColor: '#ffa000',
        ownerAvatarUrl: '',
        revoked: true,
        isDataUrl: true,
      })
    ).not.toThrow();

    expect(() =>
      createPassportSvg({
        issuer: '0x8414baBe09146A1f26cFA4daE66Fa24f7634abc2',
        title: 'Title',
        issuerDid: '0x8414baBe09146A1f26cFA4daE66Fa24f7634abc2',
        ownerName: 'Owner',
        ownerDid: '0x44A1D248c831F8D038F3Be099560E4C93BF30F14',
        preferredColor: '#ffa000',
        ownerAvatarUrl: '',
        revoked: true,
        isDataUrl: true,
      })
    ).not.toThrow();
  });

  test('should not throw error if missing params', () => {
    expect(() => createPassportSvg({})).toThrow(/Failed to parse DID/);
  });
});

describe('createPassportVC', () => {
  test('should work as expected', async () => {
    const issuerWallet = fromRandom();
    const ownerWallet = fromRandom();

    const vc = await createPassportVC({
      issuerWallet,
      issuerName: 'ABT Node',
      ownerDid: ownerWallet.address,
      passport: {
        name: 'owner',
        title: 'Owner',
      },
    });
    expect(vc.issuer.id).toBe(issuerWallet.address);
    expect(vc.issuer.name).toBe('ABT Node');
    expect(vc.credentialSubject.id).toBe(ownerWallet.address);
    expect(vc.credentialSubject.passport).toEqual({ name: 'owner', title: 'Owner' });
    expect(vc.credentialSubject.display).toBeTruthy();

    await expect(
      createPassportVC({
        issuerWallet,
        issuerName: 'ABT Node',
        ownerDid: ownerWallet.address,
        passport: {
          name: '', // name should not be empty
          title: 'Owner',
        },
      })
    ).rejects.toThrow(/not allowed to be empty/);
  });
});

describe('upsertToPassports', () => {
  test('should work as expected', () => {
    expect(upsertToPassports(null, null)).toEqual([]);
    expect(upsertToPassports([], null)).toEqual([]);

    const l1 = upsertToPassports([], { id: '1', name: 'a', title: 'A' });
    expect(l1).toEqual([{ id: '1', name: 'a', title: 'A' }]);

    const l2 = upsertToPassports(l1, { id: '2', name: 'b', title: 'B' });
    expect(l2).toEqual([
      { id: '1', name: 'a', title: 'A' },
      { id: '2', name: 'b', title: 'B' },
    ]);

    const l3 = upsertToPassports(l2, { id: '1', name: 'a', title: 'A+' });
    expect(l3).toEqual([
      { id: '1', name: 'a', title: 'A+' },
      { id: '2', name: 'b', title: 'B' },
    ]);
  });
});

describe('isUserPassportRevoked', () => {
  test('should work as expected', () => {
    const user1 = {};
    const user2 = {
      passports: [
        { id: '1', status: 'valid' },
        { id: '2', status: 'revoked' },
      ],
    };

    expect(isUserPassportRevoked(user1, { id: '1' })).toBeFalsy();
    expect(isUserPassportRevoked(user2, { id: '1' })).toBeFalsy();
    expect(isUserPassportRevoked(user2, { id: '2' })).toBeTruthy();
    expect(isUserPassportRevoked(user2, { id: '3' })).toBeFalsy();
  });
});

describe('getRoleFromLocalPassport', () => {
  test('should work as expected', () => {
    const passport = { name: 'admin', title: 'Admin' };

    expect(getRoleFromLocalPassport(passport)).toBe('admin');
  });
});

describe('getRoleFromExternalPassport', () => {
  test('should work as expected', async () => {
    const node = {
      getRoles: () => [{ name: 'guest' }, { name: 'member' }, { name: 'admin' }, { name: 'owner' }, { name: 'custom' }],
    };

    // local passport
    await expect(getRoleFromExternalPassport({ passport: { name: 'admin' }, node })).resolves.toBe('admin');
    await expect(getRoleFromExternalPassport({ passport: { name: 'guest' }, node })).resolves.toBe('guest');
    await expect(getRoleFromExternalPassport({ passport: { name: 'owner' }, node })).resolves.toBe('admin');
    await expect(getRoleFromExternalPassport({ passport: { name: 'custom' }, node })).resolves.toBe('custom');
    await expect(getRoleFromExternalPassport({ passport: { name: 'not-found' }, node })).resolves.toBe('guest');

    // external passport
    await expect(
      getRoleFromExternalPassport({
        passport: { name: 'admin', title: 'Admin' },
        node,
        mappings: [{ from: { passport: 'admin' }, to: { role: 'member' } }],
      })
    ).resolves.toBe('member');

    await expect(
      getRoleFromExternalPassport({
        passport: { name: 'admin', title: 'Admin' },
        node,
        mappings: [{ from: { passport: 'Admin' }, to: { role: 'member' } }],
      })
    ).resolves.toBe('member');

    await expect(
      getRoleFromExternalPassport({
        passport: { name: 'admin', title: 'Admin' },
        node,
        mappings: [{ from: { passport: 'no-exist' }, to: { role: 'member' } }],
      })
    ).rejects.toBeTruthy();
  });
});

describe('createUserPassport', () => {
  test('should work as expected', () => {
    const meta = {
      id: 'mockId',
      type: ['a', 'b'],
      issuer: {
        name: 'a',
        pk: 'xx',
        id: 'xx',
      },
      issuanceDate: 1,
      expirationDate: 2,
    };

    const passport = {
      name: 'a',
      title: 'a',
    };

    const vc = {
      ...meta,
      '@context': 'xx',
      credentialSubject: {
        passport,
      },
      credentialStatus: {},
      proof: {},
    };

    const expected = {
      ...meta,
      ...passport,
      role: 'guest',
      scope: 'passport',
      source: 'issue',
    };

    expect(createUserPassport(vc)).toEqual({ ...expected, status: 'valid' });
    expect(createUserPassport(vc, { status: 'valid' })).toEqual({ ...expected, status: 'valid', role: 'guest' });
    expect(createUserPassport(vc, { status: 'revoked', role: 'admin' })).toEqual({
      ...expected,
      status: 'revoked',
      role: 'admin',
    });
  });
});

describe('getPassportClaimUrl', () => {
  test('should work as expected', () => {
    expect(getPassportClaimUrl('https://www.arcblock.io')).toEqual(
      `https://www.arcblock.io${WELLKNOWN_SERVICE_PATH_PREFIX}/lost-passport`
    );
    expect(getPassportClaimUrl('https://www.arcblock.io', '/admin')).toEqual(
      `https://www.arcblock.io/admin${WELLKNOWN_SERVICE_PATH_PREFIX}/lost-passport`
    );
    expect(getPassportClaimUrl('https://www.arcblock.io', '')).toEqual(
      `https://www.arcblock.io${WELLKNOWN_SERVICE_PATH_PREFIX}/lost-passport`
    );
    expect(getPassportClaimUrl()).toEqual('');
    expect(getPassportClaimUrl(null)).toEqual('');
    expect(getPassportClaimUrl(undefined)).toEqual('');
  });
});

describe('createKycVC', () => {
  test('should work as expected', async () => {
    const issuerWallet = fromRandom();
    const ownerWallet = fromRandom();

    const kyc = {
      scope: 'email',
      subject: 'test@arcblock.io',
      digest: 'xx',
      specVersion: '1.0.0',
    };

    const vc = await createKycVC({
      issuerWallet,
      issuerName: 'ABT Node',
      ownerDid: ownerWallet.address,
      kyc,
    });
    expect(vc.issuer.id).toBe(issuerWallet.address);
    expect(vc.issuer.name).toBe('ABT Node');
    expect(vc.credentialSubject.id).toBe(ownerWallet.address);
    expect(vc.credentialSubject.kyc).toEqual(kyc);
    expect(vc.credentialSubject.display).toBeTruthy();

    await expect(
      createKycVC({
        issuerWallet,
        issuerName: 'ABT Node',
        ownerDid: ownerWallet.address,
        kyc: omit(kyc, 'subject'),
      })
    ).rejects.toThrow(/is required/);
  });
});

describe('validateKyc', () => {
  test('should work as expected for valid email', () => {
    expect(
      validateKyc({
        scope: 'email',
        subject: 'test@arcblock.io',
        digest: 'xx',
        specVersion: '1.0.0',
      })
    ).toBeTruthy();
  });

  test('should work as expected for valid phone', () => {
    expect(
      validateKyc({
        scope: 'phone',
        subject: '+1234567890',
        digest: 'xx',
        specVersion: '1.0.0',
      })
    ).toBeTruthy();
  });

  test('should throw for invalid email', () => {
    expect(() =>
      validateKyc({
        scope: 'email',
        subject: 'invalid-email',
        digest: 'xx',
        specVersion: '1.0.0',
      })
    ).toThrow();
  });

  test('should throw for invalid phone', () => {
    expect(() =>
      validateKyc({
        scope: 'phone',
        subject: 'not-a-phone',
        digest: 'xx',
        specVersion: '1.0.0',
      })
    ).toThrow();
  });
});

describe('getLastUsedPassport', () => {
  test('should return passport by ID if found and valid', () => {
    const passports = [
      { passportId: '123', status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test1' },
      { passportId: '456', status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test2' },
    ];

    const result = getLastUsedPassport(passports, '123');
    expect(result).toEqual(passports[0]);
  });

  test('should ignore invalid passport ID matches', () => {
    const passports = [
      { passportId: '123', status: PASSPORT_STATUS.REVOKED, scope: 'passport', name: 'Test1' },
      { passportId: '456', status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test2', lastLoginAt: new Date() },
    ];

    const result = getLastUsedPassport(passports, '123');
    expect(result).toEqual(passports[1]);
  });

  test('should return most recently used passport when no ID provided', () => {
    const now = +new Date();
    const earlier = new Date(now - 1000);
    const passports = [
      { status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test1', lastLoginAt: earlier },
      { status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test2', lastLoginAt: now },
    ];

    const result = getLastUsedPassport(passports);
    expect(result).toEqual(passports[1]);
  });

  test('should handle invalid lastLoginAt dates', () => {
    const passports = [
      { status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test1', lastLoginAt: 'invalid-date' },
      { status: PASSPORT_STATUS.VALID, scope: 'passport', name: 'Test2', lastLoginAt: new Date() },
    ];

    const result = getLastUsedPassport(passports);
    expect(result).toEqual(passports[1]);
  });

  test('should return guest passport when no valid passports exist', () => {
    const passports = [
      { status: PASSPORT_STATUS.REVOKED, scope: 'passport', name: 'Test1' },
      { status: PASSPORT_STATUS.VALID, scope: 'kyc', name: 'Test2' },
    ];

    const result = getLastUsedPassport(passports);
    expect(result).toEqual({ name: 'Guest', role: 'guest' });
  });

  test('should return guest passport for empty passport list', () => {
    const result = getLastUsedPassport([]);
    expect(result).toEqual({ name: 'Guest', role: 'guest' });
  });
});
