const { describe, expect, it } = require('bun:test');
const { isLocalUri } = require('../../lib/util/what-uri');

describe('what-path.spec', () => {
  it('#isLocalUri() should work!', () => {
    expect(isLocalUri('logo.png')).toBeTruthy();
    expect(isLocalUri('./logo.png')).toBeTruthy();
    expect(isLocalUri('./path/logo.png')).toBeTruthy();
    expect(isLocalUri('../../path/logo.png')).toBeTruthy();

    expect(isLocalUri('/abc.txt')).toBeTruthy();
    expect(isLocalUri('/a/b/c.txt')).toBeTruthy();

    expect(isLocalUri('#blocklet-server')).toBeFalsy();
    expect(isLocalUri('file://www.google.com')).toBeFalsy();
    expect(isLocalUri('http://www.npmjs.com/')).toBeFalsy();
    expect(isLocalUri('https://www.npmjs.com/')).toBeFalsy();
    expect(
      isLocalUri('//player.bilibili.com/player.html?aid=540082845&bvid=BV1mi4y1b76M&cid=172799113&page=1')
    ).toBeFalsy();
    expect(
      isLocalUri('://player.bilibili.com/player.html?aid=540082845&bvid=BV1mi4y1b76M&cid=172799113&page=1')
    ).toBeFalsy();
    expect(isLocalUri('https://www.npmjs.com/')).toBeFalsy();
  });
});
