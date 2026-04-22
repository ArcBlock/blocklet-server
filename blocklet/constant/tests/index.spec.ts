import { describe, it, expect } from 'bun:test';

import {
  BlockletStatus,
  BlockletSource,
  fromBlockletStatus,
  toBlockletStatus,
  fromBlockletSource,
  toBlockletSource,
} from '../index';

describe('constants', () => {
  describe('fromBlockletStatus', () => {
    it('should get status name by value', () => {
      Object.keys(BlockletStatus).forEach((k: string) => {
        expect(fromBlockletStatus(BlockletStatus[k as keyof typeof BlockletStatus])).toEqual(k);
      });
    });

    it('should return unknown if is invalid key', () => {
      expect(fromBlockletStatus('test_abc')).toEqual('unknown');
    });
  });

  describe('toBlockletStatus', () => {
    it('should get status name by string value', () => {
      Object.keys(BlockletStatus).forEach((k) => {
        expect(toBlockletStatus(String(BlockletStatus[k as keyof typeof BlockletStatus]))).toEqual(k);
      });
      expect(toBlockletStatus(4)).toBe('installed');
      expect(toBlockletStatus('4')).toBe('installed');
    });
  });

  describe('fromBlockletSource', () => {
    it('should get status name by value', () => {
      Object.keys(BlockletSource).forEach((k) => expect(fromBlockletSource(BlockletSource[k])).toEqual(k));
    });

    it('should return unknown if is invalid key', () => {
      expect(fromBlockletSource('test_abc')).toEqual('unknown');
    });
  });

  describe('toBlockletSource', () => {
    it('should get status name by string value', () => {
      Object.keys(BlockletSource).forEach((k) => {
        expect(toBlockletSource(String(BlockletSource[k]))).toEqual(k);
      });
      expect(toBlockletSource(1)).toBe('local');
      expect(toBlockletSource('1')).toBe('local');
    });
  });
});
