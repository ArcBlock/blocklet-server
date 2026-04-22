import { describe, expect, it } from 'bun:test';
import {
  BlockletStatus,
  BlockletSource,
  fromBlockletStatus,
  toBlockletStatus,
  fromBlockletSource,
  toBlockletSource,
} from '../src/constants';

describe('constants', () => {
  describe('fromBlockletStatus', () => {
    it('should get status name by value', () => {
      Object.keys(BlockletStatus).forEach((k) =>
        expect(fromBlockletStatus(BlockletStatus[k as keyof typeof BlockletStatus])).toEqual(k)
      );
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
    });
  });
  describe('fromBlockletStatus', () => {
    it('should get status name by value', () => {
      Object.keys(BlockletSource).forEach((k) => expect(fromBlockletSource(BlockletSource[k])).toEqual(k));
    });
    it('should return unknown if is invalid key', () => {
      expect(fromBlockletSource('test_abc')).toEqual('unknown');
    });
  });
  describe('toBlockletStatus', () => {
    it('should get status name by string value', () => {
      Object.keys(BlockletSource).forEach((k) => {
        expect(toBlockletSource(String(BlockletSource[k]))).toEqual(k);
      });
    });
  });
});
