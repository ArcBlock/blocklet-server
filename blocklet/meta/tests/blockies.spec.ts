import { describe, test, expect } from 'bun:test';
import { createBlockiesSvg } from '../src/blockies';

describe('createBlockiesSvg', () => {
  test('should return a valid svg', () => {
    expect(createBlockiesSvg('0x82493a55dBFc58D87cF60880b41884aa228008Ff')).toBeTruthy();
  });
});
