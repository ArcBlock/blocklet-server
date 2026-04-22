const { expect, test } = require('bun:test');

const parseDockerName = require('../../lib/util/docker/parse-docker-name');

test('parse docker name', () => {
  expect(parseDockerName('12345678901234567890', 'blocklet')).toBe('blocklet-12345678901234567890');
  expect(parseDockerName('blocklet-12345678901234567890', 'blocklet')).toBe('blocklet-12345678901234567890');
  expect(parseDockerName('blocklet-1234567890123456789012345678901234567890', 'blocklet')).toBe('blocklet-34567890');

  expect(
    parseDockerName('znkrccltvmo6jqc3jfftu1fuhjut5xtwenev-z2qabp9sahqu2l2ya3ip7necwkacmbytfuij2', 'blocklet')
  ).toBe('blocklet-5xtwenev-z2qabp9sahqu2l2ya3ip7necwkacmbytfuij2');

  expect(
    parseDockerName('blocklet-znkrccltvmo6jqc3jfftu1fuhjut5xtwenev-z2qabp9sahqu2l2ya3ip7necwkacmbytfuij2', 'blocklet')
  ).toBe('blocklet-5xtwenev-z2qabp9sahqu2l2ya3ip7necwkacmbytfuij2');

  expect(
    parseDockerName(
      'blocklet-blocklet-blocklet-znkrccltvmo6jqc3jfftu1fuhjut5xtwenev-z2qabpblocklet-l2ya3ip7necwkacmbytfuij2',
      'blocklet'
    )
  ).toBe('blocklet-5xtwenev-z2qabpblocklet-l2ya3ip7necwkacmbytfuij2');

  expect(
    parseDockerName('blocklet-znkrccltvmo6jqc3jfftu1fuhjut5xtwenev-z2qabpblocklet-l2ya3ip7necwkacmbytfuij2', 'blocklet')
  ).toBe('blocklet-5xtwenev-z2qabpblocklet-l2ya3ip7necwkacmbytfuij2');
});
