const { test, expect } = require('bun:test');
const getHistoryList = require('../../lib/monitor/get-history-list');

const genHistory = (n) => {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    arr.push(i + 1);
  }
  return arr;
};

test('get-history-list', () => {
  const history = genHistory(10000);

  const res1 = getHistoryList({ history, hours: 1, recordIntervalSec: 10 });
  expect(res1.length).toBe(360);
  expect(res1[359]).toBe(1);
  expect(res1[358]).toBe(2);
  expect(res1[357]).toBe(3);

  const res2 = getHistoryList({ history, hours: 2, recordIntervalSec: 10 });
  expect(res2.length).toBe(360);
  expect(res2[359]).toBe(2);
  expect(res2[358]).toBe(4);
  expect(res2[357]).toBe(6);

  const res3 = getHistoryList({ history, hours: 24, recordIntervalSec: 10 });
  expect(res3.length).toBe(360);
  expect(res3[359]).toBe(24);
  expect(res3[358]).toBe(48);
  expect(res3[357]).toBe(72);

  expect(() => getHistoryList({ history, hours: 0, recordIntervalSec: 10 })).toThrow();
  expect(() => getHistoryList({ history, hours: 25, recordIntervalSec: 10 })).toThrow();

  const res4 = getHistoryList({
    history: [
      { a: 9, b: 9 },
      { a: 1, b: 4 },
      { a: 2, b: 3 },
      { a: 3, b: 2 },
      { a: 4, b: 1 },
    ],
    hours: 2,
    recordIntervalSec: 10,
    props: ['a', 'b'],
  });
  expect(res4.length).toBe(3);
  expect(res4[2]).toEqual({ a: 4, b: 2 });
  expect(res4[1]).toEqual({ a: 2, b: 4 });
  expect(res4[0]).toEqual({ a: 9, b: 9 });
});
