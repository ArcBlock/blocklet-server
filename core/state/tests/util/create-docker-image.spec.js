const { describe, expect, test, it } = require('bun:test');
const { addSuffixToImageName } = require('../../lib/util/docker/create-docker-image');

describe('addSuffixToImageName', () => {
  test.each([
    ['mysql', 'mysql-wrap'],
    ['mysql:8.0.0', 'mysql-wrap:8.0.0'],
    ['repo/mysql:8.0.0', 'repo/mysql-wrap:8.0.0'],
    ['registry.local:5000/mysql:8', 'registry.local:5000/mysql-wrap:8'],
    ['repo/mysql@sha256:abcd', 'repo/mysql-wrap@sha256:abcd'],
    ['registry:5000/repo/mysql@sha256:123', 'registry:5000/repo/mysql-wrap@sha256:123'],
  ])('adds suffix without touching tag/digest: %s → %s', (input, expected) => {
    expect(addSuffixToImageName(input)).toBe(expected);
  });

  it('supports a custom suffix', () => {
    expect(addSuffixToImageName('mysql', '-dev')).toBe('mysql-dev');
  });
});
