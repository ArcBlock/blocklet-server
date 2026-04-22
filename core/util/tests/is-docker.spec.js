/* eslint-disable no-console */
const { describe, test, expect } = require('bun:test');
const isDocker = require('../lib/is-docker');

describe('isDocker', () => {
  test('should return is-docker as expected', () => {
    expect(isDocker({ ABT_NODE_TEST_DOCKER: 'true' })).toBeTruthy();
  });
});
