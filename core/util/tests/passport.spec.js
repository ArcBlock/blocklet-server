const { describe, expect, test, beforeAll, afterAll, it, mock } = require('bun:test');
const { PASSPORT_STATUS } = require('@abtnode/constant');
const { hasActiveOwnerPassport, getActivePassports } = require('../lib/passport');

test('hasActiveOwnerPassport', () => {
  expect(hasActiveOwnerPassport()).toBe(false);
  expect(hasActiveOwnerPassport({})).toBe(false);
  expect(hasActiveOwnerPassport({ passports: [] })).toBe(false);
  expect(
    hasActiveOwnerPassport({
      passports: [
        {
          role: 'owner',
        },
      ],
    })
  ).toBe(false);
  expect(
    hasActiveOwnerPassport({
      passports: [
        {
          role: 'owner',
          status: 'revoked',
        },
      ],
    })
  ).toBe(false);
  expect(
    hasActiveOwnerPassport({
      passports: [
        {
          role: 'owner',
          status: 'valid',
        },
      ],
    })
  ).toBe(true);
  expect(
    hasActiveOwnerPassport({
      passports: [
        {
          role: 'owner',
          status: 'valid',
        },
        {
          role: 'admin',
          status: 'valid',
        },
      ],
    })
  ).toBe(true);

  const ownerUser = {
    did: 'did:example:owner',
    passports: [
      {
        role: 'owner',
        status: 'valid',
      },
    ],
  };

  expect(
    hasActiveOwnerPassport(ownerUser, {
      blocklet: { settings: { owner: { did: 'did:example:owner' } } },
    })
  ).toBe(true);
  expect(
    hasActiveOwnerPassport(ownerUser, {
      blocklet: { settings: { owner: { did: 'did:example:other' } } },
    })
  ).toBe(false);
  expect(
    hasActiveOwnerPassport(ownerUser, {
      nodeInfo: { nodeOwner: { did: 'did:example:owner' } },
    })
  ).toBe(true);
  expect(
    hasActiveOwnerPassport(ownerUser, {
      nodeInfo: { nodeOwner: { did: 'did:example:other' } },
    })
  ).toBe(false);
  expect(
    hasActiveOwnerPassport(ownerUser, {
      blocklet: { settings: { owner: { did: 'did:example:owner' } } },
      nodeInfo: { nodeOwner: { did: 'did:example:other' } },
    })
  ).toBe(true);
  expect(
    hasActiveOwnerPassport(ownerUser, {
      blocklet: { settings: { owner: { did: 'did:example:other' } } },
      nodeInfo: { nodeOwner: { did: 'did:example:owner' } },
    })
  ).toBe(false);
});

describe('getActivePassports', () => {
  const mockDate = new Date('2023-01-01T00:00:00Z');
  let originalNow;

  beforeAll(() => {
    originalNow = Date.now;
    Date.now = mock(() => mockDate.getTime());
  });

  afterAll(() => {
    Date.now = originalNow;
  });

  it('should return an empty array for a user with no passports', () => {
    const user = { passports: [] };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([]);
  });

  it('should filter out invalid passports', () => {
    const user = {
      passports: [
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
        { status: PASSPORT_STATUS.REVOKED, issuer: { id: 'issuer1' }, name: 'invalid' },
      ],
    };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
    ]);
  });

  it('should filter out passports with issuers not in the issuerDidList', () => {
    const user = {
      passports: [
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer3' }, name: 'invalid' },
      ],
    };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
    ]);
  });

  it('should filter out expired passports', () => {
    const user = {
      passports: [
        {
          status: PASSPORT_STATUS.VALID,
          issuer: { id: 'issuer1' },
          name: 'valid1',
          expirationDate: '2023-01-02T00:00:00Z',
        },
        {
          status: PASSPORT_STATUS.VALID,
          issuer: { id: 'issuer1' },
          name: 'expired',
          expirationDate: '2022-12-31T23:59:59Z',
        },
      ],
    };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([
      {
        status: PASSPORT_STATUS.VALID,
        issuer: { id: 'issuer1' },
        name: 'valid1',
        expirationDate: '2023-01-02T00:00:00Z',
      },
    ]);
  });

  it('should handle passports with display property', () => {
    const user = {
      passports: [
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display1' } },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display2' } },
      ],
    };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display1' } },
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display2' } },
    ]);
  });

  it('should remove duplicates based on name or display.content', () => {
    const user = {
      passports: [
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display1' } },
        { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display1' } },
      ],
    };
    const issuerDidList = ['issuer1', 'issuer2'];
    expect(getActivePassports(user, issuerDidList)).toEqual([
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, name: 'valid1' },
      { status: PASSPORT_STATUS.VALID, issuer: { id: 'issuer1' }, display: { content: 'display1' } },
    ]);
  });
});
