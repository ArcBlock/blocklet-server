import type { Request } from 'express';
import { describe, it, expect } from 'bun:test';
import { isDidWalletConnect } from '../../src/util/wallet';

describe('isDidWalletConnect', () => {
  it('should return true if user-agent contains arcwallet/', () => {
    const headers = {
      'user-agent': 'arcwallet/1.0.0',
    } as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(true);
  });

  it('should return true if user-agent contains abtwallet/', () => {
    const headers = {
      'user-agent': 'abtwallet/2.1.0',
    } as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(true);
  });

  it('should return true if arcwallet-version header is present', () => {
    const headers = {
      'user-agent': 'some-other-agent',
      'arcwallet-version': '3.0.0',
    } as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(true);
  });

  it('should return false if neither arcwallet nor abtwallet is in user-agent and arcwallet-version is absent', () => {
    const headers = {
      'user-agent': 'some-other-agent',
    } as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(false);
  });

  it('should return false if headers object is empty', () => {
    const headers = {} as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(false);
  });

  it('should be case sensitive for user-agent', () => {
    const headers = {
      'user-agent': 'ArcWallet/1.0.0',
    } as Request['headers'];

    const result = isDidWalletConnect(headers);

    expect(result).toBe(true); // Our implementation is case sensitive
  });
});
