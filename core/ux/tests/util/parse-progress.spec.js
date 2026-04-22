import { describe, expect, test } from 'bun:test';
import parseProgress from '../../src/util/parse-progress';

describe('parseProgress', () => {
  test("should return '' when total is not a number", () => {
    expect(parseProgress(1, 'a')).toEqual(0);
  });
  test("should return '' when total is not a number", () => {
    expect(parseProgress(1, '0')).toEqual(0);
  });

  test("should return '0 %' when progress is 0", () => {
    expect(parseProgress(0, 100)).toEqual(0);
  });

  test("should return '100 %' when progress is equal to total", () => {
    expect(parseProgress(100, 100)).toEqual(100);
  });

  test("should return '' when progress is greater than total", () => {
    expect(parseProgress(101, 100)).toEqual(100);
  });

  test("should return '' when progress or total is negative", () => {
    expect(parseProgress(-1, 100)).toEqual(0);
    expect(parseProgress(100, -1)).toEqual(0);
    expect(parseProgress(-1, -1)).toEqual(0);
  });
});
