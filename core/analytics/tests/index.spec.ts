import { expect, describe, it } from 'bun:test';
import { processLogByDate } from '../index';

describe('processLogByDate', () => {
  it('should be a function', () => {
    expect(typeof processLogByDate).toBe('function');
  });
});
