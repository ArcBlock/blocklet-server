import { getBlockletWallet } from '../src/index';

const sk = '0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1880c2175c24943f61dff49f5a063d67553e506bae8a53b7364d5ba3b8bb6be54fe7776aca390e433'; // prettier-ignore

describe('getBlockletWallet', () => {
  test('should throw error when blocklet did is invalid', () => {
    expect(() => getBlockletWallet('', '')).toThrow(/invalid blocklet did/);
  });

  test('should throw error when root sk is invalid', () => {
    expect(() => getBlockletWallet('zNKdqQxDUVz2YkfArfqc1CzjbX2QSNnMk1iW', '')).toThrow(/empty node sk/);
  });

  test('should get correct wallet if custom sk is provided', () => {
    const wallet = getBlockletWallet(sk);
    expect(wallet.address).toEqual('zNKhnwKBjycrCWZEyRWyqFgkidhzQyWYSFnF');
  });

  test('should get correct arc wallet if custom sk is provided', () => {
    const wallet = getBlockletWallet(sk, undefined, 'default');
    expect(wallet.address).toEqual('zNKhnwKBjycrCWZEyRWyqFgkidhzQyWYSFnF');
  });

  test('should get correct arc wallet if custom sk is provided', () => {
    const wallet = getBlockletWallet(sk, undefined, {});
    expect(wallet.address).toEqual('zNKhnwKBjycrCWZEyRWyqFgkidhzQyWYSFnF');
  });

  test('should get correct eth wallet if custom sk is provided', () => {
    const wallet = getBlockletWallet(sk, undefined, 'eth');
    expect(wallet.address).toEqual('0x36284c0cEf403Ea5Ad4C6D2a41b0D36383ed15Fc');
  });

  test('should throw error when invalid custom sk is provided', () => {
    expect(() => getBlockletWallet('0x852bd56edf65cb07a55e3b5c5582173ca3522acdf14333b1', undefined)).toThrow(
      /or custom sk/
    );
  });
});
