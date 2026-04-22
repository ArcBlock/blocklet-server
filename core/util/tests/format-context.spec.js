const { test, expect, describe } = require('bun:test');
const formatContext = require('../lib/format-context');

describe('GQL', () => {
  test('should have formatContext method', () => {
    expect(typeof formatContext).toEqual('function');

    const result = formatContext({
      originalUrl: 'https://www.example.com/path',
      user: { avatar: 'xxx', did: '123' },
      headers: {
        'x-real-hostname': 'www.example.com',
        'x-real-port': 80,
        'x-real-protocol': 'https:',
        'x-timezone': 'Asia/Shanghai',
      },
    });

    expect(result).toEqual({
      protocol: 'https',
      ip: '127.0.0.1',
      user: { did: '123', locale: 'en' },
      url: 'https://www.example.com/path',
      query: undefined,
      nodeMode: undefined,
      hostname: 'www.example.com',
      ua: '',
      port: 0,
      referrer: '',
      timezone: 'Asia/Shanghai',
    });
  });
});
