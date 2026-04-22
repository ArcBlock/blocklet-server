const { test, expect, describe } = require('bun:test');
const { sortMoveListBySrc } = require('../../../../../lib/blocklet/manager/helper/migrate-application-to-struct-v2');

describe('sortMoveListBySrc', () => {
  test('should work as expected', () => {
    expect(sortMoveListBySrc([{ src: '1' }, { src: '12' }])).toEqual([{ src: '12' }, { src: '1' }]);
    expect(sortMoveListBySrc([{ src: '12' }, { src: '1' }])).toEqual([{ src: '12' }, { src: '1' }]);

    expect(sortMoveListBySrc([{ src: '@arcblock/a' }, { src: '@arcblock/a/@arcblock/b' }])).toEqual([
      { src: '@arcblock/a/@arcblock/b' },
      { src: '@arcblock/a' },
    ]);
    expect(sortMoveListBySrc([{ src: '@arcblock/a/@arcblock/b' }, { src: '@arcblock/a' }])).toEqual([
      { src: '@arcblock/a/@arcblock/b' },
      { src: '@arcblock/a' },
    ]);
  });
});
