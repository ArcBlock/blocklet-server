const { test, expect, describe } = require('bun:test');
const createPassportSvg = require('../../lib/util/create-passport-svg');

const { getTextColor } = createPassportSvg;

describe('getTextColor', () => {
  test('should return #111 for light backgrounds', () => {
    expect(getTextColor('#FFFFFF')).toEqual('#111');
    expect(getTextColor('#AED6F1')).toEqual('#111');
    expect(getTextColor('#F7DC6F')).toEqual('#111');
  });

  test('should return #EEE for dark backgrounds', () => {
    expect(getTextColor('#000000')).toEqual('#EEE');
    expect(getTextColor('#17202A')).toEqual('#EEE');
    expect(getTextColor('#641E16')).toEqual('#EEE');
  });
});

describe('createPassportSvg', () => {
  test('should return svg string for passport', () => {
    const svg = createPassportSvg({
      scope: 'passport',
      role: 'admin',
      issuer: 'ArcBlock',
      title: 'Admin',
      issuerDid: 'z1oJJ7Mxn9peb5cKMn1LQZaFj1CWzC99NaQ',
      ownerDid: 'z1oJJ7Mxn9peb5cKMn1LQZaFj1CWzC99NaQ',
      ownerName: 'User',
      ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('Admin');
    expect(svg).toContain('ArcBlock');
  });

  test('should return svg string for kyc', () => {
    const svg = createPassportSvg({
      scope: 'kyc',
      role: 'email',
      issuer: 'ArcBlock',
      title: 'test@arcblock.io',
      issuerDid: 'z1oJJ7Mxn9peb5cKMn1LQZaFj1CWzC99NaQ',
      ownerDid: 'z1oJJ7Mxn9peb5cKMn1LQZaFj1CWzC99NaQ',
      ownerName: 'User',
      ownerAvatarUrl: 'https://avatars.githubusercontent.com/u/1234567890?v=4',
    });
    expect(svg).toContain('<svg');
    expect(svg).toContain('test@arcblock.io');
    expect(svg).toContain('User');
  });
});
