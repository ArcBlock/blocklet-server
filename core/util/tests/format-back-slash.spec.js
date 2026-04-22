const { test, expect, describe } = require('bun:test');
const format = require('../lib/format-back-slash');

describe('format-back-slash', () => {
  test('should replace all backs slashes', () => {
    expect(format('C:\\Users\\arcblock')).toEqual('C:/Users/arcblock');
    expect(format('/home/arcblock')).toEqual('/home/arcblock');
  });
});
